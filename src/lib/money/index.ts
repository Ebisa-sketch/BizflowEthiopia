/**
 * Ethiopian Birr (ETB) Currency & Financial Calculation Utilities
 * Multi-tenant business management calculations
 */

export interface MoneyOptions {
  currency?: string;
  locale?: string;
  showSymbol?: boolean;
}

/**
 * Format a numeric or decimal string value into Ethiopian Birr presentation
 * Example: 1250.5 -> "ETB 1,250.50"
 */
export function formatMoney(
  amount: number | string | null | undefined,
  options: MoneyOptions = {}
): string {
  const { currency = "ETB", locale = "en-ET", showSymbol = true } = options;
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);

  if (isNaN(num)) return `0.00 ${currency}`;

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  if (!showSymbol) return formattedNumber;
  return `${currency} ${formattedNumber}`;
}

/**
 * Round a monetary value safely to 2 decimal places to avoid IEEE 754 precision issues
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate Gross Profit from selling price and snapshotted cost price
 */
export function calculateGrossProfit(
  revenue: number,
  cogs: number
): { grossProfit: number; marginPercentage: number } {
  const grossProfit = roundMoney(revenue - cogs);
  const marginPercentage = revenue > 0 ? roundMoney((grossProfit / revenue) * 100) : 0;
  return { grossProfit, marginPercentage };
}

export interface BusinessFinancialSummary {
  totalInvoiced: number;
  paymentsCollected: number;
  outstandingBalance: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  operatingExpenses: number;
  netOperatingProfit: number;
  netMarginPercentage: number;
  isEstimate: boolean;
}

/**
 * Compute clear financial metrics distinguishing revenue, collected cash, COGS, and operating expenses
 */
export function calculateFinancialSummary(params: {
  salesInvoiced: number;
  paymentsCollected: number;
  cogs: number;
  operatingExpenses: number;
}): BusinessFinancialSummary {
  const totalInvoiced = roundMoney(params.salesInvoiced);
  const paymentsCollected = roundMoney(params.paymentsCollected);
  const outstandingBalance = roundMoney(Math.max(0, totalInvoiced - paymentsCollected));
  const cogs = roundMoney(params.cogs);

  const { grossProfit, marginPercentage: grossMarginPercentage } = calculateGrossProfit(
    totalInvoiced,
    cogs
  );

  const operatingExpenses = roundMoney(params.operatingExpenses);
  const netOperatingProfit = roundMoney(grossProfit - operatingExpenses);
  const netMarginPercentage =
    totalInvoiced > 0 ? roundMoney((netOperatingProfit / totalInvoiced) * 100) : 0;

  return {
    totalInvoiced,
    paymentsCollected,
    outstandingBalance,
    cogs,
    grossProfit,
    grossMarginPercentage,
    operatingExpenses,
    netOperatingProfit,
    netMarginPercentage,
    isEstimate: true,
  };
}

export type StockSeverity = "OUT_OF_STOCK" | "CRITICAL" | "WARNING" | "HEALTHY";

/**
 * Classify product inventory severity against defined reorder levels
 */
export function calculateStockSeverity(
  quantityOnHand: number,
  reorderLevel: number
): {
  severity: StockSeverity;
  label: string;
  badgeClass: string;
} {
  if (quantityOnHand <= 0) {
    return {
      severity: "OUT_OF_STOCK",
      label: "Out of Stock",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (quantityOnHand <= reorderLevel * 0.5) {
    return {
      severity: "CRITICAL",
      label: "Critically Low",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  if (quantityOnHand <= reorderLevel) {
    return {
      severity: "WARNING",
      label: "Reorder Required",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    severity: "HEALTHY",
    label: "Adequate Stock",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}
