import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPosSale, CreatePosSaleInput } from "@/lib/sales/pos-service";
import { prisma } from "@/lib/db/prisma";
import { PaymentMethod } from "@prisma/client";

// Mock prisma for isolated unit tests
vi.mock("@prisma/db", () => ({}));
vi.mock("@/lib/db/prisma", () => {
  const mockFindUniqueBusiness = vi.fn();
  const mockFindUniqueCashier = vi.fn();
  const mockFindManyProducts = vi.fn();
  const mockFindUniqueProduct = vi.fn();
  const mockUpdateProduct = vi.fn();
  const mockUpdateManyProduct = vi.fn();
  const mockCreateSale = vi.fn();  const mockFindFirstSale = vi.fn();
  const mockCreateSaleItem = vi.fn();
  const mockCreateStockMovement = vi.fn();
  const mockCreatePayment = vi.fn();
  const mockCreateAuditLog = vi.fn();
  const mockFindUniqueMembership = vi.fn();

  const mockTransaction = vi.fn(async (cb) => {
    return cb({
      product: {
        findUnique: mockFindUniqueProduct,
        update: mockUpdateProduct,
        updateMany: mockUpdateManyProduct,
      },
      sale: {
        create: mockCreateSale,
      },
      saleItem: {
        create: mockCreateSaleItem,
      },
      stockMovement: {
        create: mockCreateStockMovement,
      },
      payment: {
        create: mockCreatePayment,
      },
      auditLog: {
        create: mockCreateAuditLog,
      },
    });
  });

  return {
    prisma: {
      business: { findUnique: mockFindUniqueBusiness },
      user: { findUnique: mockFindUniqueCashier },
      membership: { findUnique: mockFindUniqueMembership },
      product: {
        findMany: mockFindManyProducts,
        findUnique: mockFindUniqueProduct,
        update: mockUpdateProduct,
        updateMany: mockUpdateManyProduct,
      },
      sale: { create: mockCreateSale, findFirst: mockFindFirstSale },
      payment: { create: mockCreatePayment },
      $transaction: mockTransaction,
    },
  };
});

