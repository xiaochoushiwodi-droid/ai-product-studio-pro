# AI Product Studio Pro

AI Product Studio Pro is a Next.js product design workspace for Amazon sellers. The first version includes login, image upload, AI product analysis, AI design generation, material modification, and local project saving.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Mock AI API routes ready to replace with a real model provider

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Project Structure

```text
app/
  api/ai/           Mock AI endpoints
  globals.css       Tailwind styles
  layout.tsx        Root layout
  page.tsx          App entry
components/
  auth/             Login experience
  dashboard/        Studio workspace panels
  upload/           Product image upload
  ui/               Shared UI primitives
lib/
  mock-ai.ts        Replaceable AI logic
  storage.ts        Browser project persistence
  utils.ts          Shared helpers
types/
  product.ts        Domain types
```
