import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AppError, handleApiError } from "@/lib/errors";

const PAGE_SIZE = 25;
const BUSINESS_STATUSES = ["ACTIVE", "SUSPENDED", "INACTIVE"] as const;

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const requestedStatus = searchParams.get("status")?.toUpperCase() || "ALL";
    const pageValue = Number(searchParams.get("page") || "1");
    const requestedPage = Number.isSafeInteger(pageValue) ? Math.max(1, pageValue) : 1;

    if (
      requestedStatus !== "ALL" &&
      !BUSINESS_STATUSES.includes(requestedStatus as (typeof BUSINESS_STATUSES)[number])
    ) {
      throw new AppError("Invalid business status filter.", 400);
    }

    const where = {
      ...(requestedStatus === "ALL" ? {} : { status: requestedStatus }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { contactEmail: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [totalCount, activeCount, suspendedCount, businessCount] = await Promise.all([
      prisma.business.count({ where }),
      prisma.business.count({ where: { status: "ACTIVE" } }),
      prisma.business.count({ where: { status: "SUSPENDED" } }),
      prisma.business.count(),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);
    const businesses = await prisma.business.findMany({
      where,
      select: {
        id: true,
        name: true,
        contactEmail: true,
        currency: true,
        status: true,
        createdAt: true,
        _count: { select: { memberships: true } },
        subscriptions: {
          select: {
            plan: true,
            status: true,
            billingPeriodEnd: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return NextResponse.json({
      success: true,
      tenants: businesses.map((business) => ({
        id: business.id,
        name: business.name,
        contactEmail: business.contactEmail,
        currency: business.currency,
        status: business.status,
        createdAt: business.createdAt.toISOString(),
        memberCount: business._count.memberships,
        subscription: business.subscriptions[0]
          ? {
              plan: business.subscriptions[0].plan,
              status: business.subscriptions[0].status,
              billingPeriodEnd: business.subscriptions[0].billingPeriodEnd.toISOString(),
            }
          : null,
      })),
      summary: {
        total: businessCount,
        active: activeCount,
        suspended: suspendedCount,
      },
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const {
      name,
      contactEmail,
      phone,
      address,
      currency = "ETB",
      taxNumber,
      ownerName,
      ownerEmail,
      ownerPassword,
      plan = "STARTER",
      trialDays = 30,
    } = body;

    const trimmedName = name?.trim();
    const trimmedOwnerName = ownerName?.trim();
    const trimmedOwnerEmail = ownerEmail?.trim()?.toLowerCase();

    if (!trimmedName) {
      throw new AppError("Business name is required.", 400);
    }
    if (!trimmedOwnerName) {
      throw new AppError("Owner name is required.", 400);
    }
    if (!trimmedOwnerEmail || !trimmedOwnerEmail.includes("@")) {
      throw new AppError("Valid owner email address is required.", 400);
    }
    if (!ownerPassword || ownerPassword.length < 6) {
      throw new AppError("Owner password must be at least 6 characters.", 400);
    }

    const validPlans = ["STARTER", "BUSINESS", "PRO"] as const;
    const selectedPlan = validPlans.includes(plan) ? plan : "STARTER";

    const { hashPassword } = await import("@/lib/auth");
    const passwordHash = await hashPassword(ownerPassword);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or retrieve owner user
      let user = await tx.user.findUnique({
        where: { email: trimmedOwnerEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: trimmedOwnerName,
            email: trimmedOwnerEmail,
            passwordHash,
            globalRole: "USER",
            accountStatus: "ACTIVE",
          },
        });
      }

      // 2. Create the business tenant
      const business = await tx.business.create({
        data: {
          name: trimmedName,
          contactEmail: contactEmail?.trim() || trimmedOwnerEmail,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          currency: currency?.trim()?.toUpperCase() || "ETB",
          taxNumber: taxNumber?.trim() || null,
          status: "ACTIVE",
        },
      });

      // 3. Create owner membership
      await tx.membership.create({
        data: {
          businessId: business.id,
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      // 4. Create default general category
      await tx.category.create({
        data: {
          businessId: business.id,
          name: "General",
          description: "Default product category",
        },
      });

      // 5. Create initial subscription
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + Number(trialDays || 30));

      await tx.subscription.create({
        data: {
          businessId: business.id,
          plan: selectedPlan,
          status: "TRIAL",
          billingPeriodStart: new Date(),
          billingPeriodEnd: periodEnd,
        },
      });

      return { business, user };
    });

    return NextResponse.json({
      success: true,
      message: `Business tenant '${result.business.name}' created successfully with owner ${result.user.email}.`,
      tenant: {
        id: result.business.id,
        name: result.business.name,
        contactEmail: result.business.contactEmail,
        status: result.business.status,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
