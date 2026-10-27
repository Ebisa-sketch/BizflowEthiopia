import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { handleApiError, AppError } from "@/lib/errors";

import {
  getClientIp,
  loginRateLimiter,
  createRateLimitResponse,
} from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = getClientIp(request);
    const rateLimitKey = `login:${clientIp}:${normalizedEmail}`;

    // 1. Check if this IP + email is currently locked out
    const rateLimitStatus = loginRateLimiter.check(rateLimitKey);
    if (!rateLimitStatus.allowed) {
      return createRateLimitResponse(
        rateLimitStatus,
        `Too many failed login attempts. Please try again in ${Math.ceil(rateLimitStatus.retryAfterSeconds / 60)} minutes.`
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        accountStatus: true,
        globalRole: true,
        memberships: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            role: true,
            businessId: true,
            business: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      loginRateLimiter.consume(rateLimitKey);
      throw new AppError("Invalid email or password", 401);
    }

    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("Your account has been suspended or deactivated", 403);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      loginRateLimiter.consume(rateLimitKey);
      throw new AppError("Invalid email or password", 401);
    }

    // Clear failed attempts counter upon successful authentication
    loginRateLimiter.reset(rateLimitKey);

    // Determine primary business and role
    let activeMembership = user.memberships[0];

    // For Super Admin: if no explicit membership exists, find or bind to first active business
    let activeBusinessForAdmin = null;
    if (user.globalRole === "SUPERADMIN") {
      if (!activeMembership) {
        activeBusinessForAdmin = await prisma.business.findFirst({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
        });

        if (activeBusinessForAdmin) {
          activeMembership = await prisma.membership.upsert({
            where: {
              businessId_userId: {
                businessId: activeBusinessForAdmin.id,
                userId: user.id,
              },
            },
            update: {
              role: "OWNER",
              status: "ACTIVE",
            },
            create: {
              businessId: activeBusinessForAdmin.id,
              userId: user.id,
              role: "OWNER",
              status: "ACTIVE",
            },
            include: {
              business: true,
            },
          });
        }
      }
    }

    const effectiveBusinessId = activeMembership?.businessId || activeBusinessForAdmin?.id;
    const effectiveRole = activeMembership?.role || (user.globalRole === "SUPERADMIN" ? "OWNER" : undefined);

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      businessId: effectiveBusinessId,
      role: effectiveRole,
    };

    await setSessionCookie(sessionPayload, rememberMe ?? true);

    // Available businesses
    let availableBusinesses = user.memberships.map((m) => ({
      id: m.business.id,
      name: m.business.name,
      role: m.role,
    }));

    if (user.globalRole === "SUPERADMIN") {
      const allActiveBusinesses = await prisma.business.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      availableBusinesses = allActiveBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        role: "OWNER" as const,
      }));
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        businessId: effectiveBusinessId,
        businessName: activeMembership?.business?.name || activeBusinessForAdmin?.name,
        role: effectiveRole,
        availableBusinesses,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
