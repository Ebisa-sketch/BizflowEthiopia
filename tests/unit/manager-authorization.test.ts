import { describe, expect, it, vi } from "vitest";
import {
  createManagerDiscountGrant,
  verifyManagerDiscountGrant,
} from "@/lib/sales/manager-authorization";

describe("POS manager discount authorization", () => {
  const grantInput = {
    managerUserId: "manager-1",
    businessId: "business-1",
    cashierId: "cashier-1",
    permission: "sales:discount" as const,
  };

  it("creates grants bound to the active cashier and business", () => {
    const token = createManagerDiscountGrant(grantInput);

    expect(
      verifyManagerDiscountGrant(token, {
        businessId: "business-1",
        cashierId: "cashier-1",
      })
    ).toBe("manager-1");
  });

  it("rejects grants used by another cashier or business", () => {
    const token = createManagerDiscountGrant(grantInput);

    expect(() =>
      verifyManagerDiscountGrant(token, {
        businessId: "business-1",
        cashierId: "another-cashier",
      })
    ).toThrow(/invalid or expired/);
    expect(() =>
      verifyManagerDiscountGrant(token, {
        businessId: "another-business",
        cashierId: "cashier-1",
      })
    ).toThrow(/invalid or expired/);
  });

  it("rejects malformed and tampered grants", () => {
    expect(() =>
      verifyManagerDiscountGrant("not-a-token", {
        businessId: "business-1",
        cashierId: "cashier-1",
      })
    ).toThrow(/invalid or expired/);

    const token = createManagerDiscountGrant(grantInput);
    const tamperedToken = `${token.slice(0, -1)}x`;
    expect(() =>
      verifyManagerDiscountGrant(tamperedToken, {
        businessId: "business-1",
        cashierId: "cashier-1",
      })
    ).toThrow(/invalid or expired/);
  });

  it("rejects expired manager approvals", () => {
    vi.useFakeTimers();
    try {
      const token = createManagerDiscountGrant(grantInput);
      vi.advanceTimersByTime(6 * 60 * 1000);

      expect(() =>
        verifyManagerDiscountGrant(token, {
          businessId: "business-1",
          cashierId: "cashier-1",
        })
      ).toThrow(/invalid or expired/);
    } finally {
      vi.useRealTimers();
    }
  });
});
