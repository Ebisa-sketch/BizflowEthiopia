import { NextResponse } from "next/server";
import { captureException } from "./sentry";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function handleApiError(error: unknown) {
  const isAppErrorLike =
    error instanceof AppError ||
    (typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number");

  if (isAppErrorLike) {
    const errObj = error as { statusCode: number; message?: string };
    const statusCode = errObj.statusCode || 400;
    // Log warnings for 4xx errors without triggering alerts
    console.warn(`[API_CLIENT_ERROR] Status ${statusCode}:`, errObj.message);
    return NextResponse.json(
      { success: false, error: errObj.message || "An application error occurred." },
      { status: statusCode }
    );
  }

  // 500-level unexpected server exceptions: capture in Sentry/monitoring
  const eventId = captureException(error, { level: "error" });

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message, errorId: eventId },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: "An unexpected server error occurred.", errorId: eventId },
    { status: 500 }
  );
}
