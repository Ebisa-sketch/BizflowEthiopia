import { prisma } from "./prisma";

export interface DatabaseHealthReport {
  status: "healthy" | "unhealthy";
  latencyMs: number;
  error?: string;
  timestamp: string;
  pool?: {
    configuredLimit?: number;
    pgbouncer?: boolean;
    ssl?: boolean;
  };
}

/**
 * Checks PostgreSQL connectivity by executing a fast `SELECT 1` query.
 * Measures roundtrip latency and inspects connection URL capabilities.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthReport> {
  const start = Date.now();
  const dbUrl = process.env.DATABASE_URL || "";

  // Infer pool characteristics from DATABASE_URL
  const pool = {
    configuredLimit: dbUrl.includes("connection_limit=")
      ? parseInt(dbUrl.split("connection_limit=")[1]?.split("&")[0] || "10", 10)
      : 10,
    pgbouncer: dbUrl.includes("pgbouncer=true"),
    ssl: dbUrl.includes("sslmode=require"),
  };

  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    return {
      status: "healthy",
      latencyMs,
      timestamp: new Date().toISOString(),
      pool,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);

    return {
      status: "unhealthy",
      latencyMs,
      error: errorMsg,
      timestamp: new Date().toISOString(),
      pool,
    };
  }
}
