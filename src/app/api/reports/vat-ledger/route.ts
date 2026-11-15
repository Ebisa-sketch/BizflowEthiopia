import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors";
import { computeVatLedger, generateVatLedgerCsv } from "@/lib/reports/vat-ledger";

const PERIOD_LABELS: Record<string, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  all: "All Time",
};

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "reports:view_operational",
    });

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "month").toLowerCase();
    const format = (searchParams.get("format") || "json").toLowerCase();

    const now = new Date();
    let startDate: Date | undefined;

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === "quarter") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (period === "all") {
      startDate = undefined;
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const whereClause: any = {
      businessId,
      status: "COMPLETED",
    };
    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }

    const [business, sales] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, taxNumber: true },
      }),
      prisma.sale.findMany({
        where: whereClause,
        select: {
          id: true,
          saleNumber: true,
          createdAt: true,
          subtotal: true,
          taxTotal: true,
          discountTotal: true,
          grandTotal: true,
          customerName: true,
          customer: {
            select: {
              name: true,
              tinNumber: true,
            },
          },
          items: {
            select: {
              productNameSnapshot: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              unitCostSnapshot: true,
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
    ]);

    const businessName = business?.name || "BizFlow Merchant";
    const tinNumber = business?.taxNumber || undefined;
    const periodLabel = PERIOD_LABELS[period] || "Custom Period";

    const report = computeVatLedger(sales as any);

    if (format === "csv") {
      const csv = generateVatLedgerCsv(report, {
        businessName,
        tinNumber,
        periodLabel,
      });

      const filename = `mor-vat-ledger-${period}-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      period,
      business: {
        name: businessName,
        taxNumber: tinNumber,
      },
      vatSummary: {
        totalGrossSales: report.totalGrossSales,
        totalTaxableSales: report.totalTaxableSales,
        totalOutputVat: report.totalOutputVat,
        totalExemptSales: report.totalExemptSales,
        vatInvoicesCount: report.vatInvoicesCount,
        exemptInvoicesCount: report.exemptInvoicesCount,
        totalInvoicesCount: report.totalInvoicesCount,
        effectiveVatRate: report.effectiveVatRate,
      },
      ledger: report.ledgerRows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
