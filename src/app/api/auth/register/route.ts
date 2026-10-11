import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { handleApiError, AppError } from "@/lib/errors";
import { validateEthiopianPhone } from "@/lib/auth/phone";

// In-memory rate limiting map: IP -> timestamp array
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REGISTRATIONS_PER_WINDOW = 6; // max 6 attempts per 15 mins

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REGISTRATIONS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter"),
  confirmPassword: z.string().optional(),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the Terms of Service and Privacy Policy to register"),
});

export async function POST(request: Request) {
  try {
    // Rate limit check
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many registration attempts from this IP address. Please wait a few minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Confirm password match check if supplied
    if (body.confirmPassword !== undefined && body.password !== body.confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid registration details" },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      name: providedName,
      email,
      password,
      phone,
      businessName: customBizName,
    } = parsed.data;

    // Construct and clean full name
    let fullName = "";
    if (firstName || lastName) {
      const cleanFirst = (firstName || "").replace(/[\x00-\x1F\x7F]/g, "").trim();
      const cleanLast = (lastName || "").replace(/[\x00-\x1F\x7F]/g, "").trim();

      if (cleanFirst.length < 2) {
        return NextResponse.json(
          { success: false, error: "First name must be at least 2 characters" },
          { status: 400 }
        );
      }
      fullName = cleanLast ? `${cleanFirst} ${cleanLast}` : cleanFirst;
    } else if (providedName) {
      fullName = providedName.replace(/[\x00-\x1F\x7F]/g, "").trim();
      if (fullName.length < 2) {
        return NextResponse.json(
          { success: false, error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "First name is required" },
        { status: 400 }
      );
    }

    // Phone validation (Ethiopian numbers)
    let normalizedPhone: string | null = null;
    if (phone && phone.trim()) {
      const phoneCheck = validateEthiopianPhone(phone);
      if (!phoneCheck.valid) {
        return NextResponse.json(
          { success: false, error: phoneCheck.error || "Invalid Ethiopian phone number" },
          { status: 400 }
        );
      }
      normalizedPhone = phoneCheck.normalized || phone.trim();
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new AppError("An account with this email address already exists. Please sign in instead.", 400);
    }

    const passwordHash = await hashPassword(password);

    // Initial business workspace name
    const storeName = customBizName?.trim() || `${fullName.split(" ")[0]}'s Store`;

    // Atomic transaction: Create User + Business Workspace + Membership(OWNER) + Initial Categories
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fullName,
          email: cleanEmail,
          passwordHash,
          globalRole: "USER",
          accountStatus: "ACTIVE",
        },
      });

      const business = await tx.business.create({
        data: {
          name: storeName,
          phone: normalizedPhone,
          currency: "ETB",
          status: "ACTIVE",
        },
      });

      const membership = await tx.membership.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      await tx.subscription.create({
        data: {
          businessId: business.id,
          plan: "STARTER",
          status: "TRIAL",
          billingPeriodStart: new Date(),
          billingPeriodEnd: trialEndDate,
          amount: 0.0,
        },
      });

      // Default category for retail store
      await tx.category.create({
        data: {
          businessId: business.id,
          name: "General Merchandise",
          description: "General retail goods",
        },
      });

      // Audit log entry recording registration and legal terms acceptance
      await tx.auditLog.create({
        data: {
          businessId: business.id,
          actorUserId: user.id,
          action: "ACCOUNT_REGISTERED",
          entityType: "User",
          entityId: user.id,
          metadata: {
            initialRole: "OWNER",
            businessName: storeName,
            termsVersion: "v1.0",
            termsAcceptedAt: new Date().toISOString(),
          },
        },
      });

      return { user, business, membership };
    });

    const sessionPayload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      businessId: result.business.id,
      role: result.membership.role,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        businessId: result.business.id,
        businessName: result.business.name,
        role: result.membership.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
