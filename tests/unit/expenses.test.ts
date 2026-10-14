import { describe, it, expect } from "vitest";
import { roundMoney, formatMoney } from "@/lib/money";

describe("Operating Expenses Financial Calculations", () => {
  it("rounds money and ensures precision for overhead costs", () => {
    const rawRent = 12000.456;
    expect(roundMoney(rawRent)).toBe(12000.46);
    expect(formatMoney(rawRent)).toBe("ETB 12,000.46");
  });

  it("calculates aggregate sum of multiple operating expense categories", () => {
    const expenses = [
      { category: "Rent", amount: 12000 },
      { category: "Utilities", amount: 1450.5 },
      { category: "Logistics", amount: 800 },
      { category: "Supplies", amount: 350.25 },
    ];

    const total = expenses.reduce((sum, e) => roundMoney(sum + e.amount), 0);
    expect(total).toBe(14600.75);
    expect(formatMoney(total)).toBe("ETB 14,600.75");
  });

  it("calculates category breakdown percentages accurately", () => {
    const expenses = [
      { category: "Rent", amount: 6000 },
      { category: "Utilities", amount: 2000 },
      { category: "Logistics", amount: 2000 },
    ];
    const total = 10000;

    const breakdown = expenses.map((e) => ({
      category: e.category,
      percentage: Math.round((e.amount / total) * 100),
    }));

    expect(breakdown).toEqual([
      { category: "Rent", percentage: 60 },
      { category: "Utilities", percentage: 20 },
      { category: "Logistics", percentage: 20 },
    ]);
  });
});
