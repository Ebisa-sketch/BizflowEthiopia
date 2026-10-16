import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
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

    const activeMembership = user.memberships.find(
      (m) => m.businessId === session.businessId
    ) || user.memberships[0];

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: activeMembership?.businessId,
        businessName: activeMembership?.business?.name,
        currency: activeMembership?.business?.currency || "ETB",
        role: activeMembership?.role,
        availableBusinesses: user.memberships.map((m) => ({
          id: m.business.id,
          name: m.business.name,
          role: m.role,
        })),
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
