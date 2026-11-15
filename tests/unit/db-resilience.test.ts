import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry } from "@/lib/db/prisma";
import { checkDatabaseHealth } from "@/lib/db/health";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/db/prisma")>();
  return {
    ...actual,
    prisma: {
      $queryRaw: vi.fn(),
    },
  };
});

describe("Database Resilience & Health Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withRetry", () => {
    it("returns result immediately on successful execution", async () => {
      const mockOp = vi.fn().mockResolvedValue({ id: "sale-101", total: 450.0 });

      const result = await withRetry(mockOp, { maxRetries: 3 });

      expect(result).toEqual({ id: "sale-101", total: 450.0 });
      expect(mockOp).toHaveBeenCalledTimes(1);
    });

    it("retries on transient connection error and succeeds", async () => {
      let attempts = 0;
      const mockOp = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Can't reach database server at cloud-pg:5432");
        }
        return "success-after-retry";
      });

      const result = await withRetry(mockOp, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      expect(result).toBe("success-after-retry");
      expect(mockOp).toHaveBeenCalledTimes(3);
    });

    it("gives up and throws after reaching maxRetries", async () => {
      const mockOp = vi.fn().mockRejectedValue(new Error("Connection pool timeout after 10000ms"));

      await expect(
        withRetry(mockOp, {
          maxRetries: 2,
          initialDelayMs: 5,
        })
      ).rejects.toThrow("Connection pool timeout");

      expect(mockOp).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe("checkDatabaseHealth", () => {
    it("reports healthy when SELECT 1 succeeds", async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ "?column?": 1 }]);

      const report = await checkDatabaseHealth();

      expect(report.status).toBe("healthy");
      expect(report.latencyMs).toBeGreaterThanOrEqual(0);
      expect(report.timestamp).toBeDefined();
      expect(report.pool).toBeDefined();
    });

    it("reports unhealthy when SELECT 1 fails", async () => {
      (prisma.$queryRaw as any).mockRejectedValue(new Error("Database host unreachable"));

      const report = await checkDatabaseHealth();

      expect(report.status).toBe("unhealthy");
      expect(report.error).toContain("Database host unreachable");
    });
  });
});
