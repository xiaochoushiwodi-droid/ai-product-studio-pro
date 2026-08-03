import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { canUseMemoryCreditStore, isDatabaseConfigured, prisma } from "@/lib/prisma";

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "DISABLED";

export type CreditFeature =
  | "ai_product_analysis"
  | "ai_design"
  | "product_image_edit"
  | "material_edit"
  | "color_edit"
  | "amazon_images"
  | "engineering_drawing"
  | "exploded_view"
  | "marketing_copy"
  | "marketing_layout"
  | "product_mask"
  | "image_enhance";

export type CreditUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  credits: number;
  totalUsedCredits: number;
  createdAt: string;
};

export type PricingPlanView = {
  id: string;
  slug: string;
  name: string;
  credits: number;
  priceCents: number;
  currency: string;
  enabled: boolean;
  sortOrder: number;
};

export type CreditCostSettingView = {
  id: string;
  feature: CreditFeature;
  label: string;
  credits: number;
};

type MemoryTransaction = {
  id: string;
  userId: string;
  type: "PURCHASE" | "ADMIN_GRANT" | "ADMIN_DEDUCT" | "AI_USAGE" | "REFUND";
  amount: number;
  balanceAfter: number;
  description?: string;
  provider?: string;
  externalId?: string;
  createdAt: string;
};

type MemoryUsageLog = {
  id: string;
  userId: string;
  feature: string;
  model: string;
  creditsUsed: number;
  bypassed: boolean;
  status: string;
  requestId?: string;
  createdAt: string;
};

export const defaultPricingPlans: Array<Omit<PricingPlanView, "id" | "enabled">> = [
  { slug: "starter", name: "Starter", credits: 1000, priceCents: 1900, currency: "USD", sortOrder: 10 },
  { slug: "professional", name: "Professional", credits: 10000, priceCents: 9900, currency: "USD", sortOrder: 20 },
  { slug: "enterprise", name: "Enterprise", credits: 100000, priceCents: 69900, currency: "USD", sortOrder: 30 }
];

export const defaultCreditCosts: Record<CreditFeature, { label: string; credits: number }> = {
  ai_product_analysis: { label: "AI Product Analysis", credits: 10 },
  ai_design: { label: "AI Design Generation", credits: 100 },
  product_image_edit: { label: "AI Image-to-Image Product Edit", credits: 100 },
  material_edit: { label: "Material Replacement", credits: 80 },
  color_edit: { label: "Color Edit", credits: 60 },
  amazon_images: { label: "Amazon 9 Image Generation", credits: 500 },
  engineering_drawing: { label: "Engineering Drawing", credits: 300 },
  exploded_view: { label: "Exploded View", credits: 300 },
  marketing_copy: { label: "Marketing Copy", credits: 30 },
  marketing_layout: { label: "Marketing Image Layout", credits: 50 },
  product_mask: { label: "Product Mask Engine", credits: 20 },
  image_enhance: { label: "Image Enhancement", credits: 40 }
};

const memory = getMemoryCreditStore();

