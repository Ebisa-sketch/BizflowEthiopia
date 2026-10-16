import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors";
import { roundMoney, calculateFinancialSummary } from "@/lib/money";
import {
  buildPaymentMethodBreakdown,
  buildSalesChartData,
  getEatDateBoundaries,
  type DashboardRange,
} from "@/lib/dashboard-metrics";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "reports:view_operational",
    });

    const searchParams = request.nextUrl.searchParams;
    const requestedRange = (searchParams.get("range") || "today").toLowerCase();
    const range: DashboardRange = ["today", "7d", "30d", "month"].includes(requestedRange)
      ? (requestedRange as DashboardRange)
      : "today";

    const now = new Date();
    const { startDate } = getEatDateBoundaries(range, now);

    const [sales, expensesAgg, allProducts, recentSales, historicalSalesCount, allProductCount, allExpenseCount] = await Promise.all([
      prisma.sale.findMany({
        where: {
          businessId,
          createdAt: { gte: startDate, lte: now },
          status: "COMPLETED",
        },
        select: {
          id: true,
          saleNumber: true,
          createdAt: true,
          grandTotal: true,
          customerName: true,
          items: {
            select: {
              quantity: true,
              unitCostSnapshot: true,
              lineTotal: true,
              productNameSnapshot: true,
            },
          },
          payments: {
            select: {
              amount: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.expense.aggregate({
        where: {
          businessId,
          expenseDate: { gte: startDate, lte: now },
        },
        _sum: { amount: true },
      }),
      prisma.product.findMany({
        where: { businessId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          sku: true,
          quantityOnHand: true,
          reorderLevel: true,
        },
      }),
      prisma.sale.findMany({
        where: {
          businessId,
          createdAt: { gte: startDate, lte: now },
          status: "COMPLETED",
        },
        select: {
          id: true,
          saleNumber: true,
          createdAt: true,
          grandTotal: true,
          customerName: true,
          status: true,
          cashier: {
            select: { name: true },
          },
          items: {
            select: { quantity: true },
          },
          payments: {
            select: { paymentMethod: true, amount: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.sale.count({ where: { businessId } }),
      prisma.product.count({ where: { businessId } }),
      prisma.expense.count({ where: { businessId } }),
    ]);

    // 1. Financial aggregates
    const invoiced = roundMoney(sales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
    const salesCount = sales.length;

    // 2. Payments collected & methods breakdown
    let collected = 0;
    const paymentMethodsMap: Record<string, number> = {
      CASH: 0,
      TELEBIRR: 0,
      CBE_BIRR: 0,
      BANK_TRANSFER: 0,
      OTHER: 0,
    };

    for (const sale of sales) {
      for (const p of sale.payments) {
        const amt = Number(p.amount);
        collected += amt;
        const method = p.paymentMethod || "CASH";
        paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + amt;
      }
    }
    collected = roundMoney(collected);

    // 3. COGS and product profitability
    let cogs = 0;
    const productStats: Record<string, { name: string; units: number; revenue: number; cost: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const itemQuantity = Number(item.quantity);
        const itemCost = itemQuantity * Number(item.unitCostSnapshot);
        cogs += itemCost;

        const name = item.productNameSnapshot;
        const stats = (productStats[name] ??= { name, units: 0, revenue: 0, cost: 0 });
        stats.units += itemQuantity;
        stats.revenue += Number(item.lineTotal);
        stats.cost += itemCost;
      }
    }
    cogs = roundMoney(cogs);

    // 4. Operating Expenses
    const expenses = roundMoney(Number(expensesAgg._sum.amount ?? 0));

    // Calculate complete financial summary (Gross vs Net Profit)
    const financialSummary = calculateFinancialSummary({
      salesInvoiced: invoiced,
      paymentsCollected: collected,
      cogs,
      operatingExpenses: expenses,
    });

    // 5. Dynamic Chart Data with accurate dates (EAT timezone aware)
    const chartData = buildSalesChartData(range, sales, now);

    // Top products
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        units: product.units,
        revenue: roundMoney(product.revenue),
        margin:
          product.revenue > 0
            ? `${(((product.revenue - product.cost) / product.revenue) * 100).toFixed(1)}%`
            : "0.0%",
      }));

    // Low stock items sorted by severity (out of stock first)
    const lowStockItems = allProducts
      .filter((p) => Number(p.quantityOnHand) <= Number(p.reorderLevel))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "N/A",
        stock: Number(p.quantityOnHand),
        reorderLevel: Number(p.reorderLevel),
        isOut: Number(p.quantityOnHand) <= 0,
      }))
      .sort((a, b) => (a.isOut === b.isOut ? a.stock - b.stock : a.isOut ? -1 : 1));

    // Recent transactions with tenant isolation
    const recentTransactions = recentSales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customerName || "Walk-in Customer",
      cashierName: s.cashier?.name || "Cashier",
      grandTotal: roundMoney(Number(s.grandTotal)),
      itemCount: s.items.reduce((sum, item) => sum + Number(item.quantity), 0),
      paymentMethod: s.payments[0]?.paymentMethod || "CASH",
      status: s.status,
    }));

    return NextResponse.json({
      success: true,
      range,
      metrics: {
        invoiced,
        collected,
        cogs,
        expenses,
        grossProfit: financialSummary.grossProfit,
        grossMarginPercentage: financialSummary.grossMarginPercentage,
        netOperatingProfit: financialSummary.netOperatingProfit,
        netMarginPercentage: financialSummary.netMarginPercentage,
        salesCount,
        avgOrderValue: salesCount > 0 ? roundMoney(invoiced / salesCount) : 0,
        chartData,
      },
      lowStockItems,
      topProducts,
      recentTransactions,
      paymentMethods: buildPaymentMethodBreakdown(paymentMethodsMap),
      hasBusinessActivity:
        historicalSalesCount > 0 || allProductCount > 0 || allExpenseCount > 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
