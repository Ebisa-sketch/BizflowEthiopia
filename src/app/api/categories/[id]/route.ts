import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError, AppError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:manage",
    });

    const { id } = await params;
    if (!id) {
      throw new AppError("Category ID is required.", 400);
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError("Category name is required.", 400);
    }

    const trimmedName = name.trim();

    const category = await prisma.category.findFirst({
      where: { id, businessId },
    });

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "products:manage",
    });

    const { id } = await params;
    if (!id) {
      throw new AppError("Category ID is required.", 400);
    }

    const category = await prisma.category.findFirst({
      where: { id, businessId },
    });

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    await prisma.product.updateMany({
      where: { categoryId: id, businessId },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" removed successfully.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

