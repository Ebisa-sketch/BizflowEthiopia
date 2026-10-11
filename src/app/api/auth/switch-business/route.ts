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

    // Verify membership
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
