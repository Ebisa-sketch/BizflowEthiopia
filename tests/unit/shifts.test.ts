import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireTenantMock, prismaMock } = vi.hoisted(() => ({
  requireTenantMock: vi.fn(),
  prismaMock: {
    tillShift: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({ requireTenant: requireTenantMock }));
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

import { GET as GET_CURRENT } from "@/app/api/shifts/current/route";
import { GET as GET_SHIFTS, POST as POST_OPEN } from "@/app/api/shifts/route";
import { POST as POST_CLOSE } from "@/app/api/shifts/close/route";

describe("Till Shift & Cash Drawer Management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireTenantMock.mockResolvedValue({
      businessId: "biz-123",
      userId: "user-456",
      role: "CASHIER",
    });
  });

  it("opens a new till shift with opening float", async () => {
    prismaMock.tillShift.findFirst.mockResolvedValue(null); // no open shift
    prismaMock.tillShift.create.mockResolvedValue({
      id: "shift-001",
      businessId: "biz-123",
      cashierId: "user-456",
      status: "OPEN",
      openingFloat: 500,
      openedAt: new Date("2026-11-04T08:00:00Z"),
      cashier: { id: "user-456", name: "Abebe Cashier" },
    });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit-1" });

    const req = new NextRequest("http://localhost/api/shifts", {
      method: "POST",
      body: JSON.stringify({ openingFloat: 500, notes: "Morning register" }),
    });

    const res = await POST_OPEN(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.shift.openingFloat).toBe(500);
    expect(data.shift.status).toBe("OPEN");

    expect(prismaMock.tillShift.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: "biz-123",
          cashierId: "user-456",
          status: "OPEN",
          openingFloat: 500,
        }),
      })
    );
  });

  it("returns real-time expected cash calculation for current active shift", async () => {
    const shiftOpenedAt = new Date("2026-11-04T08:00:00Z");
    prismaMock.tillShift.findFirst.mockResolvedValue({
      id: "shift-001",
      status: "OPEN",
      openingFloat: 500,
      openedAt: shiftOpenedAt,
      cashier: { id: "user-456", name: "Abebe Cashier", email: "cashier@mart.et" },
    });

    // 1200 cash, 800 telebirr
    prismaMock.payment.findMany.mockResolvedValue([
      { amount: 1000, paymentMethod: "CASH" },
      { amount: 200, paymentMethod: "CASH" },
      { amount: 800, paymentMethod: "TELEBIRR" },
    ]);

    // 150 petty cash expense (cleaning supplies)
    prismaMock.expense.findMany.mockResolvedValue([{ amount: 150 }]);

    const req = new NextRequest("http://localhost/api/shifts/current");
    const res = await GET_CURRENT(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.hasActiveShift).toBe(true);
    expect(data.shift.openingFloat).toBe(500);
    expect(data.shift.cashSales).toBe(1200);
    expect(data.shift.digitalSales).toBe(800);
    expect(data.shift.expensesPaid).toBe(150);
    // Expected in drawer = 500 float + 1200 cash - 150 expense = 1550
    expect(data.shift.expectedCashInTill).toBe(1550);
  });

  it("closes a shift, performs blind cash count, and logs variance", async () => {
    const shiftOpenedAt = new Date("2026-11-04T08:00:00Z");
    prismaMock.tillShift.findFirst.mockResolvedValue({
      id: "shift-001",
      businessId: "biz-123",
      cashierId: "user-456",
      status: "OPEN",
      openingFloat: 500,
      openedAt: shiftOpenedAt,
      cashier: { id: "user-456", name: "Abebe Cashier" },
    });

    prismaMock.payment.findMany.mockResolvedValue([
      { amount: 1200, paymentMethod: "CASH" },
    ]);
    prismaMock.expense.findMany.mockResolvedValue([]);

    // Expected = 500 + 1200 = 1700. Cashier counts 1720 (20 ETB overage)
    prismaMock.tillShift.update.mockResolvedValue({
      id: "shift-001",
      status: "CLOSED",
      openingFloat: 500,
      cashSales: 1200,
      digitalSales: 0,
      expensesPaid: 0,
      expectedCash: 1700,
      actualCash: 1720,
      variance: 20,
    });
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit-2" });

    const req = new NextRequest("http://localhost/api/shifts/close", {
      method: "POST",
      body: JSON.stringify({
        shiftId: "shift-001",
        actualCash: 1720,
        denominationCounts: { n200: 8, n100: 1, n10: 2 },
      }),
    });

    const res = await POST_CLOSE(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.shift.variance).toBe(20);
    expect(data.shift.status).toBe("CLOSED");

    expect(prismaMock.tillShift.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "shift-001" },
        data: expect.objectContaining({
          status: "CLOSED",
          expectedCash: 1700,
          actualCash: 1720,
          variance: 20,
        }),
      })
    );
  });
});
