import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { roundMoney } from "@/lib/money";
import { ProductStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:view",
    });
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, businessId },
      include: { category: true },
    });

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        barcode: product.barcode || "",
        description: product.description || "",
        category: product.category?.name || "General",
        categoryId: product.categoryId,
        price: Number(product.sellingPrice),
        cost: Number(product.costPrice),
        stock: Number(product.quantityOnHand),
        reorderLevel: Number(product.reorderLevel),
        status: product.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:manage",
    });
    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      throw new AppError("Product not found.", 404);
    }

    const body = await request.json();
    const { name, sku, barcode, categoryId, sellingPrice, costPrice, reorderLevel, status, description } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError("Product name cannot be empty.", 400);
      }
      updateData.name = name.trim();
    }

    if (sku !== undefined) {
      const trimmedSku = sku?.trim() || null;
      if (trimmedSku && trimmedSku !== existing.sku) {
        const skuConflict = await prisma.product.findUnique({
          where: {
            businessId_sku: {
              businessId,
              sku: trimmedSku,
            },
          },
        });
        if (skuConflict && skuConflict.id !== id) {
          throw new AppError(`A product with SKU '${trimmedSku}' already exists.`, 409);
        }
      }
      updateData.sku = trimmedSku;
    }

    if (barcode !== undefined) {
      updateData.barcode = barcode?.trim() || null;
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId || null;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (sellingPrice !== undefined) {
      const p = roundMoney(Number(sellingPrice));
      if (p < 0) throw new AppError("Selling price must be non-negative.", 400);
      updateData.sellingPrice = p;
    }

    if (costPrice !== undefined) {
      const c = roundMoney(Number(costPrice));
      if (c < 0) throw new AppError("Cost price must be non-negative.", 400);
      updateData.costPrice = c;
    }

    if (reorderLevel !== undefined) {
      const r = roundMoney(Number(reorderLevel));
      if (r < 0) throw new AppError("Reorder level must be non-negative.", 400);
      updateData.reorderLevel = r;
    }

    if (status !== undefined) {
      if (status !== "ACTIVE" && status !== "ARCHIVED") {
        throw new AppError("Invalid status. Must be ACTIVE or ARCHIVED.", 400);
      }
      updateData.status = status as ProductStatus;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: updated.id,
        name: updated.name,
        sku: updated.sku || "",
        barcode: updated.barcode || "",
        category: updated.category?.name || "General",
        categoryId: updated.categoryId,
        price: Number(updated.sellingPrice),
        cost: Number(updated.costPrice),
        stock: Number(updated.quantityOnHand),
        reorderLevel: Number(updated.reorderLevel),
        status: updated.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:manage",
    });
    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      throw new AppError("Product not found.", 404);
    }

    // Check if product is referenced in sales
    const saleItemCount = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (saleItemCount > 0) {
      // Archive instead of hard delete to preserve sales transaction history integrity
      await prisma.product.update({
        where: { id },
        data: { status: ProductStatus.ARCHIVED },
      });
      return NextResponse.json({
        success: true,
        message: "Product is referenced in past sales invoices; safely archived instead of deleted.",
        archived: true,
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product permanently removed.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
