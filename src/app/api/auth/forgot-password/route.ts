import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { createResetToken } from "@/lib/auth/password-reset";
import {
  getClientIp,
  forgotPasswordRateLimiter,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new AppError("A valid email address is required.", 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(request);
    const rateLimitKey = `forgot:${clientIp}:${trimmedEmail}`;

    const rateLimitStatus = forgotPasswordRateLimiter.consume(rateLimitKey);
    if (!rateLimitStatus.allowed) {
      return createRateLimitResponse(
        rateLimitStatus,
        `Too many password reset requests. Please wait ${Math.ceil(rateLimitStatus.retryAfterSeconds / 60)} minutes before requesting another reset.`
      );
    }

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: { memberships: { take: 1 } },
    });

    let resetUrl: string | undefined = undefined;

    if (user && user.accountStatus === "ACTIVE") {
      const { rawToken, expiresAt } = await createResetToken(user.id);

      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
      const proto = request.headers.get("x-forwarded-proto") || "http";
      resetUrl = `${proto}://${host}/reset-password?token=${rawToken}`;

      console.log(`[PASSWORD_RECOVERY] Generated reset link for ${trimmedEmail}: ${resetUrl}`);

      // Record security audit log
      await prisma.auditLog.create({
        data: {
          businessId: user.memberships[0]?.businessId || null,
          actorUserId: user.id,
          action: "PASSWORD_RECOVERY_REQUESTED",
          entityType: "User",
          entityId: user.id,
          metadata: { email: trimmedEmail, expiresAt: expiresAt.toISOString() },
        },
      });
    }

    // Always return success to protect against user account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, recovery instructions have been dispatched.",
      ...(process.env.NODE_ENV !== "production" || !process.env.SMTP_HOST ? { resetUrl } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
