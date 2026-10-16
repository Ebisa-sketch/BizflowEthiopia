import { beforeEach, describe, expect, it, vi } from "vitest";
import { signToken } from "@/lib/auth";

const { cookiesMock, findUniqueMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

import { requireSuperAdmin } from "@/lib/auth/session";

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
});
