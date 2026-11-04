import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireTenantMock, prismaMock } = vi.hoisted(() => ({
  requireTenantMock: vi.fn(),
  prismaMock: {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    customerDebtTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({ requireTenant: requireTenantMock }));
vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));

import { GET, POST } from "@/app/api/customers/route";
import { POST as POST_REPAY } from "@/app/api/customers/repay/route";

describe("Customers & Credit Ledger API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireTenantMock.mockResolvedValue({
      businessId: "biz-123",
      userId: "user-456",
      role: "OWNER",
    });
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
      fn(prismaMock)
    );
  });

  it("rejects customer creation if name is empty", async () => {
    const req = new NextRequest("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({ name: "   " }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Customer name or shop name is required");
  });

  it("creates a new customer with opening debt in a DB transaction", async () => {
    const createdCustomer = {
      id: "cust-001",
      businessId: "biz-123",
      name: "Ato Getachew",
      phone: "0911223344",
      tinNumber: null,
      notes: null,
      creditLimit: 0,
      currentDebt: 500,
      isActive: true,
      createdAt: new Date("2026-10-29T10:00:00Z"),
      updatedAt: new Date("2026-10-29T10:00:00Z"),
    };

    prismaMock.customer.findUnique.mockResolvedValue(null); // no duplicate
    prismaMock.customer.create.mockResolvedValue(createdCustomer);
    prismaMock.customerDebtTransaction.create.mockResolvedValue({ id: "tx-1" });

    const req = new NextRequest("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({
        name: "Ato Getachew",
        phone: "0911223344",
        initialDebt: 500,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.customer.name).toBe("Ato Getachew");
    expect(data.customer.phone).toBe("0911223344");
    expect(data.customer.currentDebt).toBe(500);

    // Should have created a customer in the DB
    expect(prismaMock.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: "biz-123",
          name: "Ato Getachew",
          phone: "0911223344",
          currentDebt: 500,
        }),
      })
    );

    // Should have created an INITIAL_BALANCE ledger entry
    expect(prismaMock.customerDebtTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: "biz-123",
          customerId: "cust-001",
          type: "INITIAL_BALANCE",
          amount: 500,
          balanceAfter: 500,
          recordedBy: "user-456",
        }),
      })
    );
  });

  it("rejects duplicate customer registration", async () => {
    prismaMock.customer.findUnique.mockResolvedValue({
      id: "existing-123",
      name: "Ato Getachew",
      isActive: true,
    });

    const req = new NextRequest("http://localhost/api/customers", {
      method: "POST",
      body: JSON.stringify({ name: "Ato Getachew" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already registered");
  });

  it("records debt settlement with real balance update", async () => {
    const existingCustomer = {
      id: "cust-001",
      businessId: "biz-123",
      name: "Ato Getachew",
      currentDebt: 1000,
      isActive: true,
    };

    prismaMock.customer.findFirst.mockResolvedValue(existingCustomer);
    prismaMock.customer.update.mockResolvedValue({ ...existingCustomer, currentDebt: 750 });
    prismaMock.customerDebtTransaction.create.mockResolvedValue({ id: "repay-tx-1" });

    const req = new NextRequest("http://localhost/api/customers/repay", {
      method: "POST",
      body: JSON.stringify({
        customerId: "cust-001",
        amount: 250,
        paymentMethod: "TELEBIRR",
        reference: "TB-123456",
      }),
    });

    const res = await POST_REPAY(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.newBalance).toBe(750);

    // Customer balance must be updated
    expect(prismaMock.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cust-001" },
        data: { currentDebt: 750 },
      })
    );

    // Ledger entry must be a REPAYMENT
    expect(prismaMock.customerDebtTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "REPAYMENT",
          amount: -250,
          balanceAfter: 750,
          paymentMethod: "TELEBIRR",
          reference: "TB-123456",
          customerId: "cust-001",
        }),
      })
    );
  });

  it("returns enriched customer list with summary aggregates from DB", async () => {
    const mockCustomers = [
      {
        id: "cust-001",
        name: "Bole Market",
        phone: "0911000000",
        tinNumber: null,
        notes: null,
        creditLimit: 2000,
        currentDebt: 600,
        isActive: true,
        createdAt: new Date("2026-10-01"),
        updatedAt: new Date("2026-10-20"),
        _count: { sales: 2 },
        sales: [
          { grandTotal: 1200, createdAt: new Date("2026-10-20"), status: "COMPLETED" },
          { grandTotal: 500, createdAt: new Date("2026-10-10"), status: "COMPLETED" },
        ],
      },
    ];

    prismaMock.customer.findMany.mockResolvedValue(mockCustomers);
    prismaMock.customer.count.mockResolvedValue(1);
    prismaMock.customer.aggregate.mockResolvedValue({
      _sum: { currentDebt: 600 },
      _count: { id: 1 },
    });

    const req = new NextRequest("http://localhost/api/customers");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const bole = data.detailedCustomers.find((c: { name: string }) => c.name === "Bole Market");
    expect(bole).toBeDefined();
    expect(bole.phone).toBe("0911000000");
    expect(bole.totalOrders).toBe(2);
    expect(bole.totalSpent).toBe(1700);
    expect(bole.currentDebt).toBe(600);

    // Summary aggregates
    expect(data.summary.totalOutstandingDebt).toBe(600);
    expect(data.summary.totalCustomers).toBe(1);
  });
});
