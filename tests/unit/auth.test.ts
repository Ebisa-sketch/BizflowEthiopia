import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword, signToken, verifyToken } from "@/lib/auth";
import { scopeToTenant } from "@/lib/tenant";
import { env } from "@/lib/env";

describe("Authentication & Token Service", () => {
  it("hashes password and verifies match correctly", async () => {
    const rawPassword = "TestPassword@123";
    const hashed = await hashPassword(rawPassword);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(rawPassword);

    const isMatch = await verifyPassword(rawPassword, hashed);
    expect(isMatch).toBe(true);

    const isBadMatch = await verifyPassword("WrongPassword", hashed);
    expect(isBadMatch).toBe(false);
  });

  it("signs and verifies valid JWT session tokens", () => {
    const payload = {
      userId: "usr-12345",
      email: "test@addismart.et",
      name: "Test User",
      businessId: "biz-67890",
      role: "OWNER",
    };

    const token = signToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.businessId).toBe(payload.businessId);
    expect(decoded?.role).toBe(payload.role);

    const claims = jwt.decode(token);
    expect(claims).toMatchObject({
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
    if (claims && typeof claims !== "string" && claims.exp && claims.iat) {
      expect(claims.exp - claims.iat).toBe(durationInSeconds(env.JWT_EXPIRES_IN));
    }
  });

  it("returns null for malformed or tampered JWT tokens", () => {
    const invalidToken = "eyJhGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.badpayload.signature";
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });

  function durationInSeconds(duration: string): number {
    const match = duration.match(/^(\d+)([smhdwy])$/);
    if (!match) throw new Error(`Unsupported test duration: ${duration}`);

    const amount = Number(match[1]);
    const unitSeconds: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
      w: 7 * 24 * 60 * 60,
      y: 365 * 24 * 60 * 60,
    };

    return amount * unitSeconds[match[2]];
  }
});

describe("Multi-tenant Query Scoping", () => {
  it("enforces tenant boundary on Prisma query objects", () => {
    const targetBusinessId = "biz-112233";
    const baseQuery = { status: "ACTIVE" };

    const scoped = scopeToTenant(targetBusinessId, baseQuery);
    expect(scoped.businessId).toBe(targetBusinessId);
    expect(scoped.status).toBe("ACTIVE");
  });

  it("throws security violation error if businessId is missing or empty", () => {
    expect(() => {
      scopeToTenant("", { status: "ACTIVE" });
    }).toThrow("SECURITY VIOLATION: Cannot execute tenant-scoped query without valid businessId");
  });
});
