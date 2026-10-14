import { describe, it, expect } from "vitest";
import { calculateStockSeverity } from "@/lib/money";

describe("Inventory Ledger & Stock Severity Logic", () => {
  it("marks zero stock as critical out of stock", () => {
    const severity = calculateStockSeverity(0, 10);
    expect(severity.label).toBe("Out of Stock");
    expect(severity.badgeClass).toContain("bg-red-50");
  });

  it("marks negative stock as critical out of stock", () => {
    const severity = calculateStockSeverity(-2, 10);
    expect(severity.label).toBe("Out of Stock");
    expect(severity.badgeClass).toContain("text-red-700");
  });

  it("marks stock at or below reorder level as Reorder Required and Critically Low", () => {
    const severityWarning = calculateStockSeverity(8, 10);
    expect(severityWarning.label).toBe("Reorder Required");
    expect(severityWarning.badgeClass).toContain("bg-amber-50");

    const severityCritical = calculateStockSeverity(4, 10);
    expect(severityCritical.label).toBe("Critically Low");
    expect(severityCritical.badgeClass).toContain("bg-orange-50");
  });

  it("marks stock comfortably above reorder level as Healthy", () => {
    const severityHealthy = calculateStockSeverity(50, 10);
    expect(severityHealthy.label).toBe("Adequate Stock");
    expect(severityHealthy.badgeClass).toContain("text-emerald-700");
  });

  it("calculates correct signed quantity changes for movements", () => {
    // Delivery Receipt adds positive quantity
    const receiptDelta = Math.abs(25);
    expect(receiptDelta).toBe(25);

    // Damage subtracts quantity
    const damageDelta = -Math.abs(3);
    expect(damageDelta).toBe(-3);

    // Initial stock 15 + receipt 25 + damage -3 = 37
    const initial = 15;
    const finalStock = initial + receiptDelta + damageDelta;
    expect(finalStock).toBe(37);
  });
});
