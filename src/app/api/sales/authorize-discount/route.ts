import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AppError, handleApiError } from "@/lib/errors";
import { createManagerDiscountGrant } from "@/lib/sales/manager-authorization";

const authorizationSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_AUTHORIZATION_ATTEMPTS = 5;
const attemptsByKey = new Map<string, number[]>();

function allowAttempt(key: string): boolean {
  const now = Date.now();
  if (attemptsByKey.size > 1000) {
    for (const [storedKey, timestamps] of attemptsByKey) {
      const recent = timestamps.filter(
        (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
      );
      if (recent.length === 0) attemptsByKey.delete(storedKey);
      else attemptsByKey.set(storedKey, recent);
    }
  }
  const recentAttempts = (attemptsByKey.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recentAttempts.length >= MAX_AUTHORIZATION_ATTEMPTS) {
    attemptsByKey.set(key, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  attemptsByKey.set(key, recentAttempts);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId: cashierId } = await requireTenant({
      requiredPermission: "sales:create",
    });
    const parsed = authorizationSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new AppError("Enter a valid manager email and password.", 400);
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
    if (
      !allowAttempt(`business:${businessId}:email:${normalizedEmail}`) ||
      !allowAttempt(`ip:${clientIp}`)
    ) {
      return NextResponse.json(
        { success: false, error: "Too many approval attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    const manager = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        passwordHash: true,
        accountStatus: true,
        memberships: {
          where: { businessId, status: "ACTIVE" },
          select: { businessId: true, role: true },
        },
      },
    });

    const membership = manager?.memberships[0];
    if (
      !manager ||
      manager.accountStatus !== "ACTIVE" ||
      !membership ||
      (membership.role !== "OWNER" && membership.role !== "MANAGER") ||
      !(await verifyPassword(parsed.data.password, manager.passwordHash))
    ) {
      throw new AppError("Manager credentials are invalid for this business.", 403);
    }

    const authorizationToken = createManagerDiscountGrant({
      managerUserId: manager.id,
      businessId,
      cashierId,
      permission: "sales:discount",
    });

    return NextResponse.json({ success: true, authorizationToken });
  } catch (error) {
    return handleApiError(error);
  }
}
