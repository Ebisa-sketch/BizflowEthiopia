export type BusinessRole = "OWNER" | "MANAGER" | "CASHIER" | "INVENTORY";

export type Permission =
  | "business:manage"
  | "staff:manage"
  | "products:view"
  | "products:manage"
  | "inventory:view"
  | "inventory:adjust"
  | "sales:create"
  | "sales:view"
  | "sales:reverse"
  | "sales:discount"
  | "expenses:manage"
  | "expenses:view"
  | "reports:view_financial"
  | "reports:view_operational"
  | "subscription:manage";

const ROLE_PERMISSIONS: Record<BusinessRole, Permission[]> = {
  OWNER: [
    "business:manage",
    "staff:manage",
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:adjust",
    "sales:create",
    "sales:view",
    "sales:reverse",
    "sales:discount",
    "expenses:manage",
    "expenses:view",
    "reports:view_financial",
    "reports:view_operational",
    "subscription:manage",
  ],
  MANAGER: [
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:adjust",
    "sales:create",
    "sales:view",
    "sales:discount",
    "expenses:manage",
    "expenses:view",
    "reports:view_operational",
  ],
  CASHIER: [
    "products:view",
    "inventory:view",
    "sales:create",
    "sales:view",
  ],
  INVENTORY: [
    "products:view",
    "products:manage",
    "inventory:view",
    "inventory:adjust",
    "reports:view_operational",
  ],
};

/**
 * Check if a given business role possesses a specific permission
 */
export function hasPermission(role: BusinessRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role can access financial gross profit & sensitive reports
 */
export function canAccessFinancialReports(role: BusinessRole): boolean {
  return hasPermission(role, "reports:view_financial");
}
