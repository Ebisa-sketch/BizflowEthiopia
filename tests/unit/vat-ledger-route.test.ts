import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

const { requireTenantMock, prismaMock } = vi.hoisted(() => ({
  requireTenantMock: vi.fn(),
  prismaMock: {
    business: {
      findUnique: vi.fn(),
    },
    sale: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({ requireTenant: requireTenantMock }));
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

import { GET } from "@/app/api/reports/vat-ledger/route";

describe("GET /api/reports/vat-ledger API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireTenantMock.mockResolvedValue({
      businessId: "biz-123",
      userId: "user-456",
      role: "OWNER",
    });

    prismaMock.business.findUnique.mockResolvedValue({
      name: "Bole Mart",
      taxNumber: "0098765432",
    });

    prismaMock.sale.findMany.mockResolvedValue([
      {
        id: "sale-1",
        saleNumber: "INV-001",
        createdAt: new Date("2026-11-15T08:00:00Z"),
        subtotal: 1000,
        taxTotal: 150,
        discountTotal: 0,
        grandTotal: 1150,
        customerName: "Abebe",
        customer: { name: "Abebe", tinNumber: "0011223344" },
        items: [
          {
            productNameSnapshot: "Teff 25kg",
            quantity: 1,
            unitPrice: 1000,
            lineTotal: 1000,
            unitCostSnapshot: 800,
          },
        ],
        payments: [
          {
            amount: 1150,
            paymentMethod: "TELEBIRR",
            reference: "TB12345",
          },
        ],
      },
    ]);
  });

  it("requires reports:view_operational permission", async () => {
    requireTenantMock.mockRejectedValueOnce(new AppError("Forbidden.", 403));
    const req = new NextRequest("http://localhost/api/reports/vat-ledger");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("returns JSON format with MoR summary and ledger by default", async () => {
    const req = new NextRequest("http://localhost/api/reports/vat-ledger?period=month");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.business.name).toBe("Bole Mart");
    expect(data.business.taxNumber).toBe("0098765432");
    expect(data.vatSummary.totalGrossSales).toBe(1150);
    expect(data.vatSummary.totalTaxableSales).toBe(1000);
    expect(data.vatSummary.totalOutputVat).toBe(150);
    expect(data.ledger.length).toBe(1);
    expect(data.ledger[0].saleNumber).toBe("INV-001");
  });

  it("returns downloadable CSV file when format=csv is requested", async () => {
    const req = new NextRequest("http://localhost/api/reports/vat-ledger?period=month&format=csv");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=\"mor-vat-ledger-month-");

    const text = await res.text();
    expect(text).toContain("MINISTRY OF REVENUE (MoR)");
    expect(text).toContain("Bole Mart");
    expect(text).toContain("INV-001");
    expect(text).toContain("150.00");
  });
});
