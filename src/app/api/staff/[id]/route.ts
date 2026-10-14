import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { BusinessRole, MembershipStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, role: currentRole, userId: currentUserId } = await requireTenant({
      requiredPermission: "staff:manage",
    });
    const { id } = await params;

    const membership = await prisma.membership.findFirst({
      where: { id, businessId },
      include: { user: true },
    });

    if (!membership) {
      throw new AppError("Staff membership not found.", 404);
    }

    const body = await request.json();
    const { role, status } = body;

    const updateData: any = {};

    if (role !== undefined) {
      const validRoles: BusinessRole[] = ["OWNER", "MANAGER", "CASHIER", "INVENTORY"];
      if (!validRoles.includes(role)) {
        throw new AppError(`Invalid role: '${role}'.`, 400);
      }
      if (role === "OWNER" && currentRole !== "OWNER") {
        throw new AppError("Only existing store owners can promote staff to owner.", 403);
      }

      // If downgrading an OWNER, check that there is at least one other active OWNER
      if (membership.role === "OWNER" && role !== "OWNER") {
        const ownerCount = await prisma.membership.count({
          where: { businessId, role: "OWNER", status: "ACTIVE" },
        });
        if (ownerCount <= 1) {
          throw new AppError("Cannot change role. The store must retain at least one active owner.", 400);
        }
      }
      updateData.role = role as BusinessRole;
    }

    if (status !== undefined) {
      const validStatuses: MembershipStatus[] = ["ACTIVE", "INVITED", "SUSPENDED"];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status: '${status}'.`, 400);
      }

      // If suspending an OWNER, check remaining active owners
      if (membership.role === "OWNER" && status === "SUSPENDED") {
        const ownerCount = await prisma.membership.count({
          where: { businessId, role: "OWNER", status: "ACTIVE" },
        });
        if (ownerCount <= 1) {
          throw new AppError("Cannot suspend the only active store owner.", 400);
        }
      }
      updateData.status = status as MembershipStatus;
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });

    return NextResponse.json({
      success: true,
      member: {
        id: updated.id,
        userId: updated.userId,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
        status: updated.status,
        joinedDate: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId, userId: currentUserId } = await requireTenant({
      requiredPermission: "staff:manage",
    });
    const { id } = await params;

    const membership = await prisma.membership.findFirst({
      where: { id, businessId },
    });

    if (!membership) {
      throw new AppError("Staff membership not found.", 404);
    }

    if (membership.userId === currentUserId) {
      throw new AppError("You cannot remove your own account from the store staff list.", 400);
    }

    if (membership.role === "OWNER") {
      const ownerCount = await prisma.membership.count({
        where: { businessId, role: "OWNER", status: "ACTIVE" },
      });
      if (ownerCount <= 1) {
        throw new AppError("Cannot remove the only active store owner.", 400);
      }
    }

    await prisma.membership.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member removed from business.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
