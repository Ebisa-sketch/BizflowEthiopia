import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AppError, handleApiError } from "@/lib/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireSuperAdmin();
    const { id: businessId } = await params;

    const [superAdminUser, business] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, status: true },
      }),
    ]);

    if (!superAdminUser) {
      throw new AppError("Administrator user record not found.", 404);
    }
    if (!business) {
      throw new AppError("Business tenant not found.", 404);
    }

    // Ensure super admin has an active OWNER membership in this business
    await prisma.membership.upsert({
      where: {
        businessId_userId: {
          businessId: business.id,
          userId: superAdminUser.id,
        },
      },
      update: {
        role: "OWNER",
        status: "ACTIVE",
      },
      create: {
        businessId: business.id,
        userId: superAdminUser.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // Set the session cookie with this business as active workspace
    await setSessionCookie({
      userId: superAdminUser.id,
      email: superAdminUser.email,
      name: superAdminUser.name,
      businessId: business.id,
      role: "OWNER",
    });

    return NextResponse.json({
      success: true,
      message: `Switched active workspace to '${business.name}'.`,
      redirectUrl: "/dashboard",
      businessName: business.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
