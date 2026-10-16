import { createHash } from "node:crypto";
import { prisma } from "../db/prisma";
import { AppError } from "../errors";
import { roundMoney } from "../money";
import { BusinessRole, hasPermission } from "../permissions";
import { MovementType, PaymentMethod, SaleStatus } from "@prisma/client";
import { calculatePosTotals } from "./pos-pricing";
import { verifyManagerDiscountGrant } from "./manager-authorization";

export interface PosCartItemInput {
  productId: string;
  quantity: number;
}

export interface PosPaymentInput {
  paymentMethod: PaymentMethod;
  amount?: number;
  reference?: string;
  tendered?: number;
}

export interface CreatePosSaleInput {
  businessId: string;
  cashierId: string;
  role: BusinessRole;
  items: PosCartItemInput[];
  discountTotal?: number;
  applyVat?: boolean;
  customerName?: string;
  payment: PosPaymentInput;
  idempotencyKey?: string;
  managerApprovalUserId?: string;
  managerApprovalToken?: string;
}

export interface PosReceiptItem {
  productId: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PosReceiptResult {
  saleId: string;
  saleNumber: string;
  createdAt: string;
  business: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    taxNumber: string | null;
    currency: string;
  };
  cashier: {
    id: string;
    name: string;
    email: string;
  };
  customerName: string;
  items: PosReceiptItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  payment: {
    method: PaymentMethod;
    amount: number;
    reference: string | null;
    tendered: number;
    change: number;
  };
}

/**
 * Validates and executes a POS Checkout transaction with ACID guarantees.
 * Recalculates all pricing and stock rules on the server.
 */
