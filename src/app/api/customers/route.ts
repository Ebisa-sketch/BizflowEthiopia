import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireTenant({
      requiredPermission: "sales:create",
    });

    // Query recent distinct customers from sales
    const sales = await prisma.sale.findMany({
      where: {
        businessId,
        customerName: { not: null },
      },
      select: {
        customerName: true,
      },
      distinct: ["customerName"],
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const customers = sales
      .map((s) => s.customerName)
      .filter((name): name is string => Boolean(name && name.trim() && name !== "Walk-in Customer"));

    return NextResponse.json({
      success: true,
      customers: ["Walk-in Customer", ...customers],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
