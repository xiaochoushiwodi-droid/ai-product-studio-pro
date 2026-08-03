import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  togoPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.togoPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.togoPrisma = prisma;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function canUseMemoryCreditStore() {
  return !isDatabaseConfigured() && process.env.NODE_ENV !== "production";
}
