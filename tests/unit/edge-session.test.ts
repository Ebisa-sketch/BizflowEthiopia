import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { isValidEdgeSessionToken } from "@/lib/auth/edge-session";
import { env } from "@/lib/env";

describe("Edge session verification", () => {
  it("accepts a correctly signed, unexpired application session", async () => {
    const token = jwt.sign(
      { userId: "user-1", businessId: "business-1" },
      env.JWT_SECRET,
      { expiresIn: "5m", algorithm: "HS256" }
    );

    await expect(isValidEdgeSessionToken(token, env.JWT_SECRET)).resolves.toBe(true);
  });

  it("rejects absent, malformed, and tampered cookies", async () => {
    const token = jwt.sign({ userId: "user-1" }, env.JWT_SECRET, {
      expiresIn: "5m",
      algorithm: "HS256",
    });

    await expect(isValidEdgeSessionToken(undefined, env.JWT_SECRET)).resolves.toBe(false);
    await expect(isValidEdgeSessionToken("not-a-jwt", env.JWT_SECRET)).resolves.toBe(false);
    const [header, payload, signature] = token.split(".");
    const tamperedSignature = `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
    await expect(
      isValidEdgeSessionToken(`${header}.${payload}.${tamperedSignature}`, env.JWT_SECRET)
    ).resolves.toBe(false);
  });

  it("rejects expired tokens, unsupported algorithms, and missing signing secrets", async () => {
    const expiredToken = jwt.sign({ userId: "user-1" }, env.JWT_SECRET, {
      expiresIn: -1,
      algorithm: "HS256",
    });
    const unsignedToken = jwt.sign({ userId: "user-1" }, env.JWT_SECRET, {
      expiresIn: "5m",
      algorithm: "HS384",
    });

    await expect(
      isValidEdgeSessionToken(expiredToken, env.JWT_SECRET)
    ).resolves.toBe(false);
    await expect(
      isValidEdgeSessionToken(unsignedToken, env.JWT_SECRET)
    ).resolves.toBe(false);
    await expect(isValidEdgeSessionToken(expiredToken, undefined)).resolves.toBe(false);
  });

  it("requires a non-empty user ID and an expiration claim", async () => {
    const missingUserId = jwt.sign({}, env.JWT_SECRET, {
      expiresIn: "5m",
      algorithm: "HS256",
    });
    const missingExpiration = jwt.sign({ userId: "user-1" }, env.JWT_SECRET, {
      noTimestamp: true,
      algorithm: "HS256",
    });

    await expect(
      isValidEdgeSessionToken(missingUserId, env.JWT_SECRET)
    ).resolves.toBe(false);
    await expect(
      isValidEdgeSessionToken(missingExpiration, env.JWT_SECRET)
    ).resolves.toBe(false);
  });
});
