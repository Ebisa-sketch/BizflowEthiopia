import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireTenantMock, prismaMock } = vi.hoisted(() => ({
  requireTenantMock: vi.fn(),
  prismaMock: {
    sale: { findMany: vi.fn() },
    expense: { aggregate: vi.fn() },
    product: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({ requireTenant: requireTenantMock }));
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

import { GET } from "@/app/api/dashboard/metrics/route";

describe("Dashboard metrics API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireTenantMock.mockResolvedValue({ businessId: "biz-123" });
  });

  it("uses cash sales for the drawer estimate and counts named customers across all periods", async () => {
    prismaMock.sale.findMany
      .mockResolvedValueOnce([
        {
          id: "sale-1",
          saleNumber: "S-001",
          createdAt: new Date(),
          subtotal: 100,
          discountTotal: 0,
          taxTotal: 0,
          grandTotal: 100,
          customerName: "Ato Getachew",
          status: "COMPLETED",
          cashier: { name: "Cashier" },
          items: [],
          payments: [{ amount: 80, paymentMethod: "CASH", reference: null }],
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { customerName: "Ato Getachew" },
        { customerName: "   " },
      ])
      .mockResolvedValueOnce([]);
    prismaMock.expense.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 30 } })
      .mockResolvedValueOnce({ _sum: { amount: null } });
    prismaMock.product.findMany.mockResolvedValue([]);

    const response = await GET(
      new NextRequest("http://localhost/api/dashboard/metrics?range=7d")
    );
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.metrics.expectedCashInTill).toBe(80);
    expect(result.quickStats.customersWithSales).toBe(1);
    expect(result.quickStats.totalExpensesInRange).toBe(30);
  });
});
