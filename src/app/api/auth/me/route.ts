import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
      });
    }

    // Verify user and active business in database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            business: true,
          },
        },
      },
    });

    if (!user || user.accountStatus !== "ACTIVE") {
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
      });
    }

    let activeMembership = user.memberships.find(
      (m) => m.businessId === session.businessId
    ) || user.memberships[0];

    // For Super Admin: if activeMembership is not found or not currently active, resolve first active business
    let activeBusinessForAdmin = null;
    if (user.globalRole === "SUPERADMIN") {
      if (session.businessId) {
        activeBusinessForAdmin = await prisma.business.findUnique({
          where: { id: session.businessId },
        });
      }
      if (!activeBusinessForAdmin || activeBusinessForAdmin.status !== "ACTIVE") {
        activeBusinessForAdmin = await prisma.business.findFirst({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
        });
      }
    }

    const effectiveBusinessId = activeMembership?.businessId || activeBusinessForAdmin?.id;
    const effectiveBusinessName = activeMembership?.business?.name || activeBusinessForAdmin?.name;
    const effectiveCurrency = activeMembership?.business?.currency || activeBusinessForAdmin?.currency || "ETB";
    const effectiveRole = activeMembership?.role || (user.globalRole === "SUPERADMIN" ? "OWNER" : undefined);

    // If session.businessId was missing or outdated, synchronize session cookie
    if (effectiveBusinessId && session.businessId !== effectiveBusinessId) {
      try {
        await setSessionCookie({
          userId: user.id,
          email: user.email,
          name: user.name,
          businessId: effectiveBusinessId,
          role: effectiveRole as any,
        });
      } catch {
        // Continue even if setting cookie cannot be performed
      }
    }

    // Available businesses: Super Admin sees all active stores in the platform
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
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: effectiveBusinessId,
        businessName: effectiveBusinessName,
        currency: effectiveCurrency,
        role: effectiveRole,
        globalRole: user.globalRole,
        availableBusinesses,
      },
    });
  } catch (error) {
    console.error("[auth/me] Session resolution error:", error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: "Failed to resolve session",
    }, { status: 500 });
  }
}
