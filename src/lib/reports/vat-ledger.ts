import { roundMoney } from "@/lib/money";

export interface VatSaleInput {
  id?: string;
  saleNumber: string;
  createdAt: Date | string;
  subtotal: number | string | { toNumber?: () => number };
  taxTotal: number | string | { toNumber?: () => number };
  discountTotal?: number | string | { toNumber?: () => number };
  grandTotal: number | string | { toNumber?: () => number };
  customerName?: string | null;
  customer?: {
    name?: string | null;
    tinNumber?: string | null;
  } | null;
  items: Array<{
    productNameSnapshot: string;
    quantity: number | string | { toNumber?: () => number };
    unitPrice: number | string | { toNumber?: () => number };
    lineTotal: number | string | { toNumber?: () => number };
    unitCostSnapshot?: number | string | { toNumber?: () => number };
  }>;
  payments?: Array<{
    amount: number | string | { toNumber?: () => number };
    paymentMethod: string;
    reference?: string | null;
  }>;
}

export interface VatLedgerRow {
  saleNumber: string;
  date: string; // YYYY-MM-DD HH:mm:ss
  customerName: string;
  customerTin: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  vatRate: string; // "15%" or "0% (Exempt)"
  vatAmount: number;
  grossAmount: number;
  paymentMethod: string;
  paymentReference: string;
}

