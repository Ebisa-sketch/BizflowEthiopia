import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors";

export interface CustomerCreditSummary {
  name: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  creditDebt: number;
  lastPurchaseDate?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    // 1. Fetch recent sales with customer information and payment details
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        customerName: { not: null },
      },
      select: {
        id: true,
        customerName: true,
        grandTotal: true,
        createdAt: true,
        payments: {
          select: {
            paymentMethod: true,
            reference: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // 2. Aggregate metrics per customer
    const customerMap = new Map<string, CustomerCreditSummary>();

    // Always ensure Walk-in Customer is available
    customerMap.set("Walk-in Customer", {
      name: "Walk-in Customer",
      totalOrders: 0,
      totalSpent: 0,
      creditDebt: 0,
    });

    for (const sale of sales) {
      const rawName = sale.customerName?.trim();
      if (!rawName) continue;

      let summary = customerMap.get(rawName);
      if (!summary) {
        // Try extracting phone if formatted like "Abebe (0911223344)"
        const phoneMatch = rawName.match(/\((09\d{8}|07\d{8}|\+?251\d{9})\)/);
        summary = {
          name: rawName,
          phone: phoneMatch ? phoneMatch[1] : undefined,
          totalOrders: 0,
          totalSpent: 0,
          creditDebt: 0,
          lastPurchaseDate: sale.createdAt.toISOString(),
        };
        customerMap.set(rawName, summary);
      }

      const totalNum = Number(sale.grandTotal);
      summary.totalOrders += 1;
      summary.totalSpent += totalNum;

      // Check if this sale was marked as Store Credit (Idda / ዕዳ)
      const hasCreditPayment = sale.payments.some(
        (p) =>
          p.paymentMethod === "OTHER" &&
          (p.reference?.includes("IDDA") || p.reference?.includes("CREDIT"))
      );

      if (hasCreditPayment) {
        summary.creditDebt += totalNum;
      }
    }

    let customerList = Array.from(customerMap.values());

    if (search) {
      customerList = customerList.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.phone && c.phone.includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      customers: customerList.map((c) => c.name),
      detailedCustomers: customerList,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
