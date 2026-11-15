import { describe, it, expect } from "vitest";
import { computeVatLedger, generateVatLedgerCsv, VatSaleInput } from "@/lib/reports/vat-ledger";

describe("Ethiopian MoR 15% VAT & Sales Ledger Service", () => {
  const sampleSales: VatSaleInput[] = [
    {
      saleNumber: "INV-2026-0001",
      createdAt: new Date("2026-11-15T10:30:00Z"),
      subtotal: 1000,
      taxTotal: 150, // 15% VAT
      grandTotal: 1150,
      customerName: "Abebe Trading PLC",
      customer: {
        name: "Abebe Trading PLC",
        tinNumber: "0012345678",
      },
      items: [
        {
          productNameSnapshot: "Teff Magna 25kg",
          quantity: 2,
          unitPrice: 500,
          lineTotal: 1000,
        },
      ],
      payments: [
        {
          amount: 1150,
          paymentMethod: "TELEBIRR",
          reference: "TB998877",
        },
      ],
    },
    {
      saleNumber: "INV-2026-0002",
      createdAt: new Date("2026-11-15T11:00:00Z"),
      subtotal: 500,
      taxTotal: 0, // Tax exempt sale
      grandTotal: 500,
      customerName: "Walk-in Customer",
      customer: null,
      items: [
        {
          productNameSnapshot: "Cooking Oil 5L",
          quantity: 1,
          unitPrice: 500,
          lineTotal: 500,
        },
      ],
      payments: [
        {
          amount: 500,
          paymentMethod: "CASH",
        },
      ],
    },
    {
      saleNumber: "INV-2026-0003",
      createdAt: new Date("2026-11-15T12:15:00Z"),
      subtotal: 2000,
      taxTotal: 300, // 15% VAT across 2 items
      grandTotal: 2300,
      customerName: "Almaz Retail",
      customer: {
        name: "Almaz Retail",
        tinNumber: "0098765432",
      },
      items: [
        {
          productNameSnapshot: "Sugar 10kg",
          quantity: 2,
          unitPrice: 500,
          lineTotal: 1000,
        },
        {
          productNameSnapshot: "Coffee Beans 5kg",
          quantity: 1,
          unitPrice: 1000,
          lineTotal: 1000,
        },
      ],
      payments: [
        {
          amount: 2300,
          paymentMethod: "CBE_BIRR",
          reference: "CBE112233",
        },
      ],
    },
  ];

  it("accurately calculates MoR VAT metrics", () => {
    const report = computeVatLedger(sampleSales);

    // Total gross: 1150 + 500 + 2300 = 3950
    expect(report.totalGrossSales).toBe(3950);
    // Taxable sales: 1000 + 2000 = 3000
    expect(report.totalTaxableSales).toBe(3000);
    // Output VAT: 150 + 300 = 450
    expect(report.totalOutputVat).toBe(450);
    // Exempt sales: 500
    expect(report.totalExemptSales).toBe(500);
    // Effective VAT rate: 450 / 3000 = 15.0%
    expect(report.effectiveVatRate).toBe(15);
    // Invoices count
    expect(report.vatInvoicesCount).toBe(2);
    expect(report.exemptInvoicesCount).toBe(1);
    expect(report.totalInvoicesCount).toBe(3);
  });

  it("generates correct itemized ledger rows with proportional VAT allocation", () => {
    const report = computeVatLedger(sampleSales);

    // Total items across 3 sales: 1 + 1 + 2 = 4
    expect(report.ledgerRows.length).toBe(4);

    // First sale (VAT 15%)
    const row1 = report.ledgerRows[0];
    expect(row1.saleNumber).toBe("INV-2026-0001");
    expect(row1.customerName).toBe("Abebe Trading PLC");
    expect(row1.customerTin).toBe("0012345678");
    expect(row1.productName).toBe("Teff Magna 25kg");
    expect(row1.taxableAmount).toBe(1000);
    expect(row1.vatRate).toBe("15%");
    expect(row1.vatAmount).toBe(150);
    expect(row1.grossAmount).toBe(1150);
    expect(row1.paymentMethod).toBe("TELEBIRR");
    expect(row1.paymentReference).toBe("TB998877");

    // Second sale (Exempt)
    const row2 = report.ledgerRows[1];
    expect(row2.saleNumber).toBe("INV-2026-0002");
    expect(row2.customerName).toBe("Walk-in Customer");
    expect(row2.customerTin).toBe("N/A");
    expect(row2.vatRate).toBe("0% (Exempt)");
    expect(row2.vatAmount).toBe(0);
    expect(row2.grossAmount).toBe(500);

    // Third sale (Multi-item: 2 items sharing 300 VAT -> 150 each)
    const row3 = report.ledgerRows[2];
    const row4 = report.ledgerRows[3];
    expect(row3.vatAmount).toBe(150);
    expect(row4.vatAmount).toBe(150);
  });

  it("generates MoR compliant CSV with UTF-8 BOM, headers, and footer", () => {
    const report = computeVatLedger(sampleSales);
    const csv = generateVatLedgerCsv(report, {
      businessName: "Addis Mart Supermarket",
      tinNumber: "0011223344",
      periodLabel: "November 2026",
      generatedAt: "2026-11-15 12:00:00",
    });

    // Starts with UTF-8 BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    // Contains official MoR header
    expect(csv).toContain("FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA - MINISTRY OF REVENUE (MoR)");
    expect(csv).toContain("OFFICIAL SALES & 15% VALUE ADDED TAX (VAT) DECLARATION REGISTER");
    expect(csv).toContain('"Addis Mart Supermarket"');
    expect(csv).toContain('"0011223344"');
    expect(csv).toContain('"November 2026"');
    expect(csv).toContain('"Proclamation No. 285/2002 - 15% Standard VAT"');

    // Contains columns
    expect(csv).toContain('"Invoice #"');
    expect(csv).toContain('"Customer TIN"');
    expect(csv).toContain('"VAT Rate"');
    expect(csv).toContain('"VAT Amount (ETB)"');

    // Contains items and values
    expect(csv).toContain('"INV-2026-0001"');
    expect(csv).toContain('"Teff Magna 25kg"');
    expect(csv).toContain('"3000.00"'); // Taxable total in footer
    expect(csv).toContain('"450.00"');  // VAT total in footer
    expect(csv).toContain('"TOTALS"');
  });

  it("handles empty sales list gracefully", () => {
    const report = computeVatLedger([]);
    expect(report.totalGrossSales).toBe(0);
    expect(report.totalTaxableSales).toBe(0);
    expect(report.totalOutputVat).toBe(0);
    expect(report.effectiveVatRate).toBe(0);
    expect(report.ledgerRows.length).toBe(0);

    const csv = generateVatLedgerCsv(report, {
      businessName: "Test Store",
      periodLabel: "Today",
    });
    expect(csv).toContain('"TOTALS"');
    expect(csv).toContain('"0 Line Items"');
  });
});
