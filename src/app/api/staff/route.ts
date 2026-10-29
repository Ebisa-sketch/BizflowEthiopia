import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { hashPassword } from "@/lib/auth";
import { BusinessRole, MembershipStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { businessId, userId: currentUserId } = await requireTenant({
      requiredPermission: "staff:manage",
    });

    const memberships = await prisma.membership.findMany({
      where: {
        businessId,
        // Exclude the currently logged-in user so the owner never sees
        // their own record in the staff list they manage.
        userId: { not: currentUserId },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      staff: memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        status: m.status,
        joinedDate: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, role: currentRole, userId: currentUserId } = await requireTenant({
      requiredPermission: "staff:manage",
    });

    const body = await request.json();
    const { name, email, role, password } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Staff full name is required.", 400);
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new AppError("Valid staff email address is required.", 400);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const assignedRole = (role || "CASHIER").toUpperCase() as BusinessRole;

    const validRoles: BusinessRole[] = ["OWNER", "MANAGER", "CASHIER", "INVENTORY"];
    if (!validRoles.includes(assignedRole)) {
      throw new AppError(`Invalid business role: '${role}'.`, 400);
    }

    // Only OWNER can assign OWNER role
    if (assignedRole === "OWNER" && currentRole !== "OWNER") {
      throw new AppError("Only existing store owners can invite new co-owners.", 403);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (user) {
      // Check if already a member of this business
      const existingMembership = await prisma.membership.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: user.id,
          },
        },
      });

      if (existingMembership) {
        throw new AppError(`User ${trimmedEmail} is already a staff member in your store.`, 409);
      }
    } else {
      // Create new user account with default or specified password
      const initialPassword = password?.trim() || "BizFlow@2026";
      const hashedPassword = await hashPassword(initialPassword);

      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: trimmedEmail,
          passwordHash: hashedPassword,
        },
      });
    }

    // Create business membership
    const membership = await prisma.membership.create({
      data: {
        businessId,
        userId: user.id,
        role: assignedRole,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        member: {
          id: membership.id,
          userId: membership.userId,
          name: membership.user.name,
          email: membership.user.email,
          role: membership.role,
          status: membership.status,
          joinedDate: membership.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
