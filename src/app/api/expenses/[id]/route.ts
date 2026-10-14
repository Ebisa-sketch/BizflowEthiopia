import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "expenses:manage",
    });
    const { id } = await params;

    const existing = await prisma.expense.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      throw new AppError("Expense not found.", 404);
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Expense entry deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
