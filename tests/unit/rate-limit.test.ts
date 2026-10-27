import { describe, it, expect, beforeEach } from "vitest";
import {
  RateLimiter,
  getClientIp,
  createRateLimitResponse,
  loginRateLimiter,
  forgotPasswordRateLimiter,
  registerRateLimiter,
} from "@/lib/rate-limit";

describe("Security & Rate Limiting Module", () => {
  let testLimiter: RateLimiter;

  beforeEach(() => {
    testLimiter = new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 3,
    });
    loginRateLimiter.clearAll();
    forgotPasswordRateLimiter.clearAll();
    registerRateLimiter.clearAll();
  });

  describe("RateLimiter sliding window", () => {
    it("allows attempts within maxAttempts threshold", () => {
      const key = "test:ip:user1";

      const r1 = testLimiter.consume(key);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);
      expect(r1.limit).toBe(3);

      const r2 = testLimiter.consume(key);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = testLimiter.consume(key);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);
    });

    it("blocks attempts exceeding maxAttempts with HTTP 429 retry metadata", () => {
      const key = "test:ip:user2";

      testLimiter.consume(key);
      testLimiter.consume(key);
      testLimiter.consume(key);

      // 4th attempt should be blocked
      const r4 = testLimiter.consume(key);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.retryAfterSeconds).toBeGreaterThan(0);
      expect(r4.retryAfterSeconds).toBeLessThanOrEqual(60);

      expect(r4.headers["Retry-After"]).toBe(String(r4.retryAfterSeconds));
      expect(r4.headers["X-RateLimit-Limit"]).toBe("3");
      expect(r4.headers["X-RateLimit-Remaining"]).toBe("0");
      expect(r4.headers["X-RateLimit-Reset"]).toBeDefined();
    });

    it("checks status without consuming an attempt", () => {
      const key = "test:ip:check-only";

      const checkBefore = testLimiter.check(key);
      expect(checkBefore.allowed).toBe(true);
      expect(checkBefore.remaining).toBe(3);

      testLimiter.consume(key);

      const checkAfter = testLimiter.check(key);
      expect(checkAfter.allowed).toBe(true);
      expect(checkAfter.remaining).toBe(2);
    });

    it("resets counter for a specific key upon success", () => {
      const key = "test:ip:reset-key";

      testLimiter.consume(key);
      testLimiter.consume(key);
      expect(testLimiter.check(key).remaining).toBe(1);

      // User enters correct credentials -> reset counter
      testLimiter.reset(key);

      const afterReset = testLimiter.check(key);
      expect(afterReset.remaining).toBe(3);
    });

    it("maintains separate limits for different keys", () => {
      const userA = "test:ip:userA";
      const userB = "test:ip:userB";

      testLimiter.consume(userA);
      testLimiter.consume(userA);
      testLimiter.consume(userA);

      expect(testLimiter.check(userA).allowed).toBe(false);
      expect(testLimiter.check(userB).allowed).toBe(true);
      expect(testLimiter.check(userB).remaining).toBe(3);
    });
  });

  describe("getClientIp extractor", () => {
    it("extracts the first IP from x-forwarded-for header", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "197.156.120.4, 10.0.0.1, 192.168.1.1");

      const ip = getClientIp(headers);
      expect(ip).toBe("197.156.120.4");
    });

    it("falls back to x-real-ip when x-forwarded-for is missing", () => {
      const headers = new Headers();
      headers.set("x-real-ip", "213.55.85.89");

      const ip = getClientIp(headers);
      expect(ip).toBe("213.55.85.89");
    });

    it("falls back to cf-connecting-ip when Cloudflare is used", () => {
      const headers = new Headers();
      headers.set("cf-connecting-ip", "196.189.24.12");

      const ip = getClientIp(headers);
      expect(ip).toBe("196.189.24.12");
    });

    it("falls back to 127.0.0.1 if no headers are present", () => {
      const headers = new Headers();
      const ip = getClientIp(headers);
      expect(ip).toBe("127.0.0.1");
    });
  });

  describe("createRateLimitResponse", () => {
    it("creates an HTTP 429 response with security headers and message", async () => {
      const result = testLimiter.consume("test:ip:response");
      testLimiter.consume("test:ip:response");
      testLimiter.consume("test:ip:response");
      const blockedResult = testLimiter.consume("test:ip:response");

      const response = createRateLimitResponse(blockedResult);
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe(String(blockedResult.retryAfterSeconds));
      expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Too many requests");
      expect(data.retryAfter).toBe(blockedResult.retryAfterSeconds);
    });
  });
});
