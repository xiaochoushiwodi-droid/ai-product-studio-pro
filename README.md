# TOGO AI

TOGO AI（图狗）是一个AI产品设计智能平台。

**AI Product Design Engine**

让产品从图片走向商业化设计。

TOGO AI helps Amazon sellers analyze uploaded product images, preserve product identity, apply reference-first AI design edits, generate commercial Amazon images, manage materials, and save design projects.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma billing data layer
- Unified AI Provider layer for vision analysis and image-to-image product editing

## Commercial Billing

TOGO AI includes a credit-based commercial system:

- Ordinary users spend credits before AI calls.
- Admin users bypass credit deduction and can test all AI models.
- AI usage is logged in `AIUsageLog`.
- Credit adjustments and purchases are recorded in `CreditTransaction`.
- Feature costs are managed from `/admin/settings`.

Required production environment variables:

```bash
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TOGO_ADMIN_EMAILS=admin@togo.ai
DEFAULT_USER_CREDITS=100
```

Database setup:

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Project Structure

```text
app/
  api/ai/           AI endpoints
  api/admin/        Admin user and billing controls
  api/credits/      Credit wallet and recharge APIs
  admin/            Admin dashboard
  credits/          User credit wallet
  pricing/          Credit pricing page
  globals.css       Tailwind styles
  layout.tsx        Root layout
  page.tsx          App entry
components/
  auth/             Login experience
  billing/          Credit and admin panels
  dashboard/        Studio workspace panels
  upload/           Product image upload
  ui/               Shared UI primitives
lib/
  ai/               Vision and image provider adapters
  credits.ts        Credit middleware and billing service
  prisma.ts         Prisma client
  mock-ai.ts        Local fallback AI logic
  storage.ts        Browser project persistence
  utils.ts          Shared helpers
prisma/
  schema.prisma     PostgreSQL billing schema
  migrations/       Deployable database migrations
types/
  product.ts        Domain types
```
