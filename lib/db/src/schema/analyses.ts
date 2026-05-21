import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().unique(),
  summary: text("summary").notNull(),
  keyConcepts: jsonb("key_concepts").notNull().$type<string[]>(),
  bloomLevels: jsonb("bloom_levels").notNull().$type<Array<{
    level: string;
    concepts: string[];
    description: string;
  }>>(),
  flashcards: jsonb("flashcards").notNull().$type<Array<{
    id: number;
    front: string;
    back: string;
    bloomLevel: string;
  }>>(),
  quiz: jsonb("quiz").notNull().$type<Array<{
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    bloomLevel: string;
  }>>(),
  hints: jsonb("hints").notNull().$type<string[]>(),
  language: text("language").notNull().default("en"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
