import { BusinessRole } from "../permissions";

export interface TenantContext {
  userId: string;
  businessId: string;
  role: BusinessRole;
  businessName: string;
  currency: string;
}

/**
 * Tenant scoping utility: Attaches businessId automatically to Prisma where queries
 */
export function scopeToTenant<T extends Record<string, unknown>>(
  businessId: string,
  query: T = {} as T
): T & { businessId: string } {
  if (!businessId) {
    throw new Error("SECURITY VIOLATION: Cannot execute tenant-scoped query without valid businessId");
  }
  return {
    ...query,
    businessId,
  };
}
