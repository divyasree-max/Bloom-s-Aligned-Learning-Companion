import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, documentsTable, analysesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { analyzeDocument } from "../lib/mockAi";
import { GetDocumentParams, DeleteDocumentParams, AnalyzeContentBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// POST /upload-pdf
router.post("/upload-pdf", requireAuth, upload.single("file"), async (req: AuthRequest, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file uploaded" });
    return;
  }

  const language = (req.body.language as string | undefined) ?? "en";

  let extractedText: string | null = null;
  let pageCount: number | null = null;

  try {
    const pdfParse = (await import("pdf-parse")).default;
    const fileBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(fileBuffer);
    extractedText = pdfData.text;
    pageCount = pdfData.numpages;
  } catch (err) {
    req.log.warn({ err }, "PDF text extraction failed, proceeding without text");
  }

  const [doc] = await db
    .insert(documentsTable)
    .values({
      userId: req.userId!,
      filename: req.file.filename,
      originalName: req.file.originalname,
      language,
      extractedText,
      pageCount,
      status: extractedText ? "extracted" : "pending",
    })
    .returning();

  res.status(201).json({
    id: doc.id,
    userId: doc.userId,
    filename: doc.filename,
    originalName: doc.originalName,
    language: doc.language,
    extractedText: doc.extractedText,
    pageCount: doc.pageCount,
    status: doc.status,
    createdAt: doc.createdAt,
    analyzedAt: doc.analyzedAt,
  });
});

// POST /analyze-content
router.post("/analyze-content", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = AnalyzeContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { documentId, language } = parsed.data;

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(and(eq(documentsTable.id, documentId), eq(documentsTable.userId, req.userId!)));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const textToAnalyze = doc.extractedText ?? `Document: ${doc.originalName}`;
  const lang = (language as string | undefined) ?? doc.language ?? "en";

  const aiResult = await analyzeDocument(textToAnalyze, lang);

  // Upsert analysis
  const existing = await db.select().from(analysesTable).where(eq(analysesTable.documentId, documentId));

  let analysis;
  if (existing.length > 0) {
    const [updated] = await db
      .update(analysesTable)
      .set({
        summary: aiResult.summary,
        keyConcepts: aiResult.keyConcepts,
        bloomLevels: aiResult.bloomLevels,
        flashcards: aiResult.flashcards,
        quiz: aiResult.quiz,
        hints: aiResult.hints,
        language: aiResult.language,
        analyzedAt: new Date(),
      })
      .where(eq(analysesTable.documentId, documentId))
      .returning();
    analysis = updated;
  } else {
    const [created] = await db
      .insert(analysesTable)
      .values({
        documentId,
        summary: aiResult.summary,
        keyConcepts: aiResult.keyConcepts,
        bloomLevels: aiResult.bloomLevels,
        flashcards: aiResult.flashcards,
        quiz: aiResult.quiz,
        hints: aiResult.hints,
        language: aiResult.language,
        analyzedAt: new Date(),
      })
      .returning();
    analysis = created;
  }

  // Mark document as analyzed
  await db
    .update(documentsTable)
    .set({ status: "analyzed", analyzedAt: new Date() })
    .where(eq(documentsTable.id, documentId));

  res.json({
    documentId: analysis.documentId,
    summary: analysis.summary,
    keyConcepts: analysis.keyConcepts,
    bloomLevels: analysis.bloomLevels,
    flashcards: analysis.flashcards,
    quiz: analysis.quiz,
    hints: analysis.hints,
    language: analysis.language,
    analyzedAt: analysis.analyzedAt,
  });
});

// GET /documents
router.get("/documents", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, req.userId!))
    .orderBy(desc(documentsTable.createdAt));

  res.json(docs.map((d) => ({
    id: d.id,
    userId: d.userId,
    filename: d.filename,
    originalName: d.originalName,
    language: d.language,
    extractedText: d.extractedText,
    pageCount: d.pageCount,
    status: d.status,
    createdAt: d.createdAt,
    analyzedAt: d.analyzedAt,
  })));
});

