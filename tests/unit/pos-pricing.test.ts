import { describe, expect, it } from "vitest";
import { calculatePosTotals } from "@/lib/sales/pos-pricing";

describe("POS cart pricing", () => {
  it("calculates line totals, discount, exclusive VAT, and grand total consistently", () => {
    expect(
      calculatePosTotals(
        [
          { unitPrice: 35, quantity: 2 },
          { unitPrice: 19.99, quantity: 3 },
        ],
        10,
        true
      )
    ).toEqual({
      subtotal: 129.97,
      discountTotal: 10,
      taxableSubtotal: 119.97,
      taxTotal: 18,
      grandTotal: 137.97,
      taxIncluded: false,
    });
  });

  it("does not include VAT when the VAT option is disabled", () => {
    expect(
      calculatePosTotals([{ unitPrice: 100, quantity: 1 }], 0, false)
    ).toMatchObject({ subtotal: 100, taxTotal: 0, grandTotal: 100 });
  });

  it("calculates extracted VAT for tax-inclusive pricing without inflating grand total", () => {
    // 115 ETB inclusive with 0 discount: base = 100, VAT = 15, grandTotal = 115
    const result = calculatePosTotals([{ unitPrice: 115, quantity: 1 }], 0, true, true);
    expect(result).toEqual({
      subtotal: 115,
      discountTotal: 0,
      taxableSubtotal: 100,
      taxTotal: 15,
      grandTotal: 115,
      taxIncluded: true,
    });
  });

  it("calculates extracted VAT for tax-inclusive pricing after discount", () => {
    // 230 ETB subtotal, 115 discount => 115 net inclusive => base = 100, VAT = 15, grandTotal = 115
    const result = calculatePosTotals([{ unitPrice: 115, quantity: 2 }], 115, true, true);
    expect(result).toEqual({
      subtotal: 230,
      discountTotal: 115,
      taxableSubtotal: 100,
      taxTotal: 15,
      grandTotal: 115,
      taxIncluded: true,
    });
  });

  it("rejects negative and above-subtotal discounts", () => {
    const items = [{ unitPrice: 10, quantity: 1 }];
    expect(() => calculatePosTotals(items, -1, false)).toThrow(RangeError);
    expect(() => calculatePosTotals(items, 11, false)).toThrow(RangeError);
  });
});
