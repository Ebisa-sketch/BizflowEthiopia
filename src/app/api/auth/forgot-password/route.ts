import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new AppError("A valid email address is required.", 400);
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: { memberships: { take: 1 } },
    });

    if (user) {
      // Record security audit log
      await prisma.auditLog.create({
        data: {
          businessId: user.memberships[0]?.businessId || null,
          actorUserId: user.id,
          action: "PASSWORD_RECOVERY_REQUESTED",
          entityType: "User",
          entityId: user.id,
          metadata: { email: trimmedEmail, timestamp: new Date().toISOString() },
        },
      });
    }

    // Always return success to protect against user account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, recovery instructions have been dispatched.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
