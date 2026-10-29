import { describe, it, expect } from "vitest";
import {
  SIDEBAR_NAV_GROUPS,
  filterNavGroupsByRole,
  isRouteActive,
} from "@/lib/navigation";

describe("Sidebar Navigation & Role-Based Access Control", () => {
  it("allows OWNER to see all business management and operational groups", () => {
    const groups = filterNavGroupsByRole(SIDEBAR_NAV_GROUPS, "OWNER", false);
    const groupIds = groups.map((g) => g.id);

    expect(groupIds).toContain("workspace");
    expect(groupIds).toContain("catalog");
    expect(groupIds).toContain("finance");
    expect(groupIds).toContain("management");

    const mgmtItems = groups.find((g) => g.id === "management")?.items.map((i) => i.href);
    expect(mgmtItems).toContain("/staff");
    expect(mgmtItems).toContain("/settings");
    expect(mgmtItems).toContain("/subscription");
    expect(mgmtItems).not.toContain("/admin");
  });

  it("restricts CASHIER from seeing sensitive finance and management groups", () => {
    const groups = filterNavGroupsByRole(SIDEBAR_NAV_GROUPS, "CASHIER", false);
    const groupIds = groups.map((g) => g.id);

    expect(groupIds).toContain("workspace");
    expect(groupIds).toContain("catalog");
    expect(groupIds).not.toContain("finance");
    expect(groupIds).not.toContain("management");

    const workspaceHrefs = groups.find((g) => g.id === "workspace")?.items.map((i) => i.href);
    expect(workspaceHrefs).toContain("/dashboard");
    expect(workspaceHrefs).toContain("/sales/new");
    expect(workspaceHrefs).toContain("/sales");
  });

  it("allows INVENTORY role to see catalog and stock movements but restricts checkout and expenses", () => {
    const groups = filterNavGroupsByRole(SIDEBAR_NAV_GROUPS, "INVENTORY", false);

    const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(allHrefs).toContain("/dashboard");
    expect(allHrefs).toContain("/products");
    expect(allHrefs).toContain("/inventory");
    expect(allHrefs).toContain("/stock-movements");
    expect(allHrefs).not.toContain("/sales/new");
    expect(allHrefs).not.toContain("/expenses");
    expect(allHrefs).not.toContain("/staff");
  });

  it("allows MANAGER to see operations and finance but restricts business owner settings", () => {
    const groups = filterNavGroupsByRole(SIDEBAR_NAV_GROUPS, "MANAGER", false);
    const groupIds = groups.map((g) => g.id);

    expect(groupIds).toContain("workspace");
    expect(groupIds).toContain("catalog");
    expect(groupIds).toContain("finance");
    expect(groupIds).not.toContain("management");

    const financeHrefs = groups.find((g) => g.id === "finance")?.items.map((i) => i.href);
    expect(financeHrefs).toContain("/expenses");
    expect(financeHrefs).toContain("/reports");
    expect(financeHrefs).toContain("/payments");
  });

  it("exposes platform Administration only to users with globalRole SUPERADMIN", () => {
    const standardOwner = filterNavGroupsByRole(SIDEBAR_NAV_GROUPS, "OWNER", false);
    const superadminOwner = filterNavGroupsByRole(SIDEBAR_NAV_GROUPS, "OWNER", true);

    const standardHrefs = standardOwner.flatMap((g) => g.items.map((i) => i.href));
    const superadminHrefs = superadminOwner.flatMap((g) => g.items.map((i) => i.href));

    expect(standardHrefs).not.toContain("/admin");
    expect(superadminHrefs).toContain("/admin");
  });
});

describe("Sidebar Active Route Resolution", () => {
  it("distinguishes POS Checkout from Sales History", () => {
    expect(isRouteActive("/sales/new", "/sales/new")).toBe(true);
    expect(isRouteActive("/sales", "/sales/new")).toBe(false);

    expect(isRouteActive("/sales", "/sales")).toBe(true);
    expect(isRouteActive("/sales/new", "/sales")).toBe(false);
  });

  it("correctly highlights Sales History for nested sale detail routes", () => {
    expect(isRouteActive("/sales", "/sales/INV-2026-001")).toBe(true);
    expect(isRouteActive("/sales/new", "/sales/INV-2026-001")).toBe(false);
  });

  it("correctly separates subtab routes like categories, stock movements, and cash reports", () => {
    // Products root vs Categories view
    expect(isRouteActive("/products", "/products", "")).toBe(true);
    expect(isRouteActive("/products?view=categories", "/products", "view=categories")).toBe(true);
    expect(isRouteActive("/products", "/products", "view=categories")).toBe(false);

    // Inventory vs dedicated Stock Movements page
    expect(isRouteActive("/inventory", "/inventory", "")).toBe(true);
    expect(isRouteActive("/stock-movements", "/stock-movements", "")).toBe(true);
    expect(isRouteActive("/inventory", "/stock-movements", "")).toBe(false);
    expect(isRouteActive("/stock-movements", "/inventory", "")).toBe(false);

    // Reports vs dedicated Payments & Till page
    expect(isRouteActive("/reports", "/reports", "")).toBe(true);
    expect(isRouteActive("/payments", "/payments", "")).toBe(true);
    expect(isRouteActive("/reports", "/payments", "")).toBe(false);
    expect(isRouteActive("/payments", "/reports", "")).toBe(false);
  });

  it("accurately highlights dashboard only when directly on /dashboard", () => {
    expect(isRouteActive("/dashboard", "/dashboard")).toBe(true);
    expect(isRouteActive("/dashboard", "/sales")).toBe(false);
  });

  it("accurately matches nested routes for customers, expenses, and staff", () => {
    expect(isRouteActive("/customers", "/customers/cust-123")).toBe(true);
    expect(isRouteActive("/expenses", "/expenses/new")).toBe(true);
    expect(isRouteActive("/expenses", "/expenses/exp-456")).toBe(true);
    expect(isRouteActive("/staff", "/staff/invite")).toBe(true);
    expect(isRouteActive("/settings", "/settings/security")).toBe(true);
  });
});

describe("Sidebar Alert & Badge Logic", () => {
  function getInventoryBadge(lowStockCount: number): string | undefined {
    if (lowStockCount <= 0) return undefined;
    return lowStockCount > 9 ? "9+" : String(lowStockCount);
  }

  it("suppresses inventory badge when low stock count is 0", () => {
    expect(getInventoryBadge(0)).toBeUndefined();
    expect(getInventoryBadge(-1)).toBeUndefined();
  });

  it("formats positive inventory alerts correctly", () => {
    expect(getInventoryBadge(1)).toBe("1");
    expect(getInventoryBadge(5)).toBe("5");
    expect(getInventoryBadge(9)).toBe("9");
    expect(getInventoryBadge(10)).toBe("9+");
    expect(getInventoryBadge(42)).toBe("9+");
  });
});

