import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors";
import { roundMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "reports:view_operational",
    });

    const searchParams = request.nextUrl.searchParams;
    const range = (searchParams.get("range") || "today").toLowerCase();

    const now = new Date();
    let startDate: Date;

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    const [sales, expensesAgg, allProducts] = await Promise.all([
      prisma.sale.findMany({
        where: {
          businessId,
          createdAt: { gte: startDate },
          status: "COMPLETED",
        },
        select: {
          createdAt: true,
          grandTotal: true,
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
          expenseDate: { gte: startDate },
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
    ]);

    // 1. Sales & Invoiced total
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

    // 3. COGS calculation
    let cogs = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        cogs += Number(item.quantity) * Number(item.unitCostSnapshot);
      }
    }
    cogs = roundMoney(cogs);

    const productStats: Record<string, { name: string; units: number; revenue: number; cost: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const name = item.productNameSnapshot;
        const stats = productStats[name] ??= { name, units: 0, revenue: 0, cost: 0 };
        stats.units += Number(item.quantity);
        stats.revenue += Number(item.lineTotal);
        stats.cost += Number(item.quantity) * Number(item.unitCostSnapshot);
      }
    }
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        units: product.units,
        revenue: roundMoney(product.revenue),
        margin: product.revenue > 0
          ? `${(((product.revenue - product.cost) / product.revenue) * 100).toFixed(1)}%`
          : "0.0%",
      }));

    // 4. Operating Expenses
    const expenses = roundMoney(Number(expensesAgg._sum.amount ?? 0));

    // 5. Build dynamic chart data buckets
    let chartData: { day: string; amount: number; sales: number }[] = [];

    if (range === "today") {
      const buckets = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
      chartData = buckets.map((timeLabel) => {
        const targetHour = parseInt(timeLabel.split(":")[0], 10);
        const matchingSales = sales.filter((s) => {
          const h = s.createdAt.getHours();
          return h >= targetHour - 1 && h < targetHour + 1;
        });
        const amt = roundMoney(matchingSales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
        return { day: timeLabel, amount: amt, sales: matchingSales.length };
      });
    } else if (range === "7d") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayLabel = days[d.getDay()];
        const matchingSales = sales.filter((s) => s.createdAt.toDateString() === d.toDateString());
        const amt = roundMoney(matchingSales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
        return { day: dayLabel, amount: amt, sales: matchingSales.length };
      });
    } else {
      // 30d or month -> 4 weekly buckets
      chartData = [1, 2, 3, 4].map((wk) => {
        const amt = roundMoney(
          sales
            .filter((_, idx) => idx % 4 === wk - 1)
            .reduce((sum, s) => sum + Number(s.grandTotal), 0)
        );
        return { day: `Week ${wk}`, amount: amt, sales: Math.ceil(salesCount / 4) };
      });
    }

    const lowStockItems = allProducts
      .filter((p) => Number(p.quantityOnHand) <= Number(p.reorderLevel))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "N/A",
        stock: Number(p.quantityOnHand),
        reorderLevel: Number(p.reorderLevel),
        isOut: Number(p.quantityOnHand) <= 0,
      }));

    return NextResponse.json({
      success: true,
      range,
      metrics: {
        invoiced,
        collected,
        cogs,
        expenses,
        salesCount,
        chartData,
      },
      lowStockItems,
      topProducts,
      paymentMethods: Object.entries(paymentMethodsMap).map(([method, amount]) => ({
        method,
        amount: roundMoney(amount),
        percentage: invoiced > 0 ? Math.round((amount / invoiced) * 100) : 0,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