export interface VatSummaryReport {
  totalGrossSales: number;
  totalTaxableSales: number;
  totalOutputVat: number;
  totalExemptSales: number;
  vatInvoicesCount: number;
  exemptInvoicesCount: number;
  totalInvoicesCount: number;
  effectiveVatRate: number;
  ledgerRows: VatLedgerRow[];
}

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "object" && val !== null && "toNumber" in val && typeof (val as any).toNumber === "function") {
    return (val as any).toNumber();
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Computes official MoR 15% VAT metrics and generates itemized sales ledger rows
 */
export function computeVatLedger(sales: VatSaleInput[]): VatSummaryReport {
  let totalGrossSales = 0;
  let totalTaxableSales = 0;
  let totalOutputVat = 0;
  let totalExemptSales = 0;
  let vatInvoicesCount = 0;
  let exemptInvoicesCount = 0;

  const ledgerRows: VatLedgerRow[] = [];

  for (const sale of sales) {
    const grandTotal = toNumber(sale.grandTotal);
    const taxTotal = toNumber(sale.taxTotal);
    const subtotal = toNumber(sale.subtotal);
    const dateObj = new Date(sale.createdAt);
    const dateStr = !isNaN(dateObj.getTime())
      ? dateObj.toISOString().replace("T", " ").substring(0, 19)
      : String(sale.createdAt);

    const isVatSale = taxTotal > 0.005;
    const customerName = sale.customer?.name || sale.customerName || "Walk-in Customer";
    const customerTin = sale.customer?.tinNumber || "N/A";

    const paymentMethods = sale.payments && sale.payments.length > 0
      ? sale.payments.map((p) => p.paymentMethod).join(", ")
      : "CASH";
    const paymentRefs = sale.payments && sale.payments.length > 0
      ? sale.payments.map((p) => p.reference).filter(Boolean).join(", ") || "-"
      : "-";

    totalGrossSales += grandTotal;

    if (isVatSale) {
      vatInvoicesCount += 1;
      totalTaxableSales += subtotal;
      totalOutputVat += taxTotal;
    } else {
      exemptInvoicesCount += 1;
      totalExemptSales += grandTotal;
    }

    const saleItems = sale.items || [];
    const itemsCount = saleItems.length;

    for (let i = 0; i < itemsCount; i++) {
      const item = saleItems[i];
      const qty = toNumber(item.quantity);
      const unitPrice = toNumber(item.unitPrice);
      const lineTotal = toNumber(item.lineTotal);

      let itemTaxable = 0;
      let itemVat = 0;
      let itemGross = 0;
      let vatRateStr = "0% (Exempt)";

      if (isVatSale) {
        vatRateStr = "15%";
        // Subtotal ratio
        const ratio = subtotal > 0 ? lineTotal / subtotal : 1 / itemsCount;
        itemTaxable = roundMoney(lineTotal);
        itemVat = roundMoney(taxTotal * ratio);
        itemGross = roundMoney(itemTaxable + itemVat);
      } else {
        itemTaxable = 0;
        itemVat = 0;
        itemGross = roundMoney(lineTotal);
      }

      ledgerRows.push({
        saleNumber: sale.saleNumber,
        date: dateStr,
        customerName,
        customerTin,
        productName: item.productNameSnapshot,
        quantity: qty,
        unitPrice: roundMoney(unitPrice),
        taxableAmount: itemTaxable,
        vatRate: vatRateStr,
        vatAmount: itemVat,
        grossAmount: itemGross,
        paymentMethod: paymentMethods,
        paymentReference: paymentRefs,
      });
    }
  }

  const roundedGross = roundMoney(totalGrossSales);
  const roundedTaxable = roundMoney(totalTaxableSales);
  const roundedVat = roundMoney(totalOutputVat);
  const roundedExempt = roundMoney(totalExemptSales);
  const totalInvoicesCount = vatInvoicesCount + exemptInvoicesCount;
  const effectiveVatRate = roundedTaxable > 0 ? roundMoney((roundedVat / roundedTaxable) * 100) : 0;

  return {
    totalGrossSales: roundedGross,
    totalTaxableSales: roundedTaxable,
    totalOutputVat: roundedVat,
    totalExemptSales: roundedExempt,
    vatInvoicesCount,
    exemptInvoicesCount,
    totalInvoicesCount,
    effectiveVatRate,
    ledgerRows,
  };
}

/**
 * Escapes a cell value for CSV format (RFC 4180)
 */
function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates an official Ethiopian Ministry of Revenue (MoR) compliant Sales & VAT Ledger CSV with UTF-8 BOM
 */
export function generateVatLedgerCsv(
  report: VatSummaryReport,
  metadata: {
    businessName: string;
    tinNumber?: string;
    periodLabel: string;
    generatedAt?: string;
  }
): string {
  const generatedDate = metadata.generatedAt || new Date().toISOString().replace("T", " ").substring(0, 19);

  const lines: string[] = [
    // Header block
    `"FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA - MINISTRY OF REVENUE (MoR)"`,
    `"OFFICIAL SALES & 15% VALUE ADDED TAX (VAT) DECLARATION REGISTER"`,
    `"Business Name",${escapeCsv(metadata.businessName)}`,
    `"Business TIN",${escapeCsv(metadata.tinNumber || "Unregistered / Standard")}`,
    `"Tax Period",${escapeCsv(metadata.periodLabel)}`,
    `"Declaration Standard","Proclamation No. 285/2002 - 15% Standard VAT"`,
    `"Generated On",${escapeCsv(generatedDate)}`,
    `""`,
    // Summary block
    `"--- VAT SUMMARY SUMMARY METRICS ---"`,
    `"Total Gross Sales (ETB)",${escapeCsv(report.totalGrossSales.toFixed(2))}`,
    `"15% Taxable Sales Base (ETB)",${escapeCsv(report.totalTaxableSales.toFixed(2))}`,
    `"15% Output VAT Collected (ETB)",${escapeCsv(report.totalOutputVat.toFixed(2))}`,
    `"Tax-Exempt / Zero-Rated Sales (ETB)",${escapeCsv(report.totalExemptSales.toFixed(2))}`,
    `"Total Invoices Issued",${escapeCsv(report.totalInvoicesCount)}`,
    `"15% VAT Invoices Count",${escapeCsv(report.vatInvoicesCount)}`,
    `""`,
    // Itemized Ledger Header
    [
      escapeCsv("Invoice #"),
      escapeCsv("Date (UTC)"),
      escapeCsv("Customer Name"),
      escapeCsv("Customer TIN"),
      escapeCsv("Item Description"),
      escapeCsv("Quantity"),
      escapeCsv("Unit Price (ETB)"),
      escapeCsv("Taxable Amount (ETB)"),
      escapeCsv("VAT Rate"),
      escapeCsv("VAT Amount (ETB)"),
      escapeCsv("Gross Total (ETB)"),
      escapeCsv("Payment Method"),
      escapeCsv("Reference"),
    ].join(","),
  ];

  // Ledger rows
  for (const row of report.ledgerRows) {
    lines.push(
      [
        escapeCsv(row.saleNumber),
        escapeCsv(row.date),
        escapeCsv(row.customerName),
        escapeCsv(row.customerTin),
        escapeCsv(row.productName),
        escapeCsv(row.quantity),
        escapeCsv(row.unitPrice.toFixed(2)),
        escapeCsv(row.taxableAmount.toFixed(2)),
        escapeCsv(row.vatRate),
        escapeCsv(row.vatAmount.toFixed(2)),
        escapeCsv(row.grossAmount.toFixed(2)),
        escapeCsv(row.paymentMethod),
        escapeCsv(row.paymentReference),
      ].join(",")
    );
  }

  // Summary footer row
  const totalQty = report.ledgerRows.reduce((sum, r) => sum + r.quantity, 0);
  lines.push(`""`);
  lines.push(
    [
      escapeCsv("TOTALS"),
      escapeCsv(""),
      escapeCsv(""),
      escapeCsv(""),
      escapeCsv(`${report.ledgerRows.length} Line Items`),
      escapeCsv(totalQty),
      escapeCsv(""),
      escapeCsv(report.totalTaxableSales.toFixed(2)),
      escapeCsv("15%"),
      escapeCsv(report.totalOutputVat.toFixed(2)),
      escapeCsv(report.totalGrossSales.toFixed(2)),
      escapeCsv(""),
      escapeCsv(""),
    ].join(",")
  );

  // Return with UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 cleanly
  return "\uFEFF" + lines.join("\r\n");
}
