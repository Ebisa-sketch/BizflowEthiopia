import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

const GRANT_ISSUER = "bizflow-ethiopia";
const GRANT_AUDIENCE = "pos-sales";
const GRANT_LIFETIME = "5m";

interface ManagerDiscountGrant {
  managerUserId: string;
  businessId: string;
  cashierId: string;
  permission: "sales:discount";
}

export function createManagerDiscountGrant(input: ManagerDiscountGrant): string {
  return jwt.sign(input, env.JWT_SECRET, {
    expiresIn: GRANT_LIFETIME,
    issuer: GRANT_ISSUER,
    audience: GRANT_AUDIENCE,
    algorithm: "HS256",
  });
}

export function verifyManagerDiscountGrant(
  token: string,
  expected: Pick<ManagerDiscountGrant, "businessId" | "cashierId">
): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: GRANT_ISSUER,
      audience: GRANT_AUDIENCE,
      algorithms: ["HS256"],
    });
    if (
      typeof payload === "string" ||
      payload.permission !== "sales:discount" ||
      typeof payload.managerUserId !== "string" ||
      payload.businessId !== expected.businessId ||
      payload.cashierId !== expected.cashierId
    ) {
      throw new Error("Invalid manager approval grant claims");
    }
    return payload.managerUserId;
  } catch {
    throw new AppError("Manager approval is invalid or expired. Please request approval again.", 403);
  }
}
