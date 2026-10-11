import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { handleApiError, AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError("All password fields are required.", 400);
    }

    if (newPassword.length < 8) {
      throw new AppError("New password must be at least 8 characters long.", 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError("New password and confirmation password do not match.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Current password is incorrect.", 400);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    if (session.businessId) {
      await prisma.auditLog.create({
        data: {
          businessId: session.businessId,
          actorUserId: user.id,
          action: "PASSWORD_CHANGED",
          entityType: "User",
          entityId: user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