// GET /documents/:id
router.get("/documents/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(and(eq(documentsTable.id, params.data.id), eq(documentsTable.userId, req.userId!)));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.documentId, doc.id));

  res.json({
    document: {
      id: doc.id,
      userId: doc.userId,
      filename: doc.filename,
      originalName: doc.originalName,
      language: doc.language,
      extractedText: doc.extractedText,
      pageCount: doc.pageCount,
      status: doc.status,
      createdAt: doc.createdAt,
      analyzedAt: doc.analyzedAt,
    },
    analysis: analysis
      ? {
          documentId: analysis.documentId,
          summary: analysis.summary,
          keyConcepts: analysis.keyConcepts,
          bloomLevels: analysis.bloomLevels,
          flashcards: analysis.flashcards,
          quiz: analysis.quiz,
          hints: analysis.hints,
          language: analysis.language,
          analyzedAt: analysis.analyzedAt,
        }
      : null,
  });
});

// DELETE /documents/:id
router.delete("/documents/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(and(eq(documentsTable.id, params.data.id), eq(documentsTable.userId, req.userId!)));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  // Clean up uploaded file
  const filePath = path.join(process.cwd(), "uploads", doc.filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Non-fatal
  }

  await db.delete(analysesTable).where(eq(analysesTable.documentId, doc.id));
  await db.delete(documentsTable).where(eq(documentsTable.id, doc.id));

  res.json({ message: "Document deleted" });
});

// GET /history
router.get("/history", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, req.userId!))
    .orderBy(desc(documentsTable.createdAt));

  const items = await Promise.all(
    docs.map(async (doc) => {
      const [analysis] = await db
        .select()
        .from(analysesTable)
        .where(eq(analysesTable.documentId, doc.id));

      return {
        document: {
          id: doc.id,
          userId: doc.userId,
          filename: doc.filename,
          originalName: doc.originalName,
          language: doc.language,
          extractedText: doc.extractedText,
          pageCount: doc.pageCount,
          status: doc.status,
          createdAt: doc.createdAt,
          analyzedAt: doc.analyzedAt,
        },
        conceptCount: analysis ? (analysis.keyConcepts as string[]).length : 0,
        flashcardCount: analysis ? (analysis.flashcards as unknown[]).length : 0,
        quizCount: analysis ? (analysis.quiz as unknown[]).length : 0,
      };
    })
  );

  res.json({
    items,
    totalDocuments: docs.length,
    totalAnalyzed: docs.filter((d) => d.status === "analyzed").length,
  });
});

// GET /stats
router.get("/stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.userId, req.userId!))
    .orderBy(desc(documentsTable.createdAt));

  const analyses = await Promise.all(
    docs
      .filter((d) => d.status === "analyzed")
      .map((d) =>
        db.select().from(analysesTable).where(eq(analysesTable.documentId, d.id)).then((r) => r[0])
      )
  );

  const validAnalyses = analyses.filter(Boolean);

  const totalFlashcards = validAnalyses.reduce(
    (sum, a) => sum + (a ? (a.flashcards as unknown[]).length : 0),
    0
  );
  const totalQuestions = validAnalyses.reduce(
    (sum, a) => sum + (a ? (a.quiz as unknown[]).length : 0),
    0
  );

  const bloomLevelCounts: Record<string, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };

  for (const a of validAnalyses) {
    if (!a) continue;
    for (const bl of a.bloomLevels as Array<{ level: string; concepts: string[] }>) {
      if (bl.level in bloomLevelCounts) {
        bloomLevelCounts[bl.level] += bl.concepts.length;
      }
    }
  }

  res.json({
    totalDocuments: docs.length,
    analyzedDocuments: docs.filter((d) => d.status === "analyzed").length,
    totalFlashcards,
    totalQuestions,
    recentDocuments: docs.slice(0, 5).map((d) => ({
      id: d.id,
      userId: d.userId,
      filename: d.filename,
      originalName: d.originalName,
      language: d.language,
      extractedText: d.extractedText,
      pageCount: d.pageCount,
      status: d.status,
      createdAt: d.createdAt,
      analyzedAt: d.analyzedAt,
    })),
    bloomLevelDistribution: Object.entries(bloomLevelCounts).map(([level, count]) => ({
      level,
      count,
    })),
  });
});

export default router;
