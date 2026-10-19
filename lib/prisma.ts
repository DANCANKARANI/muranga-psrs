import { PrismaClient } from "@prisma/client";

function getDatasourceUrl(): string | undefined {
  const configuredUrl = process.env.DATABASE_URL;
  if (!configuredUrl || process.env.NODE_ENV !== "development") return configuredUrl;

  try {
    const url = new URL(configuredUrl);
    const connectionLimit = Number(url.searchParams.get("connection_limit") ?? "1");
    if (connectionLimit < 5) url.searchParams.set("connection_limit", "5");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "30");
    return url.toString();
  } catch {
    return configuredUrl;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(process.env.NODE_ENV === "development"
      ? { datasources: { db: { url: getDatasourceUrl() } } }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
