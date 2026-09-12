# Bloom Insight Engine

Bloom Insight Engine is an AI-powered learning platform that helps students understand academic PDFs using Bloom's Taxonomy—from recall and comprehension to application, analysis, synthesis, and creation.

## Overview

The platform lets users:

- register and log in securely
- upload PDF learning materials
- extract text from uploaded documents
- analyze content against Bloom's cognitive levels
- review summaries, quizzes, flashcards, and hints
- track results and learning history

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Express.js, TypeScript
- Database: PostgreSQL + Drizzle ORM
- Auth: JWT with bcryptjs
- Validation: Zod
- AI layer: mock AI engine designed for easy replacement with OpenAI or Gemini
- Build tooling: pnpm workspaces, TypeScript, esbuild

## Project Structure

- artifacts/bloom-app — frontend application
- artifacts/api-server — backend API server
- lib/db — database schema and connection layer
- lib/api-spec — OpenAPI specification
- lib/api-client-react — generated API client
- lib/api-zod — generated Zod validation schemas

## Features

- landing page and product overview
- user authentication
- dashboard with learning analytics
- PDF upload workflow
- automated document analysis
- Bloom level breakdown
- interactive quiz generation
- flashcards and reasoning hints
- document history and results tracking

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 22+
- pnpm
- PostgreSQL database

## Environment Variables

Set the following environment variables before starting the backend:

- PORT
- DATABASE_URL
- SESSION_SECRET
- BASE_PATH

Example:

```bash
export PORT=8080
export DATABASE_URL=postgres://user:password@localhost:5432/bloom
export SESSION_SECRET=your-secret-key
export BASE_PATH=/
```

## Installation

From the project root:

```bash
npx pnpm install --ignore-scripts
```

## Run the Project

Start the API server:

```bash
npx pnpm --filter @workspace/api-server run build
npx pnpm --filter @workspace/api-server run start
```

Start the frontend:

```bash
cd artifacts/bloom-app
PORT=21646 BASE_PATH=/ npx vite --config vite.config.ts --host 0.0.0.0
```

## Production Build

```bash
npx pnpm run build
```

## Typecheck

```bash
npx pnpm run typecheck
```

## Notes

- The API is configured for a contract-first workflow driven by the OpenAPI spec.
- The mock AI layer can be replaced with a real provider such as OpenAI or Gemini.
- Uploaded files are stored locally in the API uploads directory during development.

## License

This project is for educational and prototype use.

## Contributing

Contributions are welcome. Please create a feature branch, make your changes, and open a pull request.

## GitHub

To publish this project on GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
```
