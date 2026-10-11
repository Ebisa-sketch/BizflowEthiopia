import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { handleApiError, AppError } from "@/lib/errors";

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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            business: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("Your account has been suspended or deactivated", 403);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    // Determine primary business and role
    const activeMembership = user.memberships[0];

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      businessId: activeMembership?.businessId,
      role: activeMembership?.role,
    };

    await setSessionCookie(sessionPayload, rememberMe ?? true);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: activeMembership?.businessId,
        businessName: activeMembership?.business?.name,
        role: activeMembership?.role,
        availableBusinesses: user.memberships.map((m) => ({
          id: m.business.id,
          name: m.business.name,
          role: m.role,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
