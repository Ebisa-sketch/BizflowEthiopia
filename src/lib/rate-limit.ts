import { NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  prefix?: string;
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
  private readonly prefix: string;

  constructor(config: RateLimitConfig) {
    this.windowMs = config.windowMs;
    this.maxAttempts = config.maxAttempts;
    this.prefix = config.prefix || "rl";
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
   * Distributed rate limit consumption. Uses Upstash/Redis REST API if configured,
   * otherwise seamlessly falls back to the in-memory sliding window limiter.
   */
  public async consumeAsync(key: string): Promise<RateLimitResult> {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return this.consume(key);
    }

    try {
      const redisKey = `${this.prefix}:${key}`;
      const windowSec = Math.ceil(this.windowMs / 1000);

      // Execute atomic pipeline: INCR and EXPIRE if new
      const pipelineRes = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["TTL", redisKey],
        ]),
      });

      if (!pipelineRes.ok) {
        return this.consume(key);
      }

      const results = (await pipelineRes.json()) as Array<{ result?: number }>;
      const currentCount = Number(results[0]?.result ?? 1);
      let ttl = Number(results[1]?.result ?? -1);

      // If key had no TTL or is fresh, set TTL
      if (ttl <= 0) {
        await fetch(`${redisUrl}/expire/${redisKey}/${windowSec}`, {
          headers: { Authorization: `Bearer ${redisToken}` },
        }).catch(() => {});
        ttl = windowSec;
      }

      const allowed = currentCount <= this.maxAttempts;
      const remaining = Math.max(0, this.maxAttempts - currentCount);
      const retryAfterSeconds = allowed ? 0 : Math.max(1, ttl);
      const resetMs = Date.now() + ttl * 1000;

      return {
        allowed,
        limit: this.maxAttempts,
        remaining,
        resetMs,
        retryAfterSeconds,
        headers: {
          ...(allowed ? {} : { "Retry-After": String(retryAfterSeconds) }),
          "X-RateLimit-Limit": String(this.maxAttempts),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(resetMs / 1000)),
        },
      };
    } catch {
      // Graceful fallback to memory on external service failure
      return this.consume(key);
    }
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
