import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { createPosSale, CreatePosSaleInput } from "@/lib/sales/pos-service";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "sales:view",
    });

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true, email: true } },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      totalCount,
      page,
      limit,
      sales: sales.map((s) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        createdAt: s.createdAt.toISOString(),
        customerName: s.customerName || "Walk-in Customer",
        cashier: s.cashier,
        subtotal: Number(s.subtotal),
        discountTotal: Number(s.discountTotal),
        taxTotal: Number(s.taxTotal),
        grandTotal: Number(s.grandTotal),
        status: s.status,
        itemCount: s.items.length,
        items: s.items.map((item) => ({
          id: item.id,
          name: item.productNameSnapshot,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        })),
        payments: s.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          method: p.paymentMethod,
          reference: p.reference,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId, role } = await requireTenant({
      requiredPermission: "sales:create",
    });

    const body = await request.json();
    const idempotencyHeader = request.headers.get("idempotency-key");
    const idempotencyKey = idempotencyHeader || body.idempotencyKey;

    const saleInput: CreatePosSaleInput = {
      businessId,
      cashierId: userId,
      role,
      items: body.items,
      discountTotal: body.discountTotal,
      taxTotal: body.taxTotal,
      customerName: body.customerName,
      payment: body.payment,
      idempotencyKey,
    };

    const receipt = await createPosSale(saleInput);

    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
