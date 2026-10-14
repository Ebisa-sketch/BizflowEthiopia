import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { roundMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "expenses:view",
    });

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category")?.trim();
    const search = searchParams.get("search")?.trim();
    const startDateParam = searchParams.get("startDate")?.trim();
    const endDateParam = searchParams.get("endDate")?.trim();

    const where: any = { businessId };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDateParam || endDateParam) {
      where.expenseDate = {};
      if (startDateParam) {
        where.expenseDate.gte = new Date(startDateParam);
      }
      if (endDateParam) {
        where.expenseDate.lte = new Date(endDateParam);
      }
    }

    // Calculate current month start and end for month total
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [expenses, monthAggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        select: {
          id: true,
          category: true,
          amount: true,
          description: true,
          expenseDate: true,
          user: { select: { name: true } },
        },
        orderBy: { expenseDate: "desc" },
      }),
      prisma.expense.aggregate({
        where: {
          businessId,
          expenseDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const monthlyTotal = Number(monthAggregate._sum.amount ?? 0);

    return NextResponse.json({
      success: true,
      totalAmount,
      monthlyTotal,
      expenses: expenses.map((e) => ({
        id: e.id,
        category: e.category,
        amount: Number(e.amount),
        description: e.description || "",
        date: e.expenseDate.toISOString(),
        recordedBy: e.user.name,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "expenses:manage",
    });

    const body = await request.json();
    const { category, amount, description, expenseDate } = body;

    if (!category || typeof category !== "string" || !category.trim()) {
      throw new AppError("Expense category is required.", 400);
    }

    const numericAmount = roundMoney(Number(amount ?? 0));
    if (numericAmount <= 0) {
      throw new AppError("Expense amount must be greater than zero.", 400);
    }

    let parsedDate = new Date();
    if (expenseDate) {
      const d = new Date(expenseDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const expense = await prisma.expense.create({
      data: {
        businessId,
        category: category.trim(),
        amount: numericAmount,
        description: description?.trim() || null,
        expenseDate: parsedDate,
        createdBy: userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        expense: {
          id: expense.id,
          category: expense.category,
          amount: Number(expense.amount),
          description: expense.description || "",
          date: expense.expenseDate.toISOString(),
          recordedBy: expense.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
