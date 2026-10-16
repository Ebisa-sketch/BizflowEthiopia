import { describe, it, expect } from "vitest";
import {
  calculateFinancialSummary,
  calculateGrossProfit,
  calculateStockSeverity,
  roundMoney,
} from "@/lib/money";
import {
  buildPaymentMethodBreakdown,
  buildSalesChartData,
  getEatDateBoundaries,
} from "@/lib/dashboard-metrics";

describe("Dashboard Financial Metrics & Business Calculations", () => {
  it("accurately separates gross profit from net operating profit", () => {
    // 50,000 ETB Invoiced, 32,000 COGS, 6,000 Operating Expenses
    const summary = calculateFinancialSummary({
      salesInvoiced: 50000,
      paymentsCollected: 50000,
      cogs: 32000,
      operatingExpenses: 6000,
    });

    expect(summary.totalInvoiced).toBe(50000);
    expect(summary.cogs).toBe(32000);
    expect(summary.grossProfit).toBe(18000); // 50000 - 32000
    expect(summary.grossMarginPercentage).toBe(36); // (18000 / 50000) * 100
    expect(summary.operatingExpenses).toBe(6000);
    expect(summary.netOperatingProfit).toBe(12000); // 18000 - 6000
    expect(summary.netMarginPercentage).toBe(24); // (12000 / 50000) * 100
  });

  it("handles negative net profit when expenses exceed gross profit", () => {
    const summary = calculateFinancialSummary({
      salesInvoiced: 10000,
      paymentsCollected: 10000,
      cogs: 8000,
      operatingExpenses: 3500, // Gross profit is 2000, so net is -1500
    });

    expect(summary.grossProfit).toBe(2000);
    expect(summary.netOperatingProfit).toBe(-1500);
    expect(summary.netMarginPercentage).toBe(-15);
  });

  it("handles new business zero state without NaN or division by zero", () => {
    const summary = calculateFinancialSummary({
      salesInvoiced: 0,
      paymentsCollected: 0,
      cogs: 0,
      operatingExpenses: 0,
    });

    expect(summary.totalInvoiced).toBe(0);
    expect(summary.paymentsCollected).toBe(0);
    expect(summary.outstandingBalance).toBe(0);
    expect(summary.grossProfit).toBe(0);
    expect(summary.grossMarginPercentage).toBe(0);
    expect(summary.netOperatingProfit).toBe(0);
    expect(summary.netMarginPercentage).toBe(0);
    expect(isNaN(summary.grossMarginPercentage)).toBe(false);
  });

  it("calculates partial payments and outstanding credit balances correctly", () => {
    const summary = calculateFinancialSummary({
      salesInvoiced: 15400.5,
      paymentsCollected: 10000,
      cogs: 9500,
      operatingExpenses: 1200,
    });

    expect(summary.totalInvoiced).toBe(15400.5);
    expect(summary.paymentsCollected).toBe(10000);
    expect(summary.outstandingBalance).toBe(5400.5);
  });

  it("properly detects out-of-stock and critical stock thresholds for inventory alerts", () => {
    const outOfStock = calculateStockSeverity(0, 15);
    expect(outOfStock.severity).toBe("OUT_OF_STOCK");
    expect(outOfStock.label).toBe("Out of Stock");

    const critical = calculateStockSeverity(3, 10);
    expect(critical.severity).toBe("CRITICAL");

    const healthy = calculateStockSeverity(50, 10);
    expect(healthy.severity).toBe("HEALTHY");
  });

  it("correctly applies East Africa Time (EAT UTC+3) offset for Ethiopian business day boundaries", () => {
    const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
    // 21:30 UTC on Oct 14 is 00:30 EAT on Oct 15
    const utcDate = new Date("2026-10-14T21:30:00Z");
    const eatDate = new Date(utcDate.getTime() + EAT_OFFSET_MS);

    expect(utcDate.getUTCDate()).toBe(14);
    expect(eatDate.getUTCDate()).toBe(15);
    expect(eatDate.getUTCHours()).toBe(0);
    expect(eatDate.getUTCMinutes()).toBe(30);
  });

  it("starts today's data at midnight in EAT", () => {
    const now = new Date("2026-10-14T21:30:00.000Z");
    const { startDate } = getEatDateBoundaries("today", now);

    expect(startDate.toISOString()).toBe("2026-10-14T21:00:00.000Z");
  });

  it("includes every day in the 30-day chart and excludes out-of-range days", () => {
    const now = new Date("2026-10-15T00:30:00.000Z");
    const chart = buildSalesChartData(
      "30d",
      [
        { createdAt: new Date("2026-09-16T07:00:00.000Z"), grandTotal: 100 },
        { createdAt: new Date("2026-10-14T22:00:00.000Z"), grandTotal: 200 },
        { createdAt: new Date("2026-09-15T07:00:00.000Z"), grandTotal: 300 },
        { createdAt: new Date("2026-10-15T22:00:00.000Z"), grandTotal: 400 },
      ],
      now
    );

    expect(chart).toHaveLength(6);
    expect(chart[0]).toMatchObject({ day: "29–25d ago", amount: 100, sales: 1 });
    expect(chart[5]).toMatchObject({ day: "4d ago–Today", amount: 200, sales: 1 });
    expect(chart.reduce((sum, bucket) => sum + bucket.amount, 0)).toBe(300);
  });

  it("labels full-day chart buckets accurately from midnight through the end of EAT day", () => {
    const chart = buildSalesChartData(
      "today",
      [
        { createdAt: new Date("2026-10-14T21:30:00.000Z"), grandTotal: 10 },
        { createdAt: new Date("2026-10-15T19:30:00.000Z"), grandTotal: 20 },
      ],
      new Date("2026-10-15T12:00:00.000Z")
    );

    expect(chart).toHaveLength(6);
    expect(chart[0]).toMatchObject({ day: "00:00", amount: 10, sales: 1 });
    expect(chart[5]).toMatchObject({ day: "20:00", amount: 20, sales: 1 });
  });

  it("calculates payment method shares from collected amounts and totals exactly 100%", () => {
    const breakdown = buildPaymentMethodBreakdown({
      CASH: 1,
      TELEBIRR: 1,
      CBE_BIRR: 1,
      OTHER: 0,
    });

    expect(breakdown.reduce((sum, item) => sum + item.percentage, 0)).toBe(100);
    expect(breakdown.map(({ method }) => method)).not.toContain("OTHER");
  });
});
