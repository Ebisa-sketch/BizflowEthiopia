import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "disconnected";
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "bizflow-ethiopia-api",
        database: {
          status: dbStatus,
          error: error instanceof Error ? error.message : "Database connection failed",
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
        status: dbStatus,
        latencyMs: dbLatencyMs,
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
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}

