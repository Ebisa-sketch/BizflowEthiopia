import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    // Find active open shift for this cashier
    let shift = await prisma.tillShift.findFirst({
      where: {
        businessId,
        cashierId: userId,
        status: "OPEN",
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
      },
      orderBy: { openedAt: "desc" },
    });

    if (!shift) {
      return NextResponse.json({
        success: true,
        hasActiveShift: false,
        shift: null,
      });
    }

    // Calculate real-time totals since this shift opened
    const shiftStartTime = shift.openedAt;

    // 1. Cash & digital payments recorded by this cashier since shift started
    const payments = await prisma.payment.findMany({
      where: {
        businessId,
        recordedBy: userId,
        status: "COMPLETED",
        createdAt: { gte: shiftStartTime },
      },
      select: {
        amount: true,
        paymentMethod: true,
      },
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

    // 2. Petty cash expenses recorded by this cashier since shift started
    const expenses = await prisma.expense.findMany({
      where: {
        businessId,
        createdBy: userId,
        createdAt: { gte: shiftStartTime },
      },
      select: {
        amount: true,
      },
    });

    const expensesPaid = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const floatVal = Number(shift.openingFloat);
    const expectedCashInTill = floatVal + cashSales - expensesPaid;

    return NextResponse.json({
      success: true,
      hasActiveShift: true,
      shift: {
        id: shift.id,
        status: shift.status,
        openingFloat: floatVal,
        openedAt: shift.openedAt.toISOString(),
        cashSales,
        digitalSales,
        expensesPaid,
        expectedCashInTill,
        cashier: shift.cashier,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

