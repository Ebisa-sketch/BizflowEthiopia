import { roundMoney } from "../money";

export const POS_VAT_RATE = 0.15;

export function formatPosReceiptDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export interface PosLineInput {
  unitPrice: number;
  quantity: number;
}

export function calculatePosTotals(
  items: PosLineInput[],
  discountTotal: number,
  applyVat: boolean,
  taxIncluded: boolean = false
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + roundMoney(item.unitPrice * item.quantity), 0)
  );
  const discount = roundMoney(discountTotal);
  if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
    throw new RangeError("Discount must be between zero and the cart subtotal.");
  }

  const netAfterDiscount = roundMoney(subtotal - discount);

  if (!applyVat) {
    return {
      subtotal,
      discountTotal: discount,
      taxableSubtotal: netAfterDiscount,
      taxTotal: 0,
      grandTotal: netAfterDiscount,
      taxIncluded: false,
    };
  }

  if (taxIncluded) {
    // When prices are tax-inclusive: listed price includes 15% VAT.
    // Taxable base = netAfterDiscount / (1 + 0.15)
    // Tax extracted = roundMoney(netAfterDiscount - taxableSubtotal)
    const taxableSubtotal = roundMoney(netAfterDiscount / (1 + POS_VAT_RATE));
    const taxTotal = roundMoney(netAfterDiscount - taxableSubtotal);
    return {
      subtotal,
      discountTotal: discount,
      taxableSubtotal,
      taxTotal,
      grandTotal: netAfterDiscount,
      taxIncluded: true,
    };
  }

  // When prices are tax-exclusive (default Ethiopian B2B / retail setting):
  // 15% VAT is added on top of the taxable subtotal.
  const taxableSubtotal = netAfterDiscount;
  const taxTotal = roundMoney(taxableSubtotal * POS_VAT_RATE);

  return {
    subtotal,
    discountTotal: discount,
    taxableSubtotal,
    taxTotal,
    grandTotal: roundMoney(taxableSubtotal + taxTotal),
    taxIncluded: false,
  };
}