export async function withCreditGuard(
  request: Request,
  input: {
    feature: CreditFeature;
    model: string;
    metadata?: Record<string, unknown>;
  },
  handler: (context: { user: CreditUser; creditsCharged: number; adminBypass: boolean }) => Promise<NextResponse>
) {
  const userResult = await getRequestCreditUser(request);
  if (!userResult.ok) {
    return NextResponse.json(userResult.error, { status: userResult.status });
  }

  const user = userResult.user;
  if (user.status === "DISABLED") {
    return NextResponse.json(
      { error: "ACCOUNT_DISABLED", message: "This TOGO AI account is disabled." },
      { status: 403 }
    );
  }

  if (user.role === "ADMIN") {
    const response = await handler({ user, creditsCharged: 0, adminBypass: true });
    await logAIUsage({
      userId: user.id,
      feature: input.feature,
      model: input.model,
      creditsUsed: 0,
      bypassed: true,
      status: response.status < 400 ? "SUCCESS" : "FAILED",
      metadata: input.metadata
    });
    response.headers.set("x-togo-credit-bypass", "ADMIN");
    response.headers.set("x-togo-credits-remaining", String(user.credits));
    return response;
  }

  const cost = await getFeatureCreditCost(input.feature);
  const charge = await chargeCredits({
    userId: user.id,
    feature: input.feature,
    model: input.model,
    credits: cost.credits,
    metadata: input.metadata
  });

  if (!charge.ok) {
    return NextResponse.json(
      {
        error: "INSUFFICIENT_CREDITS",
        message: "Insufficient credits. Please recharge your TOGO AI account.",
        requiredCredits: cost.credits,
        currentCredits: charge.currentCredits,
        feature: input.feature
      },
      { status: 402 }
    );
  }

  try {
    const response = await handler({ user: charge.user, creditsCharged: cost.credits, adminBypass: false });
    if (response.status >= 400) {
      await refundCredits({
        userId: user.id,
        usageLogId: charge.usageLogId,
        credits: cost.credits,
        feature: input.feature,
        model: input.model,
        status: "FAILED_REFUNDED"
      });
    } else {
      await markUsageStatus(charge.usageLogId, "SUCCESS");
      response.headers.set("x-togo-credits-used", String(cost.credits));
      response.headers.set("x-togo-credits-remaining", String(charge.balanceAfter));
    }
    return response;
  } catch (error) {
    await refundCredits({
      userId: user.id,
      usageLogId: charge.usageLogId,
      credits: cost.credits,
      feature: input.feature,
      model: input.model,
      status: "ERROR_REFUNDED"
    });
    throw error;
  }
}

export async function getRequestCreditUser(request: Request): Promise<
  | { ok: true; user: CreditUser }
  | { ok: false; status: number; error: { error: string; message: string } }
> {
  const email = normalizeEmail(
    request.headers.get("x-togo-user-email") ??
      request.headers.get("x-user-email") ??
      request.headers.get("x-admin-email") ??
      process.env.TOGO_SYSTEM_USER_EMAIL
  );

  if (!email) {
    return {
      ok: false,
      status: 401,
      error: {
        error: "AUTH_REQUIRED",
        message: "TOGO AI credit protection requires a logged-in user email."
      }
    };
  }

  try {
    return { ok: true, user: await getOrCreateCreditUser(email) };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      error: {
        error: "CREDIT_STORE_UNAVAILABLE",
        message: error instanceof Error ? error.message : "Credit store is unavailable."
      }
    };
  }
}

export async function requireAdminCreditUser(request: Request): Promise<
  | { ok: true; user: CreditUser }
  | { ok: false; status: number; error: { error: string; message: string } }
> {
  const userResult = await getRequestCreditUser(request);
  if (!userResult.ok) return userResult;
  if (userResult.user.role !== "ADMIN") {
    return {
      ok: false,
      status: 403,
      error: {
        error: "ADMIN_REQUIRED",
        message: "TOGO AI admin access is required."
      }
    };
  }
  return userResult;
}

export async function getOrCreateCreditUser(email: string): Promise<CreditUser> {
  const role = getBootstrapRole(email);
  const initialCredits = getDefaultUserCredits();

  if (canUseMemoryCreditStore()) {
    const current = memory.users.get(email);
    if (current) {
      if (role === "ADMIN" && current.role !== "ADMIN") {
        current.role = "ADMIN";
      }
      return current;
    }
    const user = {
      id: makeCreditId("user"),
      email,
      role,
      status: "ACTIVE" as const,
      credits: role === "ADMIN" ? 0 : initialCredits,
      totalUsedCredits: 0,
      createdAt: new Date().toISOString()
    };
    memory.users.set(email, user);
    return user;
  }

  assertDatabaseConfigured();
  await ensureBillingBootstrap();
  const user = await prisma.user.upsert({
    where: { email },
    update: role === "ADMIN" ? { role: "ADMIN" } : {},
    create: {
      email,
      role,
      credits: role === "ADMIN" ? 0 : initialCredits
    }
  });
  return mapPrismaUser(user);
}

