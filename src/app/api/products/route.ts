import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";
import { roundMoney } from "@/lib/money";
import { ProductStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:view",
    });

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("category")?.trim() || "";
    const statusParam = searchParams.get("status")?.toUpperCase() || "ACTIVE";

    const where: any = {
      businessId,
      status: statusParam === "ALL" ? undefined : (statusParam as ProductStatus),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { businessId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      categories,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "",
        barcode: p.barcode || "",
        description: p.description || "",
        category: p.category?.name || "General",
        categoryId: p.categoryId,
        price: Number(p.sellingPrice),
        cost: Number(p.costPrice),
        stock: Number(p.quantityOnHand),
        reorderLevel: Number(p.reorderLevel),
        status: p.status,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = await requireTenant({
      requiredPermission: "products:manage",
    });

    const body = await request.json();
    const { name, sku, barcode, categoryId, categoryName, sellingPrice, costPrice, quantityOnHand, reorderLevel } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Product name is required.", 400);
    }

    const price = roundMoney(Number(sellingPrice ?? 0));
    const cost = roundMoney(Number(costPrice ?? 0));
    const initialStock = roundMoney(Number(quantityOnHand ?? 0));
    const minStock = roundMoney(Number(reorderLevel ?? 5));

    if (price < 0 || cost < 0 || initialStock < 0) {
      throw new AppError("Prices and inventory must be non-negative values.", 400);
    }

    let finalCategoryId = categoryId || null;
    if (!finalCategoryId && categoryName && typeof categoryName === "string" && categoryName.trim()) {
      const trimmedCatName = categoryName.trim();
      const existingCat = await prisma.category.findFirst({
        where: { businessId, name: { equals: trimmedCatName, mode: "insensitive" } },
      });
      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const createdCat = await prisma.category.create({
          data: { businessId, name: trimmedCatName },
        });
        finalCategoryId = createdCat.id;
      }
    }

    // Verify SKU uniqueness within business
    if (sku && typeof sku === "string" && sku.trim()) {
      const existingSku = await prisma.product.findUnique({
        where: {
          businessId_sku: {
            businessId,
            sku: sku.trim(),
          },
        },
      });

      if (existingSku) {
        throw new AppError(`A product with SKU '${sku}' already exists in your store.`, 409);
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          businessId,
          name: name.trim(),
          sku: sku?.trim() || null,
          barcode: barcode?.trim() || null,
          categoryId: finalCategoryId,
          sellingPrice: price,
          costPrice: cost,
          quantityOnHand: initialStock,
          reorderLevel: minStock,
        },
        include: {
          category: true,
        },
      });

      // Record initial inventory receipt if stock > 0
      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            businessId,
            productId: created.id,
            movementType: "RECEIPT",
            quantityChange: initialStock,
            reason: "Initial Product Intake",
            referenceType: "INTAKE",
            referenceId: created.id,
            createdBy: userId,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          category: product.category?.name || "General",
          price: Number(product.sellingPrice),
          cost: Number(product.costPrice),
          stock: Number(product.quantityOnHand),
          reorderLevel: Number(product.reorderLevel),
          status: product.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
