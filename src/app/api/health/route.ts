import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const dbHealth = await checkDatabaseHealth();

  if (dbHealth.status !== "healthy") {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "bizflow-ethiopia-api",
        database: {
          status: "disconnected",
          error: dbHealth.error || "Database connection failed",
          latencyMs: dbHealth.latencyMs,
          pool: dbHealth.pool,
        },
        uptimeSeconds: Math.floor(process.uptime()),
        responseTimeMs: Date.now() - startTime,
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "bizflow-ethiopia-api",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: {
        status: "connected",
        latencyMs: dbHealth.latencyMs,
        pool: dbHealth.pool,
      },
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startTime,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

export async function HEAD() {
  const dbHealth = await checkDatabaseHealth();
  return new Response(null, { status: dbHealth.status === "healthy" ? 200 : 503 });
}