export async function listPricingPlans(): Promise<PricingPlanView[]> {
  if (canUseMemoryCreditStore()) {
    return Array.from(memory.plans.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  assertDatabaseConfigured();
  await ensureBillingBootstrap();
  const plans = await prisma.pricingPlan.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" }
  });
  return plans.map((plan) => ({
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    credits: plan.credits,
    priceCents: plan.priceCents,
    currency: plan.currency,
    enabled: plan.enabled,
    sortOrder: plan.sortOrder
  }));
}

export async function listCreditCosts(): Promise<CreditCostSettingView[]> {
  if (canUseMemoryCreditStore()) {
    return Array.from(memory.costs.values());
  }

  assertDatabaseConfigured();
  await ensureBillingBootstrap();
  const costs = await prisma.creditCostSetting.findMany({
    orderBy: { feature: "asc" }
  });
  return costs.map((cost) => ({
    id: cost.id,
    feature: cost.feature as CreditFeature,
    label: cost.label,
    credits: cost.credits
  }));
}

export async function updateCreditCost(feature: CreditFeature, credits: number) {
  if (!defaultCreditCosts[feature]) {
    throw new Error(`Unknown credit feature: ${feature}`);
  }
  if (!Number.isInteger(credits) || credits < 0) {
    throw new Error("Credits must be a non-negative integer.");
  }

  if (canUseMemoryCreditStore()) {
    const current = memory.costs.get(feature);
    const updated = {
      id: current?.id ?? makeCreditId("cost"),
      feature,
      label: defaultCreditCosts[feature].label,
      credits
    };
    memory.costs.set(feature, updated);
    return updated;
  }

  assertDatabaseConfigured();
  const updated = await prisma.creditCostSetting.upsert({
    where: { feature },
    update: { credits },
    create: { feature, label: defaultCreditCosts[feature].label, credits }
  });
  return {
    id: updated.id,
    feature: updated.feature as CreditFeature,
    label: updated.label,
    credits: updated.credits
  };
}

export async function listAdminUsers() {
  if (canUseMemoryCreditStore()) {
    return Array.from(memory.users.values()).map((user) => ({
      ...user,
      transactions: memory.transactions
        .filter((transaction) => transaction.userId === user.id)
        .slice(-10)
        .reverse(),
      usageLogs: memory.usageLogs
        .filter((log) => log.userId === user.id)
        .slice(-10)
        .reverse()
    }));
  }

  assertDatabaseConfigured();
  await ensureBillingBootstrap();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
      usageLogs: { orderBy: { createdAt: "desc" }, take: 10 }
    }
  });
  return users.map((user) => ({
    ...mapPrismaUser(user),
    transactions: user.transactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      description: transaction.description ?? undefined,
      provider: transaction.provider ?? undefined,
      externalId: transaction.externalId ?? undefined,
      createdAt: transaction.createdAt.toISOString()
    })),
    usageLogs: user.usageLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      feature: log.feature,
      model: log.model,
      creditsUsed: log.creditsUsed,
      bypassed: log.bypassed,
      status: log.status,
      requestId: log.requestId ?? undefined,
      createdAt: log.createdAt.toISOString()
    }))
  }));
}

export async function getCreditActivity(userId: string) {
  if (canUseMemoryCreditStore()) {
    return {
      transactions: memory.transactions
        .filter((transaction) => transaction.userId === userId)
        .slice(-20)
        .reverse(),
      usageLogs: memory.usageLogs
        .filter((log) => log.userId === userId)
        .slice(-20)
        .reverse()
    };
  }

  assertDatabaseConfigured();
  const [transactions, usageLogs] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.aIUsageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return {
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      description: transaction.description ?? undefined,
      provider: transaction.provider ?? undefined,
      externalId: transaction.externalId ?? undefined,
      createdAt: transaction.createdAt.toISOString()
    })),
    usageLogs: usageLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      feature: log.feature,
      model: log.model,
      creditsUsed: log.creditsUsed,
      bypassed: log.bypassed,
      status: log.status,
      requestId: log.requestId ?? undefined,
      createdAt: log.createdAt.toISOString()
    }))
  };
}

