import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { roundMoney } from "@/lib/money";
import { MovementType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "inventory:view",
    });

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId")?.trim();
    const typeParam = searchParams.get("type")?.trim();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    if (productId && productId !== "ALL") {
      where.productId = productId;
    }
    if (typeParam && typeParam !== "ALL") {
      where.movementType = typeParam as MovementType;
    }

    const [movements, totalCount] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true, quantityOnHand: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      totalCount,
      page,
      limit,
      movements: movements.map((m) => ({
        id: m.id,
        date: m.createdAt.toISOString(),
        product: m.product.name,
        productId: m.productId,
        sku: m.product.sku || "N/A",
        currentStock: Number(m.product.quantityOnHand),
        type: m.movementType,
        quantity: Number(m.quantityChange),
        reason: m.reason || "",
        referenceType: m.referenceType || "",
        actor: m.user.name,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "inventory:adjust",
    });

    const body = await request.json();
    const { productId, movementType, quantity, reason, referenceType, referenceId } = body;

    if (!productId) {
      throw new AppError("Product selection is required.", 400);
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId },
    });

    if (!product) {
      throw new AppError("Product not found in current store catalog.", 404);
    }

    const validTypes: MovementType[] = ["RECEIPT", "ADJUSTMENT", "RETURN", "DAMAGE"];
    if (!validTypes.includes(movementType)) {
      throw new AppError(`Invalid movement type: '${movementType}'.`, 400);
    }

    const rawQty = Number(quantity);
    if (isNaN(rawQty) || rawQty === 0) {
      throw new AppError("Quantity change cannot be zero.", 400);
    }

    // Determine signed quantity change
    let quantityChange = rawQty;
    if (movementType === "RECEIPT" || movementType === "RETURN") {
      quantityChange = Math.abs(rawQty);
    } else if (movementType === "DAMAGE") {
      quantityChange = -Math.abs(rawQty);
    }
    // For ADJUSTMENT, quantityChange can be positive or negative based on input

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      throw new AppError("A descriptive reason or reference note is required for audit logs.", 400);
    }

    const currentQty = Number(product.quantityOnHand);
    const newQty = roundMoney(currentQty + quantityChange);

    if (newQty < 0) {
      throw new AppError(
        `Insufficient inventory. Current stock is ${currentQty}, deduction of ${Math.abs(
          quantityChange
        )} would result in negative stock.`,
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { quantityOnHand: newQty },
      });

      const movement = await tx.stockMovement.create({
        data: {
          businessId,
          productId,
          movementType,
          quantityChange,
          reason: reason.trim(),
          referenceType: referenceType || (movementType === "RECEIPT" ? "DELIVERY_PO" : "MANUAL_ADJUSTMENT"),
          referenceId: referenceId?.trim() || null,
          createdBy: userId,
        },
        include: {
          product: true,
          user: true,
        },
      });

      return { updatedProduct, movement };
    });

    return NextResponse.json(
      {
        success: true,
        updatedStock: Number(result.updatedProduct.quantityOnHand),
        movement: {
          id: result.movement.id,
          date: result.movement.createdAt.toISOString(),
          product: result.movement.product.name,
          productId: result.movement.productId,
          sku: result.movement.product.sku || "N/A",
          currentStock: Number(result.updatedProduct.quantityOnHand),
          type: result.movement.movementType,
          quantity: Number(result.movement.quantityChange),
          reason: result.movement.reason || "",
          actor: result.movement.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
