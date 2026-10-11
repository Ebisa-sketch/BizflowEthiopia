import { describe, it, expect } from "vitest";
import { hasPermission, canAccessFinancialReports } from "@/lib/permissions";

describe("RBAC Permissions Matrix", () => {
  it("allows OWNER to access everything including financial reports", () => {
    expect(hasPermission("OWNER", "business:manage")).toBe(true);
    expect(hasPermission("OWNER", "reports:view_financial")).toBe(true);
    expect(canAccessFinancialReports("OWNER")).toBe(true);
  });

  it("denies CASHIER access to business management and financial reports", () => {
    expect(hasPermission("CASHIER", "business:manage")).toBe(false);
    expect(hasPermission("CASHIER", "reports:view_financial")).toBe(false);
    expect(hasPermission("CASHIER", "sales:create")).toBe(true);
    expect(canAccessFinancialReports("CASHIER")).toBe(false);
  });

  it("allows OWNER and MANAGER to give discounts but denies CASHIER without override", () => {
    expect(hasPermission("OWNER", "sales:discount")).toBe(true);
    expect(hasPermission("MANAGER", "sales:discount")).toBe(true);
    expect(hasPermission("CASHIER", "sales:discount")).toBe(false);
  });
});
