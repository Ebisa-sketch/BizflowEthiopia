import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";
import { PaymentMethod } from "@prisma/client";

const { requireTenantMock, createPosSaleMock } = vi.hoisted(() => ({
  requireTenantMock: vi.fn(),
  createPosSaleMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireTenant: requireTenantMock }));
vi.mock("@/lib/sales/pos-service", () => ({ createPosSale: createPosSaleMock }));
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));

import { POST } from "@/app/api/sales/route";

describe("POS checkout route authorization and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireTenantMock.mockResolvedValue({
      businessId: "tenant-a",
      userId: "cashier-a",
      role: "CASHIER",
    });
    createPosSaleMock.mockResolvedValue({ saleNumber: "INV-123" });
  });

  const makeRequest = (body: unknown) =>
    new NextRequest("http://localhost/api/sales", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "checkout-attempt-00000001",
      },
      body: JSON.stringify(body),
    });

  it("requires the sales:create permission before checkout", async () => {
    requireTenantMock.mockRejectedValue(new AppError("Forbidden.", 403));
    const response = await POST(
      makeRequest({
        items: [{ productId: "p1", quantity: 1 }],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 20 },
      })
    );

    expect(response.status).toBe(403);
    expect(createPosSaleMock).not.toHaveBeenCalled();
  });

  it("passes the authenticated tenant and cashier to the server-side sale service", async () => {
    const response = await POST(
      makeRequest({
        items: [{ productId: "p1", quantity: 1 }],
        discountTotal: 0,
        applyVat: true,
        taxTotal: 0,
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 20 },
      })
    );

    expect(response.status).toBe(200);
    expect(createPosSaleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "tenant-a",
        cashierId: "cashier-a",
        role: "CASHIER",
        applyVat: true,
        idempotencyKey: "checkout-attempt-00000001",
      })
    );
    expect(createPosSaleMock.mock.calls[0][0]).not.toHaveProperty("taxTotal");
  });

  it("rejects duplicate product lines and mismatched idempotency keys", async () => {
    const duplicateLines = await POST(
      makeRequest({
        items: [
          { productId: "p1", quantity: 1 },
          { productId: "p1", quantity: 2 },
        ],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 30 },
      })
    );
    expect(duplicateLines.status).toBe(400);

    const request = makeRequest({
      items: [{ productId: "p1", quantity: 1 }],
      idempotencyKey: "another-checkout-key-000000000",
      payment: { paymentMethod: PaymentMethod.CASH, tendered: 20 },
    });
    const mismatchedKey = await POST(request);
    expect(mismatchedKey.status).toBe(400);
    expect(createPosSaleMock).not.toHaveBeenCalled();
  });

  it("rejects quantities that exceed the database precision", async () => {
    const response = await POST(
      makeRequest({
        items: [{ productId: "p1", quantity: 1.001 }],
        payment: { paymentMethod: PaymentMethod.CASH, tendered: 20 },
      })
    );

    expect(response.status).toBe(400);
    expect(createPosSaleMock).not.toHaveBeenCalled();
  });
});