export async function adjustUserCredits(input: {
  userId: string;
  amount: number;
  description: string;
  type?: "ADMIN_GRANT" | "ADMIN_DEDUCT" | "PURCHASE";
  provider?: string;
  externalId?: string;
}) {
  if (!Number.isInteger(input.amount) || input.amount === 0) {
    throw new Error("Credit adjustment amount must be a non-zero integer.");
  }

  if (canUseMemoryCreditStore()) {
    const user = findMemoryUserById(input.userId);
    user.credits += input.amount;
    const transaction: MemoryTransaction = {
      id: makeCreditId("txn"),
      userId: user.id,
      type: input.type ?? (input.amount > 0 ? "ADMIN_GRANT" : "ADMIN_DEDUCT"),
      amount: input.amount,
      balanceAfter: user.credits,
      description: input.description,
      provider: input.provider,
      externalId: input.externalId,
      createdAt: new Date().toISOString()
    };
    memory.transactions.push(transaction);
    return user;
  }

  assertDatabaseConfigured();
  const user = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id: input.userId } });
    if (!current) throw new Error("User not found.");
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: { credits: { increment: input.amount } }
    });
    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: input.type ?? (input.amount > 0 ? "ADMIN_GRANT" : "ADMIN_DEDUCT"),
        amount: input.amount,
        balanceAfter: updated.credits,
        description: input.description,
        provider: input.provider,
        externalId: input.externalId
      }
    });
    return updated;
  });
  return mapPrismaUser(user);
}

export async function updateUserAdminState(input: {
  userId: string;
  role?: UserRole;
  status?: UserStatus;
}) {
  if (canUseMemoryCreditStore()) {
    const user = findMemoryUserById(input.userId);
    if (input.role) user.role = input.role;
    if (input.status) user.status = input.status;
    return user;
  }

  assertDatabaseConfigured();
  const user = await prisma.user.update({
    where: { id: input.userId },
    data: {
      role: input.role,
      status: input.status
    }
  });
  return mapPrismaUser(user);
}

export async function purchasePricingPlan(input: {
  email: string;
  planSlug: string;
  provider: "manual" | "stripe" | "alipay" | "wechat";
  externalId?: string;
}) {
  const user = await getOrCreateCreditUser(input.email);
  const plans = await listPricingPlans();
  const plan = plans.find((item) => item.slug === input.planSlug && item.enabled);
  if (!plan) throw new Error("Pricing plan not found.");

  if (input.provider !== "manual") {
    return {
      status: "PAYMENT_PROVIDER_NOT_CONFIGURED" as const,
      message: `${input.provider} checkout can be connected with the payment provider adapter.`,
      plan
    };
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_MANUAL_CREDIT_TOPUP !== "true") {
    return {
      status: "PAYMENT_PROVIDER_NOT_CONFIGURED" as const,
      message: "Manual credit top-up is disabled in production.",
      plan
    };
  }

  const updatedUser = await adjustUserCredits({
    userId: user.id,
    amount: plan.credits,
    description: `${plan.name} credit recharge`,
    type: "PURCHASE",
    provider: input.provider,
    externalId: input.externalId
  });

  return {
    status: "CREDITS_ADDED" as const,
    plan,
    user: updatedUser
  };
}

async function getFeatureCreditCost(feature: CreditFeature) {
  if (canUseMemoryCreditStore()) {
    return memory.costs.get(feature) ?? seedMemoryCost(feature);
  }

  assertDatabaseConfigured();
  await ensureBillingBootstrap();
  const defaultCost = defaultCreditCosts[feature];
  const cost = await prisma.creditCostSetting.upsert({
    where: { feature },
    update: {},
    create: { feature, label: defaultCost.label, credits: defaultCost.credits }
  });
  return {
    id: cost.id,
    feature: cost.feature as CreditFeature,
    label: cost.label,
    credits: cost.credits
  };
}

