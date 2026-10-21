import { cookies } from "next/headers";
import { prisma } from "../db/prisma";
import { GlobalRole } from "@prisma/client";
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

export async function requireSuperAdmin(): Promise<{ userId: string }> {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, globalRole: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== "ACTIVE") {
    throw new AppError("An active account is required.", 403);
  }
  if (user.globalRole !== GlobalRole.SUPERADMIN) {
    throw new AppError("Platform administrator access required.", 403);
  }

  return { userId: user.id };
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

  // Verify user exists in database and is active
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, accountStatus: true, email: true, name: true, globalRole: true },
  });

  if (!dbUser || dbUser.accountStatus !== "ACTIVE") {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch {
      // Ignore in read-only contexts
    }
    throw new AppError("Authentication required. Please sign in.", 401);
  }

  // Verify membership directly in PostgreSQL to prevent session spoofing
  let membership = session.businessId
    ? await prisma.membership.findUnique({
        where: {
          businessId_userId: {
            businessId: session.businessId,
            userId: session.userId,
          },
        },
        select: {
          businessId: true,
          role: true,
          status: true,
          business: {
            select: {
              name: true,
              currency: true,
              status: true,
            },
          },
        },
      })
    : null;

  // Self-heal: If the session has no businessId or points to a stale/inactive business,
  // resolve the user's primary active membership with an active business
  if (!membership || membership.status !== "ACTIVE" || membership.business.status !== "ACTIVE") {
    const fallbackMembership = await prisma.membership.findFirst({
      where: {
        userId: session.userId,
        status: "ACTIVE",
        business: {
          status: "ACTIVE",
        },
      },
      select: {
        businessId: true,
        role: true,
        status: true,
        business: {
          select: {
            name: true,
            currency: true,
            status: true,
          },
        },
      },
    });

    if (fallbackMembership) {
      membership = fallbackMembership;
      try {
        await setSessionCookie({
          userId: session.userId,
          email: session.email,
          name: session.name,
          businessId: fallbackMembership.businessId,
          role: fallbackMembership.role as BusinessRole,
        });
      } catch {
        // Continue even if setting cookie cannot be performed in read-only RSC
      }
    }
  }

  // Self-heal for Superadmin: if superadmin has no active business membership yet,
  // dynamically attach them as OWNER to the targeted business or first active store
  if (
    (!membership || membership.status !== "ACTIVE" || membership.business.status !== "ACTIVE") &&
    dbUser.globalRole === "SUPERADMIN"
  ) {
    let targetBusiness = session.businessId
      ? await prisma.business.findUnique({
          where: { id: session.businessId },
          select: { id: true, name: true, currency: true, status: true },
        })
      : null;

    if (!targetBusiness || targetBusiness.status !== "ACTIVE") {
      targetBusiness = await prisma.business.findFirst({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, currency: true, status: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (targetBusiness) {
      const adminMembership = await prisma.membership.upsert({
        where: {
          businessId_userId: {
            businessId: targetBusiness.id,
            userId: dbUser.id,
          },
        },
        update: {
          role: "OWNER",
          status: "ACTIVE",
        },
        create: {
          businessId: targetBusiness.id,
          userId: dbUser.id,
          role: "OWNER",
          status: "ACTIVE",
        },
        select: {
          businessId: true,
          role: true,
          status: true,
          business: {
            select: {
              name: true,
              currency: true,
              status: true,
            },
          },
        },
      });

      membership = adminMembership;

      try {
        await setSessionCookie({
          userId: session.userId,
          email: session.email,
          name: session.name,
          businessId: targetBusiness.id,
          role: "OWNER",
        });
      } catch {
        // Continue even if setting cookie cannot be performed in read-only RSC
      }
    }
  }

  if (!membership || membership.status !== "ACTIVE" || membership.business.status !== "ACTIVE") {
    throw new AppError("Active business membership required or business is suspended.", 403);
  }

  const role = membership.role as BusinessRole;

  // Super Admin has universal platform authorization
  if (dbUser.globalRole === "SUPERADMIN") {
    return {
      userId: session.userId,
      businessId: membership.businessId,
      role: role || "OWNER",
      businessName: membership.business.name,
      currency: membership.business.currency || "ETB",
    };
  }

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
