import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { DebtTransactionType, PaymentMethod } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    const body = await request.json();
    const { customerId, amount, paymentMethod, reference, notes } = body || {};

    if (!customerId || typeof customerId !== "string") {
      throw new AppError("Customer ID is required for repayment.", 400);
    }

    const repayAmount = Number(amount);
    if (!repayAmount || isNaN(repayAmount) || repayAmount <= 0) {
      throw new AppError("A valid repayment amount greater than zero is required.", 400);
    }

    const validMethods: string[] = ["CASH", "TELEBIRR", "CBE_BIRR", "BANK_TRANSFER", "OTHER"];
    const rawMethod = typeof paymentMethod === "string" ? paymentMethod.toUpperCase() : "CASH";
    const method = validMethods.includes(rawMethod) ? (rawMethod as PaymentMethod) : PaymentMethod.CASH;

    // Find customer and lock row for update
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });
    if (!customer) {
      throw new AppError("Customer not found in this business.", 404);
    }
    if (!customer.isActive) {
      throw new AppError("Cannot record repayment for an inactive customer.", 400);
    }
    if (Number(customer.currentDebt) <= 0) {
      throw new AppError("This customer has no outstanding debt to repay.", 400);
    }

    const currentDebt = Number(customer.currentDebt);
    const cappedAmount = Math.min(repayAmount, currentDebt);
    const newDebt = Math.max(0, currentDebt - cappedAmount);

    const result = await prisma.$transaction(async (tx) => {
      // Update the customer balance
      const updated = await tx.customer.update({
        where: { id: customerId },
        data: { currentDebt: newDebt },
      });

      // Create ledger entry
      const txRecord = await tx.customerDebtTransaction.create({
        data: {
          businessId,
          customerId,
          type: DebtTransactionType.REPAYMENT,
          amount: -cappedAmount,
          balanceAfter: newDebt,
          paymentMethod: method,
          reference: typeof reference === "string" ? reference.trim() || null : null,
          notes: typeof notes === "string" ? notes.trim() || null : null,
          recordedBy: userId,
        },
      });

      return { customer: updated, transaction: txRecord };
    });

    return NextResponse.json({
      success: true,
      message: `Repayment of ETB ${cappedAmount.toFixed(2)} recorded for ${customer.name}.`,
      newBalance: newDebt,
      transactionId: result.transaction.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
