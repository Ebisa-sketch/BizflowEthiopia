import { NextResponse } from "next/server";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error encountered:", error);

  const isAppErrorLike =
    error instanceof AppError ||
    (typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number");

  if (isAppErrorLike) {
    const errObj = error as { statusCode: number; message?: string };
    const statusCode = errObj.statusCode || 400;
    return NextResponse.json(
      { success: false, error: errObj.message || "An application error occurred." },
      { status: statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: "An unexpected server error occurred." },
    { status: 500 }
  );
}