describe("POS Checkout Service & Validation Engine", () => {
  const mockBusiness = {
    id: "biz-test-1",
    name: "Bole Fresh Supermarket",
    phone: "+251911223344",
    address: "Bole Medhanialem, Addis Ababa",
    taxNumber: "TIN-0098765432",
    currency: "ETB",
    status: "ACTIVE",
  };

  const mockCashier = {
    id: "usr-cashier-1",
    name: "Tigist Alemu",
    email: "cashier@bolefresh.et",
  };

  const sampleProducts = [
    {
      id: "prod-1",
      businessId: "biz-test-1",
      name: "Ambo Water 500ml",
      sku: "BEV-001",
      sellingPrice: 35.0,
      costPrice: 25.0,
      quantityOnHand: 50,
      status: "ACTIVE",
    },
    {
      id: "prod-2",
      businessId: "biz-test-1",
      name: "Magna Teff 5kg Bag",
      sku: "PAN-001",
      sellingPrice: 850.0,
      costPrice: 650.0,
      quantityOnHand: 10,
      status: "ACTIVE",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.business.findUnique as any).mockResolvedValue(mockBusiness);
    (prisma.user.findUnique as any).mockResolvedValue(mockCashier);
    (prisma.membership.findUnique as any).mockResolvedValue({
      role: "MANAGER",
      status: "ACTIVE",
      user: { accountStatus: "ACTIVE" },
    });
    (prisma.product.findMany as any).mockImplementation(({ where }: any) => {
      if (where?.id?.in) {
        return sampleProducts.filter((p) => where.id.in.includes(p.id));
      }
      return sampleProducts;
    });
    (prisma.product.findUnique as any).mockImplementation(({ where }: any) => {
      return sampleProducts.find((p) => p.id === where.id) || null;
    });
    (prisma.sale.create as any).mockImplementation(({ data }: any) => {
      return {
        id: "sale-new-123",
        createdAt: new Date("2026-10-10T12:00:00Z"),
        ...data,
      };
    });
    (prisma.product.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.sale.findFirst as any).mockResolvedValue(null);
  });

  it("successfully completes a standard Cash sale with correct change and decimal math", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      items: [
        { productId: "prod-1", quantity: 2 }, // 2 * 35 = 70 ETB
        { productId: "prod-2", quantity: 1 }, // 1 * 850 = 850 ETB
      ], // Subtotal = 920 ETB
      discountTotal: 0,
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tendered: 1000, // 1000 - 920 = 80 ETB change
      },
    };

    const receipt = await createPosSale(input);

    expect(receipt).toBeDefined();
    expect(receipt.saleNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(receipt.subtotal).toBe(920);
    expect(receipt.grandTotal).toBe(920);
    expect(receipt.payment.tendered).toBe(1000);
    expect(receipt.payment.change).toBe(80);
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tendered: 1000, change: 80 }),
      })
    );
    expect(receipt.items).toHaveLength(2);
    expect(receipt.business.name).toBe("Bole Fresh Supermarket");
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["prod-1", "prod-2"] }, businessId: "biz-test-1" },
      })
    );
  });

  it("rejects sales when requested quantity exceeds available stock", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      items: [{ productId: "prod-2", quantity: 25 }], // Only 10 in stock!
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tendered: 25000,
      },
    };

    await expect(createPosSale(input)).rejects.toThrow(/Insufficient inventory/);
  });

  it("prevents a concurrent checkout from decrementing stock below zero", async () => {
    (prisma.product.updateMany as any).mockResolvedValueOnce({ count: 0 });
    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "CASHIER",
        items: [{ productId: "prod-1", quantity: 1 }],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 35 },
      })
    ).rejects.toThrow(/Insufficient inventory/);
    expect(prisma.sale.create).not.toHaveBeenCalled();
  });

  it("rejects non-positive quantities (zero or negative)", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      items: [{ productId: "prod-1", quantity: -3 }],
      payment: {
        paymentMethod: PaymentMethod.CASH,
      },
    };

    await expect(createPosSale(input)).rejects.toThrow(/Quantity must be a positive number/);
  });

  it("rejects quantities with more precision than inventory supports", async () => {
    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "CASHIER",
        items: [{ productId: "prod-1", quantity: 1.001 }],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 35 },
      })
    ).rejects.toThrow(/at most two decimal places/);
  });

  it("blocks unauthorized discounts attempted by a CASHIER role", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      items: [{ productId: "prod-1", quantity: 2 }],
      discountTotal: 15, // Cashiers lack sales:discount permission
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tendered: 100,
      },
    };

    await expect(createPosSale(input)).rejects.toThrow(/Discounts require Manager or Owner role authorization/);
  });

  it("allows authorized discounts when performed by OWNER or MANAGER role", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "MANAGER", // Has sales:discount permission
      items: [{ productId: "prod-1", quantity: 2 }], // Subtotal: 70 ETB
      discountTotal: 10,
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tendered: 60,
      },
    };

    const receipt = await createPosSale(input);
    expect(receipt.discountTotal).toBe(10);
    expect(receipt.grandTotal).toBe(60);
  });

  it("calculates 15% VAT on the discounted VAT-exclusive subtotal on the server", async () => {
    const receipt = await createPosSale({
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "MANAGER",
      items: [{ productId: "prod-1", quantity: 2 }],
      discountTotal: 10,
      applyVat: true,
      payment: { paymentMethod: PaymentMethod.CASH, tendered: 69 },
    });

    expect(receipt.subtotal).toBe(70);
    expect(receipt.discountTotal).toBe(10);
    expect(receipt.taxTotal).toBe(9);
    expect(receipt.grandTotal).toBe(69);
  });

  it("rejects discounts above subtotal and duplicate product lines", async () => {
    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "MANAGER",
        items: [{ productId: "prod-1", quantity: 1 }],
        discountTotal: 36,
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 0 },
      })
    ).rejects.toThrow(/Discount cannot exceed subtotal/);

    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "CASHIER",
        items: [
          { productId: "prod-1", quantity: 1 },
          { productId: "prod-1", quantity: 1 },
        ],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 70 },
      })
    ).rejects.toThrow(/only appear once/);
  });

  it("allows cashier discounts only with a current active manager membership", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      managerApprovalUserId: "usr-manager-1",
      items: [{ productId: "prod-1", quantity: 2 }],
      discountTotal: 10,
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tendered: 60,
      },
    };

    const receipt = await createPosSale(input);

    expect(receipt.discountTotal).toBe(10);
    expect(prisma.membership.findUnique).toHaveBeenCalledWith({
      where: {
        businessId_userId: {
          businessId: "biz-test-1",
          userId: "usr-manager-1",
        },
      },
      select: {
        role: true,
        status: true,
        user: { select: { accountStatus: true } },
      },
    });
  });

  it("rejects delegated discounts when the approving manager is inactive", async () => {
    (prisma.membership.findUnique as any).mockResolvedValue({
      role: "MANAGER",
      status: "SUSPENDED",
      user: { accountStatus: "ACTIVE" },
    });
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      managerApprovalUserId: "usr-manager-1",
      items: [{ productId: "prod-1", quantity: 1 }],
      discountTotal: 10,
      payment: { paymentMethod: PaymentMethod.CASH, tendered: 25 },
    };

    await expect(createPosSale(input)).rejects.toThrow(
      /approving manager no longer has permission/
    );
  });

  it("rejects electronic payment (Telebirr) when transaction reference code is missing", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      items: [{ productId: "prod-1", quantity: 1 }],
      payment: {
        paymentMethod: PaymentMethod.TELEBIRR,
        reference: "", // Empty!
      },
    };

    await expect(createPosSale(input)).rejects.toThrow(/transaction confirmation reference is required/);
  });

  it("rejects store credit for an anonymous customer", async () => {
    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "CASHIER",
        items: [{ productId: "prod-1", quantity: 1 }],
        payment: {
          paymentMethod: PaymentMethod.OTHER,
          reference: "CREDIT NOTE",
        },
      })
    ).rejects.toThrow(/cannot be issued to an anonymous/i);
  });

  it("records external payment references without claiming gateway verification", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      items: [{ productId: "prod-1", quantity: 2 }], // 70 ETB
      payment: {
        paymentMethod: PaymentMethod.TELEBIRR,
        reference: "TB-REC-89217342",
      },
    };

    const receipt = await createPosSale(input);
    expect(receipt.payment.method).toBe(PaymentMethod.TELEBIRR);
    expect(receipt.payment.reference).toBe("TB-REC-89217342");
    expect(receipt.payment.change).toBe(0);
  });

  it("prevents double submission using idempotency key deduplication", async () => {
    const input: CreatePosSaleInput = {
      businessId: "biz-test-1",
      cashierId: "usr-cashier-1",
      role: "CASHIER",
      items: [{ productId: "prod-1", quantity: 1 }],
      payment: {
        paymentMethod: PaymentMethod.CASH,
        tendered: 50,
      },
      idempotencyKey: "test-idempotency-pos-12345",
    };

    const firstResult = await createPosSale(input);
    expect(firstResult).toBeDefined();

    const createdSale = (prisma.sale.create as any).mock.calls[0][0].data;
    const persistedSale = {
      ...createdSale,
      id: firstResult.saleId,
      saleNumber: firstResult.saleNumber,
      createdAt: new Date(firstResult.createdAt),
      customerName: firstResult.customerName,
      business: firstResult.business,
      cashier: firstResult.cashier,
      items: firstResult.items.map((item, index) => ({
        ...item,
        id: `sale-item-${index}`,
        productNameSnapshot: item.name,
        product: { sku: item.sku },
      })),
      payments: [
        {
          paymentMethod: firstResult.payment.method,
          amount: firstResult.payment.amount,
          reference: firstResult.payment.reference,
          tendered: firstResult.payment.tendered,
          change: firstResult.payment.change,
        },
      ],
    };
    (prisma.sale.findFirst as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(persistedSale);
    (prisma.$transaction as any).mockRejectedValueOnce({ code: "P2002" });

    // A concurrent duplicate loses the unique-key race and returns the durable sale.
    const secondResult = await createPosSale(input);
    expect(secondResult).toEqual(firstResult);
    expect(secondResult.saleNumber).toBe(firstResult.saleNumber);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("enforces tenant isolation by rejecting products belonging to another business", async () => {
    (prisma.product.findMany as any).mockResolvedValueOnce([]); // No products found for biz-test-1

    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "CASHIER",
        items: [{ productId: "prod-cross-tenant", quantity: 1 }],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 50 },
      })
    ).rejects.toThrow(/do not exist in your store inventory/i);
  });

  it("rejects sales when cash tendered is less than grand total", async () => {
    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "CASHIER",
        items: [{ productId: "prod-1", quantity: 1 }], // 35 ETB
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 30 },
      })
    ).rejects.toThrow(/Insufficient cash tendered/i);
  });

  it("rejects duplicate checkout keys when payload hash differs", async () => {
    (prisma.sale.findFirst as any).mockResolvedValueOnce({
      id: "sale-existing",
      idempotencyHash: "hash-different-123",
    });

    await expect(
      createPosSale({
        businessId: "biz-test-1",
        cashierId: "usr-cashier-1",
        role: "CASHIER",
        items: [{ productId: "prod-1", quantity: 1 }],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 35 },
        idempotencyKey: "duplicate-key-diff-payload-123",
      })
    ).rejects.toThrow(/already used for a different sale/i);
  });
});
