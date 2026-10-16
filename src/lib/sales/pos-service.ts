import { prisma } from "../db/prisma";
import { AppError } from "../errors";
import { roundMoney } from "../money";
import { BusinessRole, hasPermission } from "../permissions";
import { checkIdempotency, recordIdempotency } from "../idempotency";
import { MovementType, PaymentMethod, SaleStatus } from "@prisma/client";

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
  taxTotal?: number;
  taxRate?: number;
  customerName?: string;
  payment: PosPaymentInput;
  idempotencyKey?: string;
  managerApprovalUserId?: string;
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
    taxTotal = 0,
    customerName = "Walk-in Customer",
    payment,
    idempotencyKey,
    managerApprovalUserId,
  } = input;

  // 1. Check idempotency deduplication
  if (idempotencyKey) {
    const existing = checkIdempotency(idempotencyKey);
    if (existing) {
      return existing as PosReceiptResult;
    }
  }

  // 2. Validate cart items presence
  if (!items || items.length === 0) {
    throw new AppError("Cart is empty. Please add at least one product.", 400);
  }

  // 3. Validate positive quantities
  for (const item of items) {
    if (!item.productId || typeof item.productId !== "string") {
      throw new AppError("Invalid product identifier in cart.", 400);
    }
    if (!item.quantity || item.quantity <= 0 || !Number.isFinite(item.quantity)) {
      throw new AppError(`Quantity must be a positive number for product ${item.productId}.`, 400);
    }
  }

  // 4. Validate discount permissions
  const safeDiscount = roundMoney(Math.max(0, discountTotal));
  if (safeDiscount > 0) {
    if (hasPermission(role, "sales:discount")) {
      if (managerApprovalUserId) {
        throw new AppError("Manager approval cannot be used by a user with discount permission.", 400);
      }
    } else if (!managerApprovalUserId) {
      throw new AppError("Discounts require Manager or Owner role authorization.", 403);
    } else {
      const managerMembership = await prisma.membership.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: managerApprovalUserId,
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
  } else if (managerApprovalUserId) {
    throw new AppError("Manager approval is only valid when a discount is applied.", 400);
  }

  // 5. Fetch products & active business
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

  // 6. Recalculate totals and check inventory
  let subtotal = 0;
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
    subtotal = roundMoney(subtotal + lineTotal);

    preparedItems.push({
      product: prod,
      quantity: item.quantity,
      unitPrice,
      unitCost,
      lineTotal,
    });
  }

  if (safeDiscount > subtotal) {
    throw new AppError("Discount cannot exceed subtotal amount.", 400);
  }

  const safeTax = roundMoney(Math.max(0, taxTotal));
  const grandTotal = roundMoney(subtotal - safeDiscount + safeTax);

  // 7. Validate payment details
  const method = payment.paymentMethod;
  let tendered = payment.tendered ?? grandTotal;
  let change = 0;

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

    // Special validation for Store Credit (Idda / ዕዳ)
    if (ref.startsWith("IDDA") || ref.startsWith("CREDIT")) {
      if (!customerName || customerName.trim() === "Walk-in Customer") {
        throw new AppError(
          "Store Credit (Idda / ዕዳ) cannot be issued to an anonymous Walk-in Customer. Please select or enter a named customer with a phone number.",
          400
        );
      }
    }

    tendered = grandTotal;
    change = 0;
  }

  // 8. Generate invoice number
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const saleNumber = `INV-${todayStr}-${randomSuffix}`;

  // 9. Execute atomic database transaction
  const result = await prisma.$transaction(async (tx) => {
    // Re-verify stock inside transaction for concurrency safety
    for (const prep of preparedItems) {
      const liveProd = await tx.product.findUnique({
        where: { id: prep.product.id },
        select: { id: true, name: true, quantityOnHand: true },
      });

      if (!liveProd || Number(liveProd.quantityOnHand) < prep.quantity) {
        throw new AppError(
          `Concurrent inventory conflict: '${prep.product.name}' was just purchased by another counter.`,
          409
        );
      }

      // Decrement stock
      await tx.product.update({
        where: { id: prep.product.id },
        data: {
          quantityOnHand: {
            decrement: prep.quantity,
          },
        },
      });
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
          ...(managerApprovalUserId ? { managerApprovalUserId } : {}),
        },
      },
    });

    return sale;
  });

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
    customerName: customerName.trim() || "Walk-in Customer",
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

  // 10. Record in idempotency cache
  if (idempotencyKey) {
    recordIdempotency(idempotencyKey, receipt);
  }

  return receipt;
}