export async function createPosSale(
  input: CreatePosSaleInput
): Promise<PosReceiptResult> {
  const {
    businessId,
    cashierId,
    role,
    items,
    discountTotal = 0,
    applyVat = false,
    customerName = "Walk-in Customer",
    payment,
    idempotencyKey,
    managerApprovalUserId,
    managerApprovalToken,
  } = input;

  if (
    idempotencyKey !== undefined &&
    (idempotencyKey.length < 16 || idempotencyKey.length > 128)
  ) {
    throw new AppError("Invalid checkout idempotency key.", 400);
  }

  // Validate cart items presence
  if (!items || items.length === 0) {
    throw new AppError("Cart is empty. Please add at least one product.", 400);
  }

  // Validate positive quantities and reject duplicate product lines.
  const uniqueProductIds = new Set<string>();
  for (const item of items) {
    if (!item.productId || typeof item.productId !== "string") {
      throw new AppError("Invalid product identifier in cart.", 400);
    }
    if (
      !item.quantity ||
      item.quantity <= 0 ||
      !Number.isFinite(item.quantity) ||
      Math.abs(item.quantity * 100 - Math.round(item.quantity * 100)) >= 0.000001
    ) {
      throw new AppError(
        `Quantity must be a positive number with at most two decimal places for product ${item.productId}.`,
        400
      );
    }
    if (uniqueProductIds.has(item.productId)) {
      throw new AppError("Each product can only appear once in the checkout cart.", 400);
    }
    uniqueProductIds.add(item.productId);
  }

  if (!Number.isFinite(discountTotal) || discountTotal < 0) {
    throw new AppError("Discount must be a valid non-negative amount.", 400);
  }

  const safeDiscount = roundMoney(discountTotal);

  // Fetch products & active business
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      taxNumber: true,
      currency: true,
      status: true,
    },
  });

  if (!business || business.status !== "ACTIVE") {
    throw new AppError("Business tenant is not active or could not be found.", 404);
  }

  const cashier = await prisma.user.findUnique({
    where: { id: cashierId },
    select: { id: true, name: true, email: true },
  });

  if (!cashier) {
    throw new AppError("Cashier record not found.", 404);
  }

  const normalizedCustomerName = customerName.trim() || "Walk-in Customer";
  const payloadHash = idempotencyKey
    ? createHash("sha256")
        .update(
          JSON.stringify({
            cashierId,
            items: [...items].sort((a, b) => a.productId.localeCompare(b.productId)),
            discountTotal: safeDiscount,
            applyVat,
            customerName: normalizedCustomerName,
            payment: {
              paymentMethod: payment.paymentMethod,
              reference: payment.reference?.trim() || null,
              tendered: payment.tendered ?? null,
            },
          })
        )
        .digest("hex")
    : null;

  if (idempotencyKey) {
    const existing = await findExistingIdempotentSale(businessId, idempotencyKey);
    if (existing) {
      if (existing.idempotencyHash !== payloadHash) {
        throw new AppError(
          "This checkout key was already used for a different sale. Start a new checkout.",
          409
        );
      }
      return buildReceiptFromExistingSale(existing);
    }
  }

  let approvingManagerId = managerApprovalUserId;
  if (managerApprovalToken) {
    if (approvingManagerId) {
      throw new AppError("Provide only one manager approval credential.", 400);
    }
    approvingManagerId = verifyManagerDiscountGrant(managerApprovalToken, {
      businessId,
      cashierId,
    });
  }

  // Authorization is checked after a matching idempotent sale is returned so
  // a lost-response retry remains safe even if its short-lived grant expires.
  if (safeDiscount > 0) {
    if (hasPermission(role, "sales:discount")) {
      if (approvingManagerId) {
        throw new AppError("Manager approval cannot be used by a user with discount permission.", 400);
      }
    } else if (!approvingManagerId) {
      throw new AppError("Discounts require Manager or Owner role authorization.", 403);
    } else {
      const managerMembership = await prisma.membership.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: approvingManagerId,
          },
        },
        select: {
          role: true,
          status: true,
          user: { select: { accountStatus: true } },
        },
      });
      if (
        !managerMembership ||
        managerMembership.status !== "ACTIVE" ||
        managerMembership.user.accountStatus !== "ACTIVE" ||
        (managerMembership.role !== "OWNER" && managerMembership.role !== "MANAGER")
      ) {
        throw new AppError("The approving manager no longer has permission to authorize discounts.", 403);
      }
    }
  } else if (approvingManagerId || managerApprovalToken) {
    throw new AppError("Manager approval is only valid when a discount is applied.", 400);
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      businessId,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError("One or more items do not exist in your store inventory.", 404);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Recalculate totals and check inventory
  const preparedItems: {
    product: (typeof products)[0];
    quantity: number;
    unitPrice: number;
    unitCost: number;
    lineTotal: number;
  }[] = [];

  for (const item of items) {
    const prod = productMap.get(item.productId);
    if (!prod) {
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }

    if (prod.status !== "ACTIVE") {
      throw new AppError(`Product '${prod.name}' is archived and cannot be sold.`, 400);
    }

    const currentStock = Number(prod.quantityOnHand);
    if (currentStock < item.quantity) {
      throw new AppError(
        `Insufficient inventory for '${prod.name}'. In stock: ${currentStock}, requested: ${item.quantity}.`,
        400
      );
    }

    const unitPrice = roundMoney(Number(prod.sellingPrice));
    const unitCost = roundMoney(Number(prod.costPrice));
    const lineTotal = roundMoney(unitPrice * item.quantity);

    preparedItems.push({
      product: prod,
      quantity: item.quantity,
      unitPrice,
      unitCost,
      lineTotal,
    });
  }

  const subtotal = roundMoney(
    preparedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  );
  if (safeDiscount > subtotal) {
    throw new AppError("Discount cannot exceed subtotal amount.", 400);
  }

  const totals = calculatePosTotals(
    preparedItems.map((item) => ({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
    safeDiscount,
    applyVat
  );
  const { taxTotal: safeTax, grandTotal } = totals;

  // Validate payment details
  const method = payment.paymentMethod;
  let tendered = payment.tendered ?? grandTotal;
  let change = 0;

  if (!Number.isFinite(tendered) || tendered < 0) {
    throw new AppError("Tendered amount must be a valid non-negative number.", 400);
  }

  if (method === PaymentMethod.CASH) {
    if (tendered < grandTotal) {
      throw new AppError(
        `Insufficient cash tendered. Total: ${grandTotal} ETB, Tendered: ${tendered} ETB.`,
        400
      );
    }
    change = roundMoney(tendered - grandTotal);
  } else {
    // Electronic payments (TELEBIRR, CBE_BIRR, BANK_TRANSFER, etc.) require reference code
    const ref = payment.reference?.trim();
    if (!ref || ref.length < 3) {
      throw new AppError(
        `A valid transaction confirmation reference is required for ${method} payment.`,
        400
      );
    }

    if (method === PaymentMethod.OTHER && normalizedCustomerName === "Walk-in Customer") {
      throw new AppError(
        "Store Credit (Idda / ዕዳ) cannot be issued to an anonymous Walk-in Customer. Please select or enter a named customer with a phone number.",
        400
      );
    }

    tendered = grandTotal;
    change = 0;
  }

  // Generate invoice number
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const saleNumber = `INV-${todayStr}-${randomSuffix}`;

  // Execute atomic database transaction.
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
    for (const prep of preparedItems) {
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: prep.product.id,
          businessId,
          status: "ACTIVE",
          quantityOnHand: { gte: prep.quantity },
        },
        data: { quantityOnHand: { decrement: prep.quantity } },
      });

      if (stockUpdate.count !== 1) {
        const liveProd = await tx.product.findUnique({
          where: { id: prep.product.id },
          select: { name: true, quantityOnHand: true },
        });
        throw new AppError(
          liveProd
            ? `Insufficient inventory for '${liveProd.name}'. In stock: ${Number(liveProd.quantityOnHand)}, requested: ${prep.quantity}.`
            : `Product '${prep.product.name}' is no longer available in this business.`,
          409
        );
      }
    }

    // Create Sale record
    const sale = await tx.sale.create({
      data: {
        businessId,
        saleNumber,
        cashierId,
        customerName: customerName.trim() || "Walk-in Customer",
        subtotal,
        discountTotal: safeDiscount,
        taxTotal: safeTax,
        grandTotal,
        status: SaleStatus.COMPLETED,
        idempotencyKey: idempotencyKey || null,
        idempotencyHash: payloadHash,
      },
    });

    // Create Sale Items
    for (const prep of preparedItems) {
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: prep.product.id,
          productNameSnapshot: prep.product.name,
          unitPrice: prep.unitPrice,
          unitCostSnapshot: prep.unitCost,
          quantity: prep.quantity,
          lineTotal: prep.lineTotal,
        },
      });

      // Create Stock Movement Ledger entry
      await tx.stockMovement.create({
        data: {
          businessId,
          productId: prep.product.id,
          movementType: MovementType.SALE,
          quantityChange: -prep.quantity,
          reason: `POS Sale #${saleNumber}`,
          referenceType: "SALE",
          referenceId: sale.id,
          createdBy: cashierId,
        },
      });
    }

    // Create Payment record
    await tx.payment.create({
      data: {
        businessId,
        saleId: sale.id,
        amount: grandTotal,
        paymentMethod: method,
        reference: payment.reference?.trim() || null,
        status: "COMPLETED",
        tendered,
        change,
        recordedBy: cashierId,
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        businessId,
        actorUserId: cashierId,
        action: "POS_SALE_COMPLETED",
        entityType: "Sale",
        entityId: sale.id,
        metadata: {
          saleNumber,
          grandTotal,
          itemCount: preparedItems.length,
          paymentMethod: method,
          ...(approvingManagerId ? { managerApprovalUserId: approvingManagerId } : {}),
        },
      },
    });

    return sale;
    });
  } catch (error) {
    if (idempotencyKey && isUniqueConstraintError(error)) {
      const existing = await findExistingIdempotentSale(businessId, idempotencyKey);
      if (existing) {
        if (existing.idempotencyHash !== payloadHash) {
          throw new AppError(
            "This checkout key was already used for a different sale. Start a new checkout.",
            409
          );
        }
        return buildReceiptFromExistingSale(existing);
      }
    }
    throw error;
  }

  const receipt: PosReceiptResult = {
    saleId: result.id,
    saleNumber: result.saleNumber,
    createdAt: result.createdAt.toISOString(),
    business: {
      id: business.id,
      name: business.name,
      phone: business.phone,
      address: business.address,
      taxNumber: business.taxNumber,
      currency: business.currency || "ETB",
    },
    cashier: {
      id: cashier.id,
      name: cashier.name,
      email: cashier.email,
    },
    customerName: normalizedCustomerName,
    items: preparedItems.map((p) => ({
      productId: p.product.id,
      name: p.product.name,
      sku: p.product.sku,
      unitPrice: p.unitPrice,
      quantity: p.quantity,
      lineTotal: p.lineTotal,
    })),
    subtotal,
    discountTotal: safeDiscount,
    taxTotal: safeTax,
    grandTotal,
    payment: {
      method,
      amount: grandTotal,
      reference: payment.reference?.trim() || null,
      tendered,
      change,
    },
  };

  return receipt;
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function findExistingIdempotentSale(businessId: string, idempotencyKey: string) {
  return prisma.sale.findFirst({
    where: { businessId, idempotencyKey },
    include: {
      business: {
        select: { id: true, name: true, phone: true, address: true, taxNumber: true, currency: true },
      },
      cashier: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { sku: true } } } },
      payments: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
}

