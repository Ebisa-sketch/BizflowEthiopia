import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { handleApiError, AppError } from "@/lib/errors";
import {
  findResetRecord,
  consumeResetToken,
  maskEmail,
} from "@/lib/auth/password-reset";

const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid or missing recovery token"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * GET /api/auth/reset-password?token=...
 * Validates whether a token is active and unexpired before presenting the reset form
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      throw new AppError("Password reset token is required.", 400);
    }

    const resetRecord = await findResetRecord(token);

    if (!resetRecord) {
      return NextResponse.json({
        valid: false,
        error: "This password recovery link is invalid or has expired.",
      });
    }

    if (resetRecord.usedAt) {
      return NextResponse.json({
        valid: false,
        error: "This recovery link has already been used. Please request a new one.",
      });
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json({
        valid: false,
        error: "This recovery link has expired (valid for 1 hour). Please request a new one.",
      });
    }

    if (resetRecord.user.accountStatus !== "ACTIVE") {
      return NextResponse.json({
        valid: false,
        error: "This account has been deactivated or suspended.",
      });
    }

    return NextResponse.json({
      valid: true,
      maskedEmail: maskEmail(resetRecord.user.email),
      userName: resetRecord.user.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/auth/reset-password
 * Completes password reset, hashes new password with bcrypt, marks token as used, and logs security audit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const resetRecord = await findResetRecord(token);

    if (!resetRecord) {
      throw new AppError("Invalid or expired password reset link.", 400);
    }

    if (resetRecord.usedAt) {
      throw new AppError("This reset link has already been used. Please request a new one.", 400);
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new AppError("This reset link has expired. Please request a new one.", 400);
    }

    if (resetRecord.user.accountStatus !== "ACTIVE") {
      throw new AppError("Account has been deactivated or suspended.", 403);
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Atomically update user password, mark token as used, and log security audit
    await consumeResetToken(resetRecord, passwordHash);

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You can now log in with your new credentials.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