async function chargeCredits(input: {
  userId: string;
  feature: CreditFeature;
  model: string;
  credits: number;
  metadata?: Record<string, unknown>;
}): Promise<
  | { ok: true; user: CreditUser; usageLogId: string; balanceAfter: number }
  | { ok: false; currentCredits: number }
> {
  if (canUseMemoryCreditStore()) {
    const user = findMemoryUserById(input.userId);
    if (user.credits < input.credits) {
      return { ok: false, currentCredits: user.credits };
    }
    user.credits -= input.credits;
    user.totalUsedCredits += input.credits;
    const balanceAfter = user.credits;
    memory.transactions.push({
      id: makeCreditId("txn"),
      userId: user.id,
      type: "AI_USAGE",
      amount: -input.credits,
      balanceAfter,
      description: defaultCreditCosts[input.feature].label,
      provider: input.model,
      createdAt: new Date().toISOString()
    });
    const usageLogId = makeCreditId("usage");
    memory.usageLogs.push({
      id: usageLogId,
      userId: user.id,
      feature: input.feature,
      model: input.model,
      creditsUsed: input.credits,
      bypassed: false,
      status: "RESERVED",
      createdAt: new Date().toISOString()
    });
    return { ok: true, user, usageLogId, balanceAfter };
  }

  assertDatabaseConfigured();
  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id: input.userId } });
    if (!current) throw new Error("User not found.");
    if (current.credits < input.credits) {
      return { ok: false as const, currentCredits: current.credits };
    }

    const updated = await tx.user.update({
      where: { id: input.userId },
      data: {
        credits: { decrement: input.credits },
        totalUsedCredits: { increment: input.credits }
      }
    });
    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "AI_USAGE",
        amount: -input.credits,
        balanceAfter: updated.credits,
        description: defaultCreditCosts[input.feature].label,
        provider: input.model,
        metadata: toPrismaJson(input.metadata)
      }
    });
    const usage = await tx.aIUsageLog.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        model: input.model,
        creditsUsed: input.credits,
        bypassed: false,
        status: "RESERVED",
        metadata: toPrismaJson(input.metadata)
      }
    });
    return {
      ok: true as const,
      user: mapPrismaUser(updated),
      usageLogId: usage.id,
      balanceAfter: updated.credits
    };
  });
}

async function refundCredits(input: {
  userId: string;
  usageLogId: string;
  credits: number;
  feature: CreditFeature;
  model: string;
  status: string;
}) {
  if (canUseMemoryCreditStore()) {
    const user = findMemoryUserById(input.userId);
    user.credits += input.credits;
    user.totalUsedCredits = Math.max(0, user.totalUsedCredits - input.credits);
    memory.transactions.push({
      id: makeCreditId("txn"),
      userId: user.id,
      type: "REFUND",
      amount: input.credits,
      balanceAfter: user.credits,
      description: `${defaultCreditCosts[input.feature].label} refund`,
      provider: input.model,
      createdAt: new Date().toISOString()
    });
    const log = memory.usageLogs.find((item) => item.id === input.usageLogId);
    if (log) log.status = input.status;
    return;
  }

  assertDatabaseConfigured();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: {
        credits: { increment: input.credits },
        totalUsedCredits: { decrement: input.credits }
      }
    });
    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "REFUND",
        amount: input.credits,
        balanceAfter: updated.credits,
        description: `${defaultCreditCosts[input.feature].label} refund`,
        provider: input.model
      }
    });
    await tx.aIUsageLog.update({
      where: { id: input.usageLogId },
      data: { status: input.status }
    });
  });
}

async function markUsageStatus(usageLogId: string, status: string) {
  if (canUseMemoryCreditStore()) {
    const log = memory.usageLogs.find((item) => item.id === usageLogId);
    if (log) log.status = status;
    return;
  }

  assertDatabaseConfigured();
  await prisma.aIUsageLog.update({
    where: { id: usageLogId },
    data: { status }
  });
}

