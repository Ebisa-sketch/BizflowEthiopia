import { describe, it, expect } from "vitest";
import {
  formatMoney,
  roundMoney,
  calculateGrossProfit,
  calculateFinancialSummary,
  calculateStockSeverity,
} from "@/lib/money";

describe("Ethiopian Birr & Money Utilities", () => {
  it("formats ETB currency with standard two decimal places", () => {
    expect(formatMoney(150)).toBe("ETB 150.00");
    expect(formatMoney(1250.75)).toBe("ETB 1,250.75");
    expect(formatMoney("5000")).toBe("ETB 5,000.00");
  });

  it("handles null or undefined amounts gracefully", () => {
    expect(formatMoney(null)).toBe("ETB 0.00");
    expect(formatMoney(undefined)).toBe("ETB 0.00");
  });

  it("rounds money without floating point drift", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(19.999)).toBe(20.0);
  });

  it("calculates gross profit and margin accurately", () => {
    const result = calculateGrossProfit(1000, 700);
    expect(result.grossProfit).toBe(300);
    expect(result.marginPercentage).toBe(30);
  });

  it("calculates comprehensive financial metrics distinguishing collected vs outstanding balances", () => {
    const summary = calculateFinancialSummary({
      salesInvoiced: 10000,
      paymentsCollected: 8500,
      cogs: 6500,
      operatingExpenses: 1200,
    });

    expect(summary.totalInvoiced).toBe(10000);
    expect(summary.paymentsCollected).toBe(8500);
    expect(summary.outstandingBalance).toBe(1500);
    expect(summary.grossProfit).toBe(3500);
    expect(summary.grossMarginPercentage).toBe(35);
    expect(summary.netOperatingProfit).toBe(2300);
    expect(summary.isEstimate).toBe(true);
  });

  it("properly categorizes stock severity against reorder level", () => {
    expect(calculateStockSeverity(0, 10).severity).toBe("OUT_OF_STOCK");
    expect(calculateStockSeverity(4, 10).severity).toBe("CRITICAL");
    expect(calculateStockSeverity(8, 10).severity).toBe("WARNING");
    expect(calculateStockSeverity(25, 10).severity).toBe("HEALTHY");
  });
});
