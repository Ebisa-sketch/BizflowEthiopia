import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { DebtTransactionType, PaymentMethod } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const debtorsOnly = searchParams.get("debtors") === "1";
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        isActive: true,
        ...(debtorsOnly ? { currentDebt: { gt: 0 } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        tinNumber: true,
        notes: true,
        creditLimit: true,
        currentDebt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { sales: true },
        },
        sales: {
          where: { businessId },
          select: {
            grandTotal: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ currentDebt: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.customer.count({
      where: {
        businessId,
        isActive: true,
        ...(debtorsOnly ? { currentDebt: { gt: 0 } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    });

    const aggregates = await prisma.customer.aggregate({
      where: { businessId, isActive: true },
      _sum: { currentDebt: true },
      _count: { id: true },
    });

    const debtorCount = await prisma.customer.count({
      where: { businessId, isActive: true, currentDebt: { gt: 0 } },
    });

    const formatted = customers.map((c) => {
      const completedSales = c.sales.filter((s) => s.status === "COMPLETED");
      const totalSpent = completedSales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
      const lastSale = c.sales[0];
      return {
        id: c.id,
        name: c.name,
        phone: c.phone ?? undefined,
        tinNumber: c.tinNumber ?? undefined,
        notes: c.notes ?? undefined,
        creditLimit: Number(c.creditLimit),
        currentDebt: Number(c.currentDebt),
        isActive: c.isActive,
        totalOrders: c._count.sales,
        totalSpent,
        lastPurchaseDate: lastSale?.createdAt?.toISOString() ?? undefined,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      // Legacy flat list for POS customer selector
      customers: formatted.map((c) => (c.phone ? `${c.name} (${c.phone})` : c.name)),
      detailedCustomers: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalCustomers: aggregates._count.id,
        totalOutstandingDebt: Number(aggregates._sum.currentDebt ?? 0),
        activeDebtors: debtorCount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    const body = await request.json();
    const { name, phone, tinNumber, notes, initialDebt, creditLimit } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Customer name or shop name is required.", 400);
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw new AppError("Customer name must be at least 2 characters.", 400);
    }
    if (trimmedName.length > 100) {
      throw new AppError("Customer name must not exceed 100 characters.", 400);
    }

    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    if (trimmedPhone && trimmedPhone.length > 30) {
      throw new AppError("Phone number is too long (maximum 30 characters).", 400);
    }

    const parsedDebt = Math.max(0, Number(initialDebt) || 0);
    const parsedCreditLimit = Math.max(0, Number(creditLimit) || 0);

    // Check for duplicate name within this business
    const existing = await prisma.customer.findUnique({
      where: { businessId_name: { businessId, name: trimmedName } },
    });
    if (existing) {
      if (!existing.isActive) {
        throw new AppError(
          `Customer "${trimmedName}" exists but is inactive. Contact an owner to reactivate them.`,
          409
        );
      }
      throw new AppError(`Customer "${trimmedName}" is already registered.`, 409);
    }

    // Create customer + initial balance transaction atomically
    const customer = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          businessId,
          name: trimmedName,
          phone: trimmedPhone || null,
          tinNumber: typeof tinNumber === "string" ? tinNumber.trim() || null : null,
          notes: typeof notes === "string" ? notes.trim() || null : null,
          creditLimit: parsedCreditLimit,
          currentDebt: parsedDebt,
        },
      });

      if (parsedDebt > 0) {
        await tx.customerDebtTransaction.create({
          data: {
            businessId,
            customerId: newCustomer.id,
            type: DebtTransactionType.INITIAL_BALANCE,
            amount: parsedDebt,
            balanceAfter: parsedDebt,
            notes: "Opening balance on customer registration",
            recordedBy: userId,
          },
        });
      }

      return newCustomer;
    });

    return NextResponse.json(
      {
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
          totalOrders: 0,
          totalSpent: 0,
          createdAt: customer.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
