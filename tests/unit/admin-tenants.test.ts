import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

const { requireSuperAdminMock, countMock, findManyMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  countMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    business: {
      count: countMock,
      findMany: findManyMock,
    },
  },
}));

import { GET } from "@/app/api/admin/tenants/route";

describe("Platform admin tenant directory API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdminMock.mockResolvedValue({ userId: "admin-1" });
    countMock.mockImplementation((args?: { where?: { status?: string; OR?: unknown[] } }) => {
      if (!args) return Promise.resolve(44);
      if (args.where && "OR" in args.where) return Promise.resolve(26);
      if (args.where?.status === "SUSPENDED") return Promise.resolve(3);
      if (args.where?.status === "ACTIVE") return Promise.resolve(8);
      return Promise.resolve(44);
    });
    findManyMock.mockResolvedValue([
      {
        id: "business-1",
        name: "Addis Market",
        contactEmail: "contact@addismarket.et",
        currency: "ETB",
        status: "SUSPENDED",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        _count: { memberships: 4 },
        subscriptions: [
          {
            plan: "BUSINESS",
            status: "ACTIVE",
            billingPeriodEnd: new Date("2025-02-01T00:00:00.000Z"),
          },
        ],
      },
    ]);
  });

  it("requires a platform administrator before querying tenant records", async () => {
    requireSuperAdminMock.mockRejectedValue(
      new AppError("Platform administrator access required.", 403)
    );

    const response = await GET(
      new NextRequest("http://localhost/api/admin/tenants")
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      success: false,
      error: "Platform administrator access required.",
    });
    expect(countMock).not.toHaveBeenCalled();
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns filtered tenant details and overall summary counts", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/admin/tenants?search=addis&status=suspended&page=99"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "SUSPENDED",
          OR: [
            { name: { contains: "addis", mode: "insensitive" } },
            { contactEmail: { contains: "addis", mode: "insensitive" } },
          ],
        },
        skip: 25,
        take: 25,
      })
    );
    expect(body).toMatchObject({
      success: true,
      tenants: [
        {
          id: "business-1",
          memberCount: 4,
          subscription: {
            plan: "BUSINESS",
            status: "ACTIVE",
            billingPeriodEnd: "2025-02-01T00:00:00.000Z",
          },
        },
      ],
      summary: { total: 44, active: 8, suspended: 3 },
      pagination: { page: 2, pageSize: 25, totalCount: 26, totalPages: 2 },
    });
  });

  it("rejects unsupported status filters", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/admin/tenants?status=DELETED")
    );

    expect(response.status).toBe(400);
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
