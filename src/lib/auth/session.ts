import { cookies } from "next/headers";
import { prisma } from "../db/prisma";
import { verifyToken, signToken, SessionPayload } from "./index";
import { BusinessRole, hasPermission, Permission } from "../permissions";
import { AppError } from "../errors";

export const SESSION_COOKIE_NAME = "bizflow_session";

export interface FullSessionUser extends SessionPayload {
  businessName?: string;
  currency?: string;
}

/**
 * Reads and verifies the current session from HTTP cookies
 */
export async function getSession(): Promise<FullSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return null;

    return payload as FullSessionUser;
  } catch {
    return null;
  }
}

/**
 * Requires an authenticated user session, throwing a 401 AppError if unauthenticated
 */
export async function requireAuth(): Promise<FullSessionUser> {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new AppError("Authentication required. Please sign in.", 401);
  }
  return session;
}

/**
 * Requires an active tenant session, verifying the user's membership and permissions in the database
 */
export async function requireTenant(options?: {
  requiredPermission?: Permission;
  allowedRoles?: BusinessRole[];
}): Promise<{
  userId: string;
  businessId: string;
  role: BusinessRole;
  businessName: string;
  currency: string;
}> {
  const session = await requireAuth();

  if (!session.businessId) {
    throw new AppError("No active business selected for this session.", 400);
  }

  // Verify membership directly in PostgreSQL to prevent session spoofing
  const membership = await prisma.membership.findUnique({
    where: {
      businessId_userId: {
        businessId: session.businessId,
        userId: session.userId,
      },
    },
    include: {
      business: true,
      user: true,
    },
  });

  if (!membership || membership.status !== "ACTIVE" || membership.business.status !== "ACTIVE") {
    throw new AppError("Active business membership required or business is suspended.", 403);
  }

  const role = membership.role as BusinessRole;

  if (options?.allowedRoles && !options.allowedRoles.includes(role)) {
    throw new AppError(`Access forbidden. Required role: ${options.allowedRoles.join(" or ")}`, 403);
  }

  if (options?.requiredPermission && !hasPermission(role, options.requiredPermission)) {
    throw new AppError(`Forbidden: Missing required permission '${options.requiredPermission}'`, 403);
  }

  return {
    userId: session.userId,
    businessId: membership.businessId,
    role,
    businessName: membership.business.name,
    currency: membership.business.currency || "ETB",
  };
}

/**
 * Sets session cookie with duration based on remember-me selection (30 days if remembered, 1 day if not)
 */
export async function setSessionCookie(payload: SessionPayload, rememberMe: boolean = true) {
  const token = signToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 1,
  });

  return token;
}

/**
 * Clears the session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
