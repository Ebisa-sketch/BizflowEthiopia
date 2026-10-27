import { NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
  headers: Record<string, string>;
}

export class RateLimiter {
  private attempts = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private readonly windowMs: number;
  private readonly maxAttempts: number;

  constructor(config: RateLimitConfig) {
    this.windowMs = config.windowMs;
    this.maxAttempts = config.maxAttempts;
  }

  /**
   * Periodically prunes expired timestamps and stale keys to prevent memory leaks.
   */
  private cleanup(now: number): void {
    if (now - this.lastCleanup < this.windowMs && this.attempts.size < 1000) {
      return;
    }
    this.lastCleanup = now;
    for (const [key, timestamps] of this.attempts.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, valid);
      }
    }
  }

  /**
   * Consumes an attempt for the given key and returns the rate limit status.
   */
  public consume(key: string): RateLimitResult {
    const now = Date.now();
    this.cleanup(now);

    const timestamps = this.attempts.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxAttempts) {
      const oldestAttempt = validTimestamps[0] || now;
      const resetMs = oldestAttempt + this.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - now) / 1000));

      this.attempts.set(key, validTimestamps);

      return {
        allowed: false,
        limit: this.maxAttempts,
        remaining: 0,
        resetMs,
        retryAfterSeconds,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(this.maxAttempts),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetMs / 1000)),
        },
      };
    }

    validTimestamps.push(now);
    this.attempts.set(key, validTimestamps);

    const remaining = Math.max(0, this.maxAttempts - validTimestamps.length);
    const resetMs = validTimestamps[0] + this.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - now) / 1000));

    return {
      allowed: true,
      limit: this.maxAttempts,
      remaining,
      resetMs,
      retryAfterSeconds,
      headers: {
        "X-RateLimit-Limit": String(this.maxAttempts),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(resetMs / 1000)),
      },
    };
  }

  /**
   * Inspects current status without consuming an attempt.
   */
  public check(key: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    const isAllowed = validTimestamps.length < this.maxAttempts;
    const oldestAttempt = validTimestamps[0] || now;
    const resetMs = oldestAttempt + this.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - now) / 1000));
    const remaining = Math.max(0, this.maxAttempts - validTimestamps.length);

    return {
      allowed: isAllowed,
      limit: this.maxAttempts,
      remaining,
      resetMs,
      retryAfterSeconds,
      headers: {
        ...(isAllowed ? {} : { "Retry-After": String(retryAfterSeconds) }),
        "X-RateLimit-Limit": String(this.maxAttempts),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(resetMs / 1000)),
      },
    };
  }

  /**
   * Resets the attempt counter for a specific key (e.g., upon successful login).
   */
  public reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Resets all stored attempts (useful in testing).
   */
  public clearAll(): void {
    this.attempts.clear();
  }
}

/**
 * Extracts the real client IP address from request headers with fallback.
 */
export function getClientIp(request: Request | Headers): string {
  const headers = request instanceof Headers ? request : request.headers;

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Builds a standardized 429 Too Many Requests response with standard headers.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  const message =
    customMessage ||
    `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;

  return NextResponse.json(
    {
      success: false,
      error: message,
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: result.headers,
    }
  );
}

// ---------------------------------------------------------------------------
// Standard Application Rate Limiters
// ---------------------------------------------------------------------------

// Login: Max 5 failed attempts per 15 minutes per IP + Email
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
});

// Password recovery: Max 3 requests per 15 minutes per IP + Email
export const forgotPasswordRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
});

// Registration: Max 6 registrations per 15 minutes per IP
export const registerRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 6,
});
