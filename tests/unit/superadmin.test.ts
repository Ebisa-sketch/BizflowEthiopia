import { beforeEach, describe, expect, it, vi } from "vitest";
import { signToken } from "@/lib/auth";

const { cookiesMock, findUniqueMock, findFirstBusinessMock, upsertMembershipMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  findUniqueMock: vi.fn(),
  findFirstBusinessMock: vi.fn(),
  upsertMembershipMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
    business: {
      findFirst: findFirstBusinessMock,
      findUnique: vi.fn(),
    },
    membership: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      upsert: upsertMembershipMock,
    },
  },
}));

import { requireSuperAdmin, requireTenant } from "@/lib/auth/session";

describe("Platform administrator authorization", () => {
  const sessionToken = signToken({
    userId: "user-1",
    email: "admin@example.com",
    name: "Admin User",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      get: () => ({ value: sessionToken }),
      set: vi.fn(),
    });
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      globalRole: "SUPERADMIN",
      accountStatus: "ACTIVE",
    });
  });

  it("checks the current database role and active account status", async () => {
    await expect(requireSuperAdmin()).resolves.toEqual({ userId: "user-1" });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { id: true, globalRole: true, accountStatus: true },
    });
  });

  it("rejects regular, suspended, and missing users", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "user-1",
      globalRole: "USER",
      accountStatus: "ACTIVE",
    });
    await expect(requireSuperAdmin()).rejects.toThrow(/administrator access required/i);

    findUniqueMock.mockResolvedValueOnce({
      id: "user-1",
      globalRole: "SUPERADMIN",
      accountStatus: "SUSPENDED",
    });
    await expect(requireSuperAdmin()).rejects.toThrow(/active account is required/i);

    findUniqueMock.mockResolvedValueOnce(null);
    await expect(requireSuperAdmin()).rejects.toThrow(/active account is required/i);
  });

  it("rejects requests without a valid authenticated session", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "invalid-token" }) });

    await expect(requireSuperAdmin()).rejects.toThrow(/authentication required/i);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("seamlessly auto-attaches SUPERADMIN to the active store in requireTenant without throwing 403", async () => {
    findFirstBusinessMock.mockResolvedValueOnce({
      id: "store-100",
      name: "Bole Central Store",
      currency: "ETB",
      status: "ACTIVE",
    });

    upsertMembershipMock.mockResolvedValueOnce({
      businessId: "store-100",
      role: "OWNER",
      status: "ACTIVE",
      business: {
        name: "Bole Central Store",
        currency: "ETB",
        status: "ACTIVE",
      },
    });

    const tenantContext = await requireTenant();
    expect(tenantContext).toEqual({
      userId: "user-1",
      businessId: "store-100",
      role: "OWNER",
      businessName: "Bole Central Store",
      currency: "ETB",
    });
  });
});
