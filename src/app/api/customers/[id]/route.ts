import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { DebtTransactionType, PaymentMethod } from "@prisma/client";

// GET /api/customers/[id] — Full customer profile with debt ledger
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "sales:create",
    });
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        sales: {
          where: { businessId },
          select: {
            id: true,
            saleNumber: true,
            grandTotal: true,
            discountTotal: true,
            status: true,
            createdAt: true,
            payments: {
              select: { paymentMethod: true, amount: true, reference: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        debtTransactions: {
          orderBy: { transactionDate: "desc" },
          take: 100,
          include: {
            recordedByUser: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    const completedSales = customer.sales.filter((s) => s.status === "COMPLETED");
    const totalSpent = completedSales.reduce((sum, s) => sum + Number(s.grandTotal), 0);

    // Compute debt aging buckets
    const now = new Date();
    const debtBuckets = { current: 0, days30: 0, days60: 0, days90plus: 0 };
    for (const tx of customer.debtTransactions) {
      if (tx.type === DebtTransactionType.SALE_CREDIT) {
        const ageMs = now.getTime() - tx.transactionDate.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const amt = Number(tx.amount);
        if (ageDays <= 30) debtBuckets.current += amt;
        else if (ageDays <= 60) debtBuckets.days30 += amt;
        else if (ageDays <= 90) debtBuckets.days60 += amt;
        else debtBuckets.days90plus += amt;
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? undefined,
        tinNumber: customer.tinNumber ?? undefined,
        notes: customer.notes ?? undefined,
        creditLimit: Number(customer.creditLimit),
        currentDebt: Number(customer.currentDebt),
        isActive: customer.isActive,
        totalOrders: customer.sales.length,
        totalSpent,
        lastPurchaseDate: customer.sales[0]?.createdAt?.toISOString() ?? undefined,
        createdAt: customer.createdAt.toISOString(),
        debtAging: debtBuckets,
        sales: customer.sales.map((s) => ({
          id: s.id,
          saleNumber: s.saleNumber,
          grandTotal: Number(s.grandTotal),
          discountTotal: Number(s.discountTotal),
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          paymentMethod: s.payments[0]?.paymentMethod ?? "CASH",
        })),
        ledger: customer.debtTransactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          balanceAfter: Number(tx.balanceAfter),
          saleId: tx.saleId ?? undefined,
          paymentMethod: tx.paymentMethod ?? undefined,
          reference: tx.reference ?? undefined,
          notes: tx.notes ?? undefined,
          recordedBy: tx.recordedByUser.name,
          transactionDate: tx.transactionDate.toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/customers/[id] — Update customer profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "sales:create",
    });
    const { id } = await params;

    const existing = await prisma.customer.findFirst({ where: { id, businessId } });
    if (!existing) throw new AppError("Customer not found.", 404);

    const body = await request.json();
    const { name, phone, tinNumber, notes, creditLimit, isActive } = body || {};

    const updateData: Record<string, unknown> = {};

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) throw new AppError("Name must be at least 2 characters.", 400);
      if (trimmedName !== existing.name) {
        const conflict = await prisma.customer.findUnique({
          where: { businessId_name: { businessId, name: trimmedName } },
        });
        if (conflict && conflict.id !== id) {
          throw new AppError(`Another customer named "${trimmedName}" already exists.`, 409);
        }
      }
      updateData.name = trimmedName;
    }

    if (typeof phone === "string") updateData.phone = phone.trim() || null;
    if (typeof tinNumber === "string") updateData.tinNumber = tinNumber.trim() || null;
    if (typeof notes === "string") updateData.notes = notes.trim() || null;
    if (typeof creditLimit === "number") updateData.creditLimit = Math.max(0, creditLimit);
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const updated = await prisma.customer.update({ where: { id }, data: updateData });

    return NextResponse.json({ success: true, customer: { id: updated.id, name: updated.name } });
  } catch (error) {
    return handleApiError(error);
  }
}

