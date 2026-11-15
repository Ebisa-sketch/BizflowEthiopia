import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { captureException, captureMessage, initSentry } from "@/lib/errors/sentry";
import { handleApiError, AppError } from "@/lib/errors";

describe("Production Error Tracking & Sentry Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("captureException", () => {
    it("returns unique eventId and does not throw when SENTRY_DSN is unset", () => {
      delete process.env.SENTRY_DSN;
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const eventId = captureException(new Error("Test server crash"));

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^err_\d+_/);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("attempts dispatch to Sentry API when SENTRY_DSN is provided", () => {
      process.env.SENTRY_DSN = "https://publickey@o123456.ingest.sentry.io/7891011";

      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const eventId = captureException(new Error("Database connection lost"), {
        tags: { businessId: "biz-123" },
      });

      expect(eventId).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        "https://o123456.ingest.sentry.io/api/7891011/store/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("captureMessage", () => {
    it("logs and returns eventId for informational messages", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const eventId = captureMessage("High memory usage detected", "warning");

      expect(eventId).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("initSentry", () => {
    it("safely initializes without crashing", () => {
      delete process.env.SENTRY_DSN;
      expect(() => initSentry()).not.toThrow();

      process.env.SENTRY_DSN = "https://key@sentry.io/123";
      expect(() => initSentry()).not.toThrow();
    });
  });

  describe("handleApiError integration", () => {
    it("returns 400 with user message for AppError without sending to Sentry", async () => {
      const appErr = new AppError("Invalid phone number format", 400);
      const res = handleApiError(appErr);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid phone number format");
      expect(data.errorId).toBeUndefined(); // Not tracked as 500
    });

    it("returns 500 and attaches errorId for unhandled unexpected Error", async () => {
      const unexpectedErr = new Error("Connection timed out to payment gateway");
      const res = handleApiError(unexpectedErr);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Connection timed out to payment gateway");
      expect(data.errorId).toBeDefined();
      expect(data.errorId).toMatch(/^err_\d+_/);
    });
  });
});
