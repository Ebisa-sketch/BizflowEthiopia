import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "sales:view",
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.toUpperCase();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const shifts = await prisma.tillShift.findMany({
      where: {
        businessId,
        ...(status === "OPEN" || status === "CLOSED" ? { status } : {}),
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
      },
      orderBy: { openedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.tillShift.count({
      where: {
        businessId,
        ...(status === "OPEN" || status === "CLOSED" ? { status } : {}),
      },
    });

    const formatted = shifts.map((s) => ({
      id: s.id,
      status: s.status,
      openingFloat: Number(s.openingFloat),
      cashSales: Number(s.cashSales),
      digitalSales: Number(s.digitalSales),
      expensesPaid: Number(s.expensesPaid),
      expectedCash: Number(s.expectedCash),
      actualCash: s.actualCash !== null ? Number(s.actualCash) : null,
      variance: s.variance !== null ? Number(s.variance) : null,
      denominationCounts: s.denominationCounts,
      notes: s.notes,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      cashier: s.cashier,
    }));

    return NextResponse.json({
      success: true,
      shifts: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    const body = await request.json().catch(() => ({}));
    const openingFloat = Math.max(0, Number(body.openingFloat) || 0);
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;

    // Check if cashier already has an active open shift
    const existingOpenShift = await prisma.tillShift.findFirst({
      where: {
        businessId,
        cashierId: userId,
        status: "OPEN",
      },
      include: {
        cashier: { select: { id: true, name: true } },
      },
    });

    if (existingOpenShift) {
      return NextResponse.json({
        success: true,
        message: "An active shift is already open for this cashier.",
        shift: {
          id: existingOpenShift.id,
          status: existingOpenShift.status,
          openingFloat: Number(existingOpenShift.openingFloat),
          openedAt: existingOpenShift.openedAt.toISOString(),
          cashier: existingOpenShift.cashier,
        },
      });
    }

    // Open new shift
    const newShift = await prisma.tillShift.create({
      data: {
        businessId,
        cashierId: userId,
        status: "OPEN",
        openingFloat,
        notes,
      },
      include: {
        cashier: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        businessId,
        actorUserId: userId,
        action: "TILL_SHIFT_OPENED",
        entityType: "TillShift",
        entityId: newShift.id,
        metadata: {
          openingFloat,
          openedAt: newShift.openedAt.toISOString(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Till shift opened with starting float of ETB ${openingFloat.toFixed(2)}.`,
        shift: {
          id: newShift.id,
          status: newShift.status,
          openingFloat: Number(newShift.openingFloat),
          openedAt: newShift.openedAt.toISOString(),
          cashier: newShift.cashier,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
