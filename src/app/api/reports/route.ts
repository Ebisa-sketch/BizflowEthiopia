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
    const period = (searchParams.get("period") || "today").toLowerCase();

    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    } else if (period === "quarter") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    }

    const [currentSales, prevSales, expensesList] = await Promise.all([
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
      prisma.sale.findMany({
        where: {
          businessId,
          createdAt: { gte: prevStartDate, lt: startDate },
          status: "COMPLETED",
        },
        select: { grandTotal: true },
      }),
      prisma.expense.findMany({
        where: {
          businessId,
          expenseDate: { gte: startDate },
        },
        select: {
          amount: true,
          category: true,
        },
      }),
    ]);

    const revenue = roundMoney(currentSales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
    const prevRevenue = roundMoney(prevSales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
    const transactions = currentSales.length;

    // COGS & Top Selling Products
    let cogs = 0;
    const productStats: Record<string, { name: string; units: number; revenue: number; cost: number }> = {};

    for (const sale of currentSales) {
      for (const item of sale.items) {
        const itemQty = Number(item.quantity);
        const itemCost = Number(item.unitCostSnapshot) * itemQty;
        const itemRev = Number(item.lineTotal);

        cogs += itemCost;

        const pName = item.productNameSnapshot;
        if (!productStats[pName]) {
          productStats[pName] = { name: pName, units: 0, revenue: 0, cost: 0 };
        }
        productStats[pName].units += itemQty;
        productStats[pName].revenue += itemRev;
        productStats[pName].cost += itemCost;
      }
    }
    cogs = roundMoney(cogs);

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => {
        const marginPct =
          p.revenue > 0 ? (((p.revenue - p.cost) / p.revenue) * 100).toFixed(1) + "%" : "0.0%";
        return {
          name: p.name,
          units: p.units,
          revenue: roundMoney(p.revenue),
          margin: marginPct,
        };
      });

    // Expenses Breakdown
    const expenses = roundMoney(expensesList.reduce((sum, e) => sum + Number(e.amount), 0));

    const expenseCategoryMap: Record<string, number> = {};
    for (const exp of expensesList) {
      const cat = exp.category || "Other";
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + Number(exp.amount);
    }

    const categoryColors = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-amber-500",
      "bg-red-500",
      "bg-emerald-600",
      "bg-indigo-600",
    ];

    const expenseBreakdown = Object.entries(expenseCategoryMap).map(([category, amount], idx) => ({
      category,
      amount: roundMoney(amount),
      percentage: expenses > 0 ? Math.round((amount / expenses) * 100) : 0,
      color: categoryColors[idx % categoryColors.length],
    }));

    // Payment Methods Split
    const paymentMap: Record<string, number> = {
      Telebirr: 0,
      Cash: 0,
      "CBE Birr": 0,
      "Bank Transfer": 0,
    };

    for (const sale of currentSales) {
      for (const p of sale.payments) {
        const amt = Number(p.amount);
        if (p.paymentMethod === "TELEBIRR") paymentMap["Telebirr"] += amt;
        else if (p.paymentMethod === "CASH") paymentMap["Cash"] += amt;
        else if (p.paymentMethod === "CBE_BIRR") paymentMap["CBE Birr"] += amt;
        else paymentMap["Bank Transfer"] += amt;
      }
    }

    const paymentSplit = [
      {
        method: "Telebirr",
        amount: roundMoney(paymentMap["Telebirr"]),
        percentage: revenue > 0 ? Math.round((paymentMap["Telebirr"] / revenue) * 100) : 0,
        color: "bg-blue-600",
        icon: "phone",
      },
      {
        method: "Cash",
        amount: roundMoney(paymentMap["Cash"]),
        percentage: revenue > 0 ? Math.round((paymentMap["Cash"] / revenue) * 100) : 0,
        color: "bg-emerald-600",
        icon: "cash",
      },
      {
        method: "CBE Birr",
        amount: roundMoney(paymentMap["CBE Birr"]),
        percentage: revenue > 0 ? Math.round((paymentMap["CBE Birr"] / revenue) * 100) : 0,
        color: "bg-purple-600",
        icon: "card",
      },
      {
        method: "Bank Transfer",
        amount: roundMoney(paymentMap["Bank Transfer"]),
        percentage: revenue > 0 ? Math.round((paymentMap["Bank Transfer"] / revenue) * 100) : 0,
        color: "bg-amber-600",
        icon: "bank",
      },
    ];

    // Daily Revenue Trend
    let dailyRevenue: { label: string; amount: number }[] = [];
    if (period === "today") {
      dailyRevenue = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((timeLabel) => {
        const targetHour = parseInt(timeLabel.split(":")[0], 10);
        const matchingSales = currentSales.filter((s) => {
          const h = s.createdAt.getHours();
          return h >= targetHour - 1 && h < targetHour + 1;
        });
        const amt = roundMoney(matchingSales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
        return { label: timeLabel, amount: amt };
      });
    } else {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dailyRevenue = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayLabel = days[d.getDay()];
        const matchingSales = currentSales.filter((s) => s.createdAt.toDateString() === d.toDateString());
        const amt = roundMoney(matchingSales.reduce((sum, s) => sum + Number(s.grandTotal), 0));
        return { label: dayLabel, amount: amt };
      });
    }

    return NextResponse.json({
      success: true,
      period,
      report: {
        revenue,
        cogs,
        expenses,
        transactions,
        prevRevenue,
        topProducts,
        dailyRevenue,
        expenseBreakdown,
        paymentSplit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