async function logAIUsage(input: {
  userId: string;
  feature: CreditFeature;
  model: string;
  creditsUsed: number;
  bypassed: boolean;
  status: string;
  metadata?: Record<string, unknown>;
}) {
  if (canUseMemoryCreditStore()) {
    memory.usageLogs.push({
      id: makeCreditId("usage"),
      userId: input.userId,
      feature: input.feature,
      model: input.model,
      creditsUsed: input.creditsUsed,
      bypassed: input.bypassed,
      status: input.status,
      createdAt: new Date().toISOString()
    });
    return;
  }

  assertDatabaseConfigured();
  await prisma.aIUsageLog.create({
    data: {
      userId: input.userId,
      feature: input.feature,
      model: input.model,
      creditsUsed: input.creditsUsed,
      bypassed: input.bypassed,
      status: input.status,
      metadata: toPrismaJson(input.metadata)
    }
  });
}

async function ensureBillingBootstrap() {
  if (!isDatabaseConfigured()) return;

  await Promise.all(
    defaultPricingPlans.map((plan) =>
      prisma.pricingPlan.upsert({
        where: { slug: plan.slug },
        update: {},
        create: { ...plan, enabled: true }
      })
    )
  );
  await Promise.all(
    Object.entries(defaultCreditCosts).map(([feature, config]) =>
      prisma.creditCostSetting.upsert({
        where: { feature },
        update: {},
        create: { feature, label: config.label, credits: config.credits }
      })
    )
  );
}

function getBootstrapRole(email: string): UserRole {
  const adminEmails = (process.env.TOGO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
  return adminEmails.includes(email) ? "ADMIN" : "USER";
}

function getDefaultUserCredits() {
  const value = Number.parseInt(process.env.DEFAULT_USER_CREDITS ?? "100", 10);
  return Number.isFinite(value) && value >= 0 ? value : 100;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

function toPrismaJson(value?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
  if (!value) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function mapPrismaUser(user: {
  id: string;
  email: string;
  role: string;
  status: string;
  credits: number;
  totalUsedCredits: number;
  createdAt: Date;
}): CreditUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    credits: user.credits,
    totalUsedCredits: user.totalUsedCredits,
    createdAt: user.createdAt.toISOString()
  };
}

function assertDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for TOGO AI commercial credit storage.");
  }
}

function getMemoryCreditStore() {
  const globalForCredits = globalThis as unknown as {
    togoMemoryCreditStore?: {
      users: Map<string, CreditUser>;
      transactions: MemoryTransaction[];
      usageLogs: MemoryUsageLog[];
      plans: Map<string, PricingPlanView>;
      costs: Map<string, CreditCostSettingView>;
    };
  };

  if (!globalForCredits.togoMemoryCreditStore) {
    globalForCredits.togoMemoryCreditStore = {
      users: new Map(),
      transactions: [],
      usageLogs: [],
      plans: new Map(
        defaultPricingPlans.map((plan) => [
          plan.slug,
          {
            id: makeCreditId("plan"),
            ...plan,
            enabled: true
          }
        ])
      ),
      costs: new Map(
        Object.entries(defaultCreditCosts).map(([feature, config]) => [
          feature,
          {
            id: makeCreditId("cost"),
            feature: feature as CreditFeature,
            label: config.label,
            credits: config.credits
          }
        ])
      )
    };
  }
  return globalForCredits.togoMemoryCreditStore;
}

function seedMemoryCost(feature: CreditFeature) {
  const config = defaultCreditCosts[feature];
  const cost = {
    id: makeCreditId("cost"),
    feature,
    label: config.label,
    credits: config.credits
  };
  memory.costs.set(feature, cost);
  return cost;
}

function findMemoryUserById(userId: string) {
  const user = Array.from(memory.users.values()).find((item) => item.id === userId);
  if (!user) throw new Error("User not found.");
  return user;
}

function makeCreditId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}
