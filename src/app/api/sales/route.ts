import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { createPosSale, CreatePosSaleInput } from "@/lib/sales/pos-service";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

const posCheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(128),
        quantity: z
          .number()
          .finite()
          .positive()
          .refine(
            (quantity) => Math.abs(quantity * 100 - Math.round(quantity * 100)) < 0.000001,
            "Quantity can have at most two decimal places."
          ),
      })
    )
    .min(1)
    .max(100)
    .refine(
      (items) => new Set(items.map((item) => item.productId)).size === items.length,
      "Each product can only appear once in the checkout cart."
    ),
  discountTotal: z.number().finite().nonnegative().default(0),
  applyVat: z.boolean().default(false),
  customerName: z.string().trim().max(200).optional(),
  payment: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod),
    reference: z.string().max(200).optional().nullable().transform((value) => value ?? undefined),
    tendered: z.number().finite().nonnegative().optional(),
  }),
  managerApprovalToken: z.string().max(4096).optional(),
  idempotencyKey: z.string().min(16).max(128).optional(),
});

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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new AppError("Invalid checkout request body.", 400);
    }
    const parsed = posCheckoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || "Invalid checkout details.", 400);
    }
    const body = parsed.data;
    const idempotencyHeader = request.headers.get("idempotency-key");
    const idempotencyKey = idempotencyHeader || body.idempotencyKey;
    if (!idempotencyKey || (body.idempotencyKey && idempotencyHeader && body.idempotencyKey !== idempotencyHeader)) {
      throw new AppError("A matching checkout idempotency key is required.", 400);
    }

    let managerApprovalToken: string | undefined;
    if (body.discountTotal > 0 && !hasPermission(role, "sales:discount")) {
      if (typeof body.managerApprovalToken !== "string") {
        throw new AppError("A manager must approve this discount.", 403);
      }
      managerApprovalToken = body.managerApprovalToken;
    }

    const saleInput: CreatePosSaleInput = {
      businessId,
      cashierId: userId,
      role,
      items: body.items,
      discountTotal: body.discountTotal,
      applyVat: body.applyVat,
      customerName: body.customerName,
      payment: body.payment,
      idempotencyKey,
      managerApprovalToken,
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