function buildReceiptFromExistingSale(sale: NonNullable<Awaited<ReturnType<typeof findExistingIdempotentSale>>>): PosReceiptResult {
  const payment = sale.payments[0];
  if (!payment) {
    throw new AppError("The previously recorded sale has no payment record.", 500);
  }

  return {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    createdAt: sale.createdAt.toISOString(),
    business: {
      id: sale.business.id,
      name: sale.business.name,
      phone: sale.business.phone,
      address: sale.business.address,
      taxNumber: sale.business.taxNumber,
      currency: sale.business.currency || "ETB",
    },
    cashier: {
      id: sale.cashier.id,
      name: sale.cashier.name,
      email: sale.cashier.email,
    },
    customerName: sale.customerName || "Walk-in Customer",
    items: sale.items.map((item) => ({
      productId: item.productId || item.id,
      name: item.productNameSnapshot,
      sku: item.product?.sku || null,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(sale.subtotal),
    discountTotal: Number(sale.discountTotal),
    taxTotal: Number(sale.taxTotal),
    grandTotal: Number(sale.grandTotal),
    payment: {
      method: payment.paymentMethod,
      amount: Number(payment.amount),
      reference: payment.reference,
      tendered: Number(payment.tendered ?? payment.amount),
      change: Number(payment.change ?? 0),
    },
  };
}
