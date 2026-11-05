import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    const body = await request.json().catch(() => ({}));
    const { shiftId, actualCash, denominationCounts, notes } = body;

    // Locate the open shift
    const shift = shiftId
      ? await prisma.tillShift.findFirst({
          where: { id: shiftId, businessId, status: "OPEN" },
          include: { cashier: { select: { id: true, name: true } } },
        })
      : await prisma.tillShift.findFirst({
          where: { businessId, cashierId: userId, status: "OPEN" },
          include: { cashier: { select: { id: true, name: true } } },
          orderBy: { openedAt: "desc" },
        });

    if (!shift) {
      throw new AppError("No active open till shift found to close.", 404);
    }

    const countedCash = Math.max(0, Number(actualCash) || 0);

    // Calculate all payments & expenses between shift.openedAt and now
    const now = new Date();
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        recordedBy: shift.cashierId,
        status: "COMPLETED",
        createdAt: { gte: shift.openedAt, lte: now },
      },
      select: { amount: true, paymentMethod: true },
    });

    let cashSales = 0;
    let digitalSales = 0;
    for (const p of payments) {
      const amt = Number(p.amount);
      if (p.paymentMethod === "CASH") {
        cashSales += amt;
      } else {
        digitalSales += amt;
      }
    }

    const expenses = await prisma.expense.findMany({
      where: {
        businessId,
        createdBy: shift.cashierId,
        createdAt: { gte: shift.openedAt, lte: now },
      },
      select: { amount: true },
    });

    const expensesPaid = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const floatVal = Number(shift.openingFloat);
    const expectedCash = floatVal + cashSales - expensesPaid;
    const variance = countedCash - expectedCash;

    // Update and close the shift atomically
    const closedShift = await prisma.tillShift.update({
      where: { id: shift.id },
      data: {
        status: "CLOSED",
        cashSales,
        digitalSales,
        expensesPaid,
        expectedCash,
        actualCash: countedCash,
        variance,
        denominationCounts: denominationCounts || null,
        notes: typeof notes === "string" ? notes.trim() : shift.notes,
        closedAt: now,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        businessId,
        actorUserId: userId,
        action: "TILL_SHIFT_CLOSED",
        entityType: "TillShift",
        entityId: closedShift.id,
        metadata: {
          openingFloat: floatVal,
          cashSales,
          digitalSales,
          expensesPaid,
          expectedCash,
          actualCash: countedCash,
          variance,
          closedAt: now.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Shift closed. Variance: ${variance >= 0 ? "+" : ""}${variance.toFixed(2)} ETB (${variance === 0 ? "Balanced" : variance > 0 ? "Overage" : "Shortage"}).`,
      shift: {
        id: closedShift.id,
        status: closedShift.status,
        openingFloat: floatVal,
        cashSales,
        digitalSales,
        expensesPaid,
        expectedCash,
        actualCash: countedCash,
        variance,
        closedAt: now.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
