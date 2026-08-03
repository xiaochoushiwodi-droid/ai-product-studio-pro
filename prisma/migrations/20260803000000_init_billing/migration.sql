CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'ADMIN_GRANT', 'ADMIN_DEDUCT', 'AI_USAGE', 'REFUND');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "credits" INTEGER NOT NULL DEFAULT 0,
  "total_used_credits" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_transactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balance_after" INTEGER NOT NULL,
  "description" TEXT,
  "provider" TEXT,
  "external_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_usage_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "credits_used" INTEGER NOT NULL,
  "bypassed" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',
  "request_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_plans" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credit_cost_settings" (
  "id" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "credit_cost_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "credit_transactions_user_id_created_at_idx" ON "credit_transactions"("user_id", "created_at");
CREATE INDEX "ai_usage_logs_user_id_created_at_idx" ON "ai_usage_logs"("user_id", "created_at");
CREATE INDEX "ai_usage_logs_feature_created_at_idx" ON "ai_usage_logs"("feature", "created_at");
CREATE UNIQUE INDEX "pricing_plans_slug_key" ON "pricing_plans"("slug");
CREATE UNIQUE INDEX "credit_cost_settings_feature_key" ON "credit_cost_settings"("feature");

ALTER TABLE "credit_transactions"
  ADD CONSTRAINT "credit_transactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_usage_logs"
  ADD CONSTRAINT "ai_usage_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
