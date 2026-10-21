import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors";
import { roundMoney, calculateFinancialSummary } from "@/lib/money";
import {
  buildPaymentMethodBreakdown,
  buildSalesChartData,
  calculateMetricChange,
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
    const { startDate, previousStartDate, previousEndDate } = getEatDateBoundaries(range, now);

    const [
      sales,
      expensesAgg,
      allProducts,
      recentSales,
      historicalSalesCount,
      allProductCount,
      allExpenseCount,
      allCreditSales,
      prevSales,
      prevExpensesAgg,
    ] = await Promise.all([
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
          subtotal: true,
          discountTotal: true,
          taxTotal: true,
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
              reference: true,
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
          sellingPrice: true,
          costPrice: true,
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
            select: { quantity: true, productNameSnapshot: true },
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
      prisma.sale.findMany({
        where: {
          businessId,
          payments: {
            some: {
              paymentMethod: "OTHER",
              OR: [
                { reference: { contains: "IDDA" } },
                { reference: { contains: "CREDIT" } },
              ],
            },
          },
        },
        select: {
          grandTotal: true,
          customerName: true,
        },
      }),
      prisma.sale.findMany({
        where: {
          businessId,
          createdAt: { gte: previousStartDate, lt: previousEndDate },
          status: "COMPLETED",
        },
        select: {
          grandTotal: true,
          items: {
            select: {
              quantity: true,
              unitCostSnapshot: true,
            },
          },
        },
      }),
      prisma.expense.aggregate({
        where: {
          businessId,
          expenseDate: { gte: previousStartDate, lt: previousEndDate },
        },
        _sum: { amount: true },
      }),
    ]);

    // 1. Financial aggregates
    const invoiced = roundMoney(sales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
    const subtotal = roundMoney(sales.reduce((sum, s) => sum + Number(s.subtotal || 0), 0));
    const discountTotal = roundMoney(sales.reduce((sum, s) => sum + Number(s.discountTotal || 0), 0));
    const taxTotal = roundMoney(sales.reduce((sum, s) => sum + Number(s.taxTotal || 0), 0));
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
    const paymentMethodsCountMap: Record<string, number> = {
      CASH: 0,
      TELEBIRR: 0,
      CBE_BIRR: 0,
      BANK_TRANSFER: 0,
      OTHER: 0,
    };

    let creditDebtInRange = 0;
    let creditSalesCount = 0;

    for (const sale of sales) {
      let isStoreCredit = false;
      for (const p of sale.payments) {
        const amt = Number(p.amount);
        collected += amt;
        const method = p.paymentMethod || "CASH";
        paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + amt;
        paymentMethodsCountMap[method] = (paymentMethodsCountMap[method] || 0) + 1;
        if (
          method === "OTHER" &&
          (p.reference?.includes("IDDA") || p.reference?.includes("CREDIT"))
        ) {
          isStoreCredit = true;
        }
      }
      if (isStoreCredit) {
        creditDebtInRange += Number(sale.grandTotal);
        creditSalesCount += 1;
      }
    }
    collected = roundMoney(collected);
    creditDebtInRange = roundMoney(creditDebtInRange);

    const totalOutstandingCredit = roundMoney(
      allCreditSales.reduce((sum, s) => sum + Number(s.grandTotal), 0)
    );
    const totalCreditCustomers = new Set(
      allCreditSales.map((s) => s.customerName).filter(Boolean)
    ).size;

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

    // Recent transactions with tenant isolation and products summary
    const recentTransactions = recentSales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customerName || "Walk-in Customer",
      cashierName: s.cashier?.name || "Cashier",
      grandTotal: roundMoney(Number(s.grandTotal)),
      itemCount: s.items.reduce((sum, item) => sum + Number(item.quantity), 0),
      productsSummary:
        s.items
          .map((i) => i.productNameSnapshot)
          .filter(Boolean)
          .slice(0, 3)
          .join(", ") || "General Items",
      paymentMethod: s.payments[0]?.paymentMethod || "CASH",
      status: s.status,
    }));

    // 5b. Previous period calculations and comparisons
    const comparisonLabel =
      range === "today"
        ? "vs. yesterday"
        : range === "7d"
        ? "vs. previous 7 days"
        : range === "30d"
        ? "vs. previous 30 days"
        : "vs. last month";

    const prevInvoiced = roundMoney(prevSales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
    const prevSalesCount = prevSales.length;
    let prevCogs = 0;
    for (const s of prevSales) {
      for (const item of s.items) {
        prevCogs += Number(item.quantity) * Number(item.unitCostSnapshot);
      }
    }
    const prevGrossProfit = roundMoney(prevInvoiced - prevCogs);
    const prevExpenses = roundMoney(Number(prevExpensesAgg._sum.amount ?? 0));

    const comparisons = {
      sales: calculateMetricChange(invoiced, prevInvoiced),
      grossProfit: calculateMetricChange(financialSummary.grossProfit, prevGrossProfit),
      transactions: calculateMetricChange(salesCount, prevSalesCount),
      label: comparisonLabel,
    };

    // Quick Stats & Business Insights
    const totalStockValue = roundMoney(
      allProducts.reduce(
        (sum, p) => sum + Number(p.quantityOnHand) * Number(p.sellingPrice || 0),
        0
      )
    );
    const totalCustomers = new Set(
      allCreditSales
        .concat(sales as any)
        .map((s: any) => s.customerName)
        .filter(Boolean)
    ).size;

    const quickStats = {
      totalProducts: allProductCount,
      totalCustomers,
      totalStockValue,
      totalExpensesMonth: expenses,
    };

    const slowMovingProduct =
      allProducts.find((p) => !productStats[p.name] || productStats[p.name].units === 0) || null;

    let expenseTrendText = "No operating expenses recorded";
    if (expenses === 0 && prevExpenses === 0) {
      expenseTrendText = "No operating expenses recorded";
    } else if (prevExpenses === 0) {
      expenseTrendText = `ETB ${expenses} recorded in this period`;
    } else if (expenses < prevExpenses) {
      const pct = Math.round(((prevExpenses - expenses) / prevExpenses) * 100);
      expenseTrendText = `Expenses are ${pct}% lower ${comparisonLabel}`;
    } else if (expenses > prevExpenses) {
      const pct = Math.round(((expenses - prevExpenses) / prevExpenses) * 100);
      expenseTrendText = `Expenses are ${pct}% higher ${comparisonLabel}`;
    } else {
      expenseTrendText = `Expenses unchanged ${comparisonLabel}`;
    }

    const businessInsights = {
      topProduct: topProducts[0] || null,
      slowMovingProduct: slowMovingProduct
        ? {
            name: slowMovingProduct.name,
            units: 0,
            days: range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 30,
          }
        : null,
      expenseTrendText,
    };

    return NextResponse.json({
      success: true,
      range,
      metrics: {
        invoiced,
        subtotal,
        discountTotal,
        taxTotal,
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
        creditDebtInRange,
        creditSalesCount,
        totalOutstandingCredit,
        totalCreditCustomers,
        cashCollected: roundMoney(paymentMethodsMap.CASH || 0),
        cashSalesCount: paymentMethodsCountMap.CASH || 0,
        digitalCollected: roundMoney(
          (paymentMethodsMap.TELEBIRR || 0) +
            (paymentMethodsMap.CBE_BIRR || 0) +
            (paymentMethodsMap.BANK_TRANSFER || 0)
        ),
        expectedCashInTill: roundMoney(
          Math.max(0, (paymentMethodsMap.CASH || 0) - expenses)
        ),
        comparisons,
      },
      lowStockItems,
      topProducts,
      recentTransactions,
      quickStats,
      businessInsights,
      paymentMethods: buildPaymentMethodBreakdown(paymentMethodsMap, paymentMethodsCountMap),
      hasBusinessActivity:
        historicalSalesCount > 0 || allProductCount > 0 || allExpenseCount > 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
