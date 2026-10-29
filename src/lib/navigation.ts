import { BusinessRole, hasPermission, Permission } from "@/lib/permissions";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  Tag,
  Layers,
  History,
  CreditCard,
  BarChart3,
  Banknote,
  UserCheck,
  Settings,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export interface NavItemDef {
  key: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: "accent" | "alert" | "neutral";
  permission?: Permission;
  superadminOnly?: boolean;
}

export interface NavGroupDef {
  id: string;
  label: string;
  items: NavItemDef[];
}

export const SIDEBAR_NAV_GROUPS: NavGroupDef[] = [
  {
    id: "workspace",
    label: "WORKSPACE",
    items: [
      {
        key: "nav.dashboard",
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        key: "nav.pos",
        name: "POS Checkout",
        href: "/sales/new",
        icon: ShoppingCart,
        badge: "POS",
        badgeType: "accent",
        permission: "sales:create",
      },
      {
        key: "nav.sales",
        name: "Sales History",
        href: "/sales",
        icon: Receipt,
        permission: "sales:view",
      },
      {
        key: "nav.customers",
        name: "Customers & Credit",
        href: "/customers",
        icon: Users,
        badge: "IDDA",
        badgeType: "neutral",
      },
    ],
  },
  {
    id: "catalog",
    label: "CATALOG & STOCK",
    items: [
      {
        key: "nav.products",
        name: "Products",
        href: "/products",
        icon: Package,
        permission: "products:view",
      },
      {
        key: "nav.categories",
        name: "Categories",
        href: "/categories",
        icon: Tag,
        permission: "products:view",
      },
      {
        key: "nav.inventory",
        name: "Inventory",
        href: "/inventory",
        icon: Layers,
        permission: "inventory:view",
      },
      {
        key: "nav.stockMovements",
        name: "Stock Movements",
        href: "/stock-movements",
        icon: History,
        permission: "inventory:view",
      },
    ],
  },
  {
    id: "finance",
    label: "FINANCE",
    items: [
      {
        key: "nav.expenses",
        name: "Expenses",
        href: "/expenses",
        icon: CreditCard,
        permission: "expenses:view",
      },
      {
        key: "nav.reports",
        name: "Reports & P&L",
        href: "/reports",
        icon: BarChart3,
        permission: "reports:view_operational",
      },
      {
        key: "nav.payments",
        name: "Payments & Till",
        href: "/payments",
        icon: Banknote,
        permission: "reports:view_operational",
      },
    ],
  },
  {
    id: "management",
    label: "MANAGEMENT",
    items: [
      {
        key: "nav.staff",
        name: "Staff & Roles",
        href: "/staff",
        icon: UserCheck,
        permission: "staff:manage",
      },
      {
        key: "nav.settings",
        name: "Business Settings",
        href: "/settings",
        icon: Settings,
        permission: "business:manage",
      },
      {
        key: "nav.subscription",
        name: "Subscription",
        href: "/subscription",
        icon: Sparkles,
        permission: "subscription:manage",
      },
      {
        key: "nav.admin",
        name: "Administration",
        href: "/admin",
        icon: ShieldAlert,
        superadminOnly: true,
      },
    ],
  },
];

/**
 * Filter navigation groups based on real role permissions and global superadmin status
 */
export function filterNavGroupsByRole(
  groups: NavGroupDef[],
  role: BusinessRole | string,
  isSuperadmin: boolean = false
): NavGroupDef[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.superadminOnly) {
          return isSuperadmin;
        }
        if (item.permission) {
          return hasPermission(role as BusinessRole, item.permission);
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Precise active route detection, supporting nested routes and search params
 */
export function isRouteActive(
  itemHref: string,
  pathname: string,
  search: string = ""
): boolean {
  if (!pathname) return false;
  const [baseHref, queryPart] = itemHref.split("?");

  if (queryPart) {
    if (pathname !== baseHref) return false;
    const queryParams = new URLSearchParams(queryPart);
    const activeParams = new URLSearchParams(search);
    for (const [key, val] of queryParams.entries()) {
      if (activeParams.get(key) !== val) return false;
    }
    return true;
  }

  // Dashboard root
  if (baseHref === "/dashboard") {
    return pathname === "/dashboard";
  }

  // POS Checkout is distinct from Sales History
  if (baseHref === "/sales/new") {
    return pathname === "/sales/new";
  }

  if (baseHref === "/sales") {
    return (
      (pathname === "/sales" || pathname.startsWith("/sales/")) &&
      pathname !== "/sales/new"
    );
  }

  // Categories route
  if (baseHref === "/categories") {
    return (
      pathname === "/categories" ||
      pathname.startsWith("/categories/") ||
      (pathname === "/products" && new URLSearchParams(search).get("view") === "categories")
    );
  }

  // For /products, only active when not showing categories subview
  if (baseHref === "/products") {
    if (pathname !== "/products" && !pathname.startsWith("/products/")) return false;
    const activeParams = new URLSearchParams(search);
    return activeParams.get("view") !== "categories";
  }

  // For /inventory, only active when NOT on the dedicated stock-movements page
  if (baseHref === "/inventory") {
    return pathname === "/inventory" || pathname.startsWith("/inventory/");
  }

  // For /reports, only active when NOT on the dedicated payments page
  if (baseHref === "/reports") {
    return pathname === "/reports" || pathname.startsWith("/reports/");
  }

  // Stock Movements dedicated route
  if (baseHref === "/stock-movements") {
    return pathname === "/stock-movements" || pathname.startsWith("/stock-movements/");
  }

  // Payments & Till dedicated route
  if (baseHref === "/payments") {
    return pathname === "/payments" || pathname.startsWith("/payments/");
  }

  // Generic nested match (e.g. /customers/[id], /expenses/[id], /settings/profile)
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}
