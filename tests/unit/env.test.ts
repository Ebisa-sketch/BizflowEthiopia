import { describe, expect, it } from "vitest";
import { assertProductionEnv } from "@/lib/env";

describe("production environment validation", () => {
  it("rejects missing production database and JWT settings", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "production" })).toThrow(
      "DATABASE_URL must be set in production; JWT_SECRET must be set in production"
    );
  });

  it("requires a 32-character production JWT secret", () => {
    expect(() =>
      assertProductionEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://localhost/bizflow",
        JWT_SECRET: "short-secret",
      })
    ).toThrow("JWT_SECRET must be at least 32 characters in production");
  });

  it("accepts configured production credentials", () => {
    expect(() =>
      assertProductionEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://localhost/bizflow",
        JWT_SECRET: "a-production-secret-with-at-least-32-characters",
      })
    ).not.toThrow();
  });

  it("does not require production credentials in development", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "development" })).not.toThrow();
  });

  it("permits build-time phase without failing page data collection", () => {
    expect(() =>
      assertProductionEnv({
        NODE_ENV: "production",
        NEXT_PHASE: "phase-production-build",
      })
    ).not.toThrow();
  });
});
