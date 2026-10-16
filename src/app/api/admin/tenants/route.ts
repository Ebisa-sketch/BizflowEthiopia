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
