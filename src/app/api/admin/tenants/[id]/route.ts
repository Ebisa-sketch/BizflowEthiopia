import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AppError, handleApiError } from "@/lib/errors";
import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true, accountStatus: true, globalRole: true },
            },
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            products: true,
            sales: true,
            expenses: true,
          },
        },
      },
    });

    if (!business) {
      throw new AppError("Business tenant not found.", 404);
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: business.id,
        name: business.name,
        contactEmail: business.contactEmail,
        phone: business.phone,
        address: business.address,
        currency: business.currency,
        taxNumber: business.taxNumber,
        status: business.status,
        createdAt: business.createdAt.toISOString(),
        members: business.memberships.map((m) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          user: m.user,
        })),
        subscriptions: business.subscriptions.map((s) => ({
          id: s.id,
          plan: s.plan,
          status: s.status,
          amount: Number(s.amount),
          billingPeriodStart: s.billingPeriodStart.toISOString(),
          billingPeriodEnd: s.billingPeriodEnd.toISOString(),
        })),
        metrics: {
          productsCount: business._count.products,
          salesCount: business._count.sales,
          expensesCount: business._count.expenses,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!business) {
      throw new AppError("Business tenant not found.", 404);
    }

    const body = await request.json();
    const { action } = body;

    // Action 1: Toggle or set status (ACTIVE vs SUSPENDED)
    if (action === "UPDATE_STATUS") {
      const { status } = body;
      const validStatuses = ["ACTIVE", "SUSPENDED", "INACTIVE"];
      if (!validStatuses.includes(status)) {
        throw new AppError("Invalid status. Allowed: ACTIVE, SUSPENDED, INACTIVE", 400);
      }

      const updated = await prisma.business.update({
        where: { id },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        message: `Business '${updated.name}' is now ${status}.`,
        tenant: { id: updated.id, status: updated.status },
      });
    }

    // Action 2: Update business info (name, email, phone, address, taxNumber, currency)
    if (action === "UPDATE_DETAILS") {
      const { name, contactEmail, phone, address, taxNumber, currency } = body;
      if (name && !name.trim()) {
        throw new AppError("Business name cannot be empty.", 400);
      }

      const updated = await prisma.business.update({
        where: { id },
        data: {
          name: name ? name.trim() : undefined,
          contactEmail: contactEmail !== undefined ? contactEmail?.trim() || null : undefined,
          phone: phone !== undefined ? phone?.trim() || null : undefined,
          address: address !== undefined ? address?.trim() || null : undefined,
          taxNumber: taxNumber !== undefined ? taxNumber?.trim() || null : undefined,
          currency: currency ? currency.trim().toUpperCase() : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Business details updated for '${updated.name}'.`,
        tenant: updated,
      });
    }

    // Action 3: Subscription & Licensing override (extend days, change plan, change status)
    if (action === "UPDATE_SUBSCRIPTION") {
      const { plan, status, extendDays, customEndDate } = body;

      const validPlans: SubscriptionTier[] = ["STARTER", "BUSINESS", "PRO"];
      const validSubStatuses: SubscriptionStatus[] = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"];

      if (plan && !validPlans.includes(plan)) {
        throw new AppError("Invalid plan tier.", 400);
      }
      if (status && !validSubStatuses.includes(status)) {
        throw new AppError("Invalid subscription status.", 400);
      }

      let endDate: Date;
      if (customEndDate) {
        endDate = new Date(customEndDate);
      } else {
        const baseDate = business.subscriptions[0]
          ? new Date(Math.max(Date.now(), business.subscriptions[0].billingPeriodEnd.getTime()))
          : new Date();
        endDate = new Date(baseDate);
        if (extendDays) {
          endDate.setDate(endDate.getDate() + Number(extendDays));
        } else {
          endDate.setDate(endDate.getDate() + 30);
        }
      }

      const latestSub = business.subscriptions[0];
      let sub;

      if (latestSub) {
        sub = await prisma.subscription.update({
          where: { id: latestSub.id },
          data: {
            plan: plan || latestSub.plan,
            status: status || latestSub.status,
            billingPeriodEnd: endDate,
          },
        });
      } else {
        sub = await prisma.subscription.create({
          data: {
            businessId: business.id,
            plan: plan || "STARTER",
            status: status || "ACTIVE",
            billingPeriodStart: new Date(),
            billingPeriodEnd: endDate,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Subscription for '${business.name}' updated to ${sub.plan} (${sub.status}) until ${endDate.toLocaleDateString()}.`,
        subscription: {
          plan: sub.plan,
          status: sub.status,
          billingPeriodEnd: sub.billingPeriodEnd.toISOString(),
        },
      });
    }

    throw new AppError(`Unknown action: '${action}'. Expected UPDATE_STATUS, UPDATE_DETAILS, or UPDATE_SUBSCRIPTION.`, 400);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!business) {
      throw new AppError("Business tenant not found.", 404);
    }

    await prisma.business.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Business tenant '${business.name}' and all associated records deleted permanently.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
