import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:view",
    });

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";

    const where: any = { businessId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        products: {
          select: {
            id: true,
            status: true,
            quantityOnHand: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = categories.map((c) => {
      const activeProducts = c.products.filter((p) => p.status === "ACTIVE");
      const totalStock = activeProducts.reduce(
        (sum, p) => sum + Number(p.quantityOnHand || 0),
        0
      );
      const totalValue = activeProducts.reduce(
        (sum, p) =>
          sum + Number(p.quantityOnHand || 0) * Number(p.sellingPrice || 0),
        0
      );

      return {
        id: c.id,
        name: c.name,
        description: c.description || "",
        productCount: activeProducts.length,
        totalProducts: c.products.length,
        totalStock: Math.round(totalStock * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      categories: formatted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:manage",
    });

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Category name is required.", 400);
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 80) {
      throw new AppError("Category name must not exceed 80 characters.", 400);
    }

    // Check for duplicate category name within this business
    const existing = await prisma.category.findFirst({
      where: {
        businessId,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new AppError(
        `Category "${trimmedName}" already exists in your store.`,
        409
      );
    }

    const category = await prisma.category.create({
      data: {
        businessId,
        name: trimmedName,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        category: {
          id: category.id,
          name: category.name,
          description: category.description || "",
          productCount: 0,
          totalProducts: 0,
          totalStock: 0,
          totalValue: 0,
          createdAt: category.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:manage",
    });

    const body = await request.json();
    const { id, name, description } = body;

    if (!id || typeof id !== "string") {
      throw new AppError("Category ID is required.", 400);
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Category name is required.", 400);
    }

    const trimmedName = name.trim();

    // Verify existing belongs to this business
    const category = await prisma.category.findFirst({
      where: { id, businessId },
    });

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    // Duplicate check for other category
    const duplicate = await prisma.category.findFirst({
      where: {
        businessId,
        id: { not: id },
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (duplicate) {
      throw new AppError(
        `Another category named "${trimmedName}" already exists.`,
        409
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      category: {
        id: updated.id,
        name: updated.name,
        description: updated.description || "",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:manage",
    });

    const searchParams = request.nextUrl.searchParams;
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // No body
      }
    }

    if (!id || typeof id !== "string") {
      throw new AppError("Category ID is required.", 400);
    }

    const category = await prisma.category.findFirst({
      where: { id, businessId },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    // Detach category from products before deletion (safety)
    await prisma.product.updateMany({
      where: { categoryId: id, businessId },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" removed successfully. Associated products have been unassigned.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

