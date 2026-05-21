# Bloom Aligned Learning Companion

An AI-powered learning platform that helps students understand academic PDFs through Bloom's Taxonomy — from basic recall all the way to creation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port varies, set by workflow)
- `pnpm --filter @workspace/bloom-app run dev` — run the frontend (port varies)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (provisioned automatically)
- Required env: `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui (artifacts/bloom-app)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken), token stored in localStorage as `bloom_token`
- File upload: multer (PDF files, 20MB max, stored in artifacts/api-server/uploads/)
- PDF extraction: pdf-parse
- AI: Mock AI engine (lib/mockAi.ts) — structured for easy OpenAI/Gemini drop-in
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema: users.ts, documents.ts, analyses.ts
- `artifacts/api-server/src/routes/` — Express route handlers (auth.ts, documents.ts)
- `artifacts/api-server/src/lib/mockAi.ts` — Mock AI analysis engine (replace internals with real AI)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware + signToken helper
- `artifacts/bloom-app/src/` — React frontend (pages/, hooks/, components/)
- `artifacts/bloom-app/src/hooks/use-auth.tsx` — AuthContext + JWT token management

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both Zod validation (server) and React Query hooks (client) via Orval codegen. Never hand-write types that codegen produces.
- **Mock AI is modular**: `analyzeDocument()` in `mockAi.ts` is the single integration point. Swap its internals for an OpenAI/Gemini API call — the route handlers don't change.
- **JWT in localStorage**: Token stored under `bloom_token`. The `setAuthTokenGetter` from `@workspace/api-client-react` auto-attaches it as a Bearer header to every API call.
- **PDF text extraction is best-effort**: If pdf-parse fails (e.g., scanned PDFs), the upload still succeeds with `status: pending`. The analysis falls back to the filename.
- **PostgreSQL over MongoDB**: Replit's built-in PostgreSQL is used (not MongoDB) for reliability and rollback support. The schema is relational: users → documents → analyses.

## Product

- **Landing page** — Hero, features, how it works, CTA
- **Auth** — Register / Login with JWT tokens
- **Dashboard** — Stats cards, Bloom level distribution chart, recent documents
- **PDF Upload** — Drag-and-drop upload with language selector (en/es/fr/ar/zh), auto-triggers analysis
- **Results page** — 5 tabs: Summary, Bloom Levels (6 color-coded levels), Quiz (interactive), Flashcards (flip cards), Hints (reasoning prompts)
- **History** — All uploaded documents with concept/flashcard/quiz counts

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before using updated types.
- The `lib/api-client-react` package only exports via `.` (main barrel). Do NOT use subpath imports like `@workspace/api-client-react/custom-fetch` — import from the main barrel instead.
- `req.params.id` in Express 5 is `string | string[]` — always use `GetDocumentParams.safeParse(req.params)` to coerce it.
- Uploads are stored on disk at `artifacts/api-server/uploads/` — not persistent across deploys. For production, move to object storage.
- PDF text extraction requires non-encrypted, text-based PDFs. Scanned/image PDFs will extract no text but still upload successfully.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- AI integration guide: replace `artifacts/api-server/src/lib/mockAi.ts` `analyzeDocument()` with an OpenAI or Gemini API call returning the same `AnalysisOutput` interface
