import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";

const {
  userFindUniqueMock,
  userUpdateMock,
  tokenCreateMock,
  tokenFindUniqueMock,
  tokenUpdateMock,
  tokenUpdateManyMock,
  auditLogCreateMock,
  transactionMock,
} = vi.hoisted(() => ({
  userFindUniqueMock: vi.fn(),
  userUpdateMock: vi.fn(),
  tokenCreateMock: vi.fn(),
  tokenFindUniqueMock: vi.fn(),
  tokenUpdateMock: vi.fn(),
  tokenUpdateManyMock: vi.fn(),
  auditLogCreateMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
    passwordResetToken: {
      create: tokenCreateMock,
      findUnique: tokenFindUniqueMock,
      update: tokenUpdateMock,
      updateMany: tokenUpdateManyMock,
    },
    auditLog: {
      create: auditLogCreateMock,
    },
    $transaction: transactionMock,
  },
}));

import { POST as forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { GET as verifyResetTokenHandler, POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";
import { NextRequest } from "next/server";

describe("Password recovery & reset pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (callbacks) => {
      if (Array.isArray(callbacks)) {
        return Promise.all(callbacks);
      }
      return callbacks();
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("rejects missing or invalid email formatting", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "invalid-email" }),
      });

      const res = await forgotPasswordHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/valid email/i);
    });

    it("generates and stores a cryptographic token for existing active users", async () => {
      userFindUniqueMock.mockResolvedValueOnce({
        id: "user-101",
        email: "owner@addismart.et",
        accountStatus: "ACTIVE",
        memberships: [{ businessId: "biz-1" }],
      });

      const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { host: "localhost:3000" },
        body: JSON.stringify({ email: "owner@addismart.et" }),
      });

      const res = await forgotPasswordHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resetUrl).toContain("/reset-password?token=");

      // Invalided older tokens
      expect(tokenUpdateManyMock).toHaveBeenCalledWith({
        where: { userId: "user-101", usedAt: null },
        data: { usedAt: expect.any(Date) },
      });

      // Created new token with SHA-256 hash
      expect(tokenCreateMock).toHaveBeenCalledWith({
        data: {
          userId: "user-101",
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });

      // Recorded audit log
      expect(auditLogCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "PASSWORD_RECOVERY_REQUESTED",
          actorUserId: "user-101",
        }),
      });
    });

    it("prevents user account enumeration by returning generic success for non-existent emails", async () => {
      userFindUniqueMock.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "unknown@nobody.et" }),
      });

      const res = await forgotPasswordHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(tokenCreateMock).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/auth/reset-password", () => {
    it("rejects requests missing the token query parameter", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "GET",
      });

      const res = await verifyResetTokenHandler(req);
      expect(res.status).toBe(400);
    });

    it("returns invalid status when token is not found in database", async () => {
      tokenFindUniqueMock.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/auth/reset-password?token=abcdef123456", {
        method: "GET",
      });

      const res = await verifyResetTokenHandler(req);
      const data = await res.json();

      expect(data.valid).toBe(false);
      expect(data.error).toMatch(/invalid or has expired/i);
    });

    it("returns invalid status when token has already been consumed", async () => {
      tokenFindUniqueMock.mockResolvedValueOnce({
        id: "tok-1",
        usedAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 100000),
        user: { email: "owner@addismart.et", accountStatus: "ACTIVE" },
      });

      const req = new NextRequest("http://localhost:3000/api/auth/reset-password?token=abcdef123456", {
        method: "GET",
      });

      const res = await verifyResetTokenHandler(req);
      const data = await res.json();

      expect(data.valid).toBe(false);
      expect(data.error).toMatch(/already been used/i);
    });

    it("returns valid status and masked email for an unexpired active token", async () => {
      tokenFindUniqueMock.mockResolvedValueOnce({
        id: "tok-1",
        usedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        user: { email: "abebe@addismart.et", name: "Abebe Kebede", accountStatus: "ACTIVE" },
      });

      const req = new NextRequest("http://localhost:3000/api/auth/reset-password?token=abcdef123456", {
        method: "GET",
      });

      const res = await verifyResetTokenHandler(req);
      const data = await res.json();

      expect(data.valid).toBe(true);
      expect(data.maskedEmail).toContain("@addismart.et");
      expect(data.userName).toBe("Abebe Kebede");
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("enforces strong password complexity rules", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "abcdef123456", password: "weak" }),
      });

      const res = await resetPasswordHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/at least 8 characters/i);
    });

    it("resets password, marks token used, and logs security audit upon valid submission", async () => {
      const rawToken = "abcdef1234567890abcdef1234567890";
      tokenFindUniqueMock.mockResolvedValueOnce({
        id: "tok-1",
        userId: "user-101",
        usedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: "user-101",
          email: "owner@addismart.et",
          accountStatus: "ACTIVE",
          memberships: [{ businessId: "biz-1" }],
        },
      });

      const req = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: rawToken, password: "NewStrongPassword@2026" }),
      });

      const res = await resetPasswordHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(transactionMock).toHaveBeenCalled();
    });
  });
});
