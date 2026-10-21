import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";

const switchSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = switchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { businessId } = parsed.data;

    // Check user role
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, globalRole: true, email: true, name: true },
    });

    if (user?.globalRole === "SUPERADMIN") {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business || business.status !== "ACTIVE") {
        throw new AppError("Target business not found or is suspended.", 404);
      }

      const adminMembership = await prisma.membership.upsert({
        where: {
          businessId_userId: {
            businessId: business.id,
            userId: user.id,
          },
        },
        update: {
          role: "OWNER",
          status: "ACTIVE",
        },
        create: {
          businessId: business.id,
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
        include: {
          business: true,
        },
      });

      await setSessionCookie({
        userId: user.id,
        email: user.email,
        name: user.name,
        businessId: business.id,
        role: "OWNER",
      });

      return NextResponse.json({
        success: true,
        activeBusiness: {
          id: adminMembership.business.id,
          name: adminMembership.business.name,
          role: adminMembership.role,
          currency: adminMembership.business.currency,
        },
      });
    }

    // Verify membership for regular staff
    const membership = await prisma.membership.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.userId,
        },
      },
      include: {
        business: true,
      },
    });

    if (!membership || membership.status !== "ACTIVE" || membership.business.status !== "ACTIVE") {
      throw new AppError("You do not have active access to this business.", 403);
    }

    // Update session cookie with new active business
    await setSessionCookie({
      userId: session.userId,
      email: session.email,
      name: session.name,
      businessId: membership.businessId,
      role: membership.role,
    });

    return NextResponse.json({
      success: true,
      activeBusiness: {
        id: membership.business.id,
        name: membership.business.name,
        role: membership.role,
        currency: membership.business.currency,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
