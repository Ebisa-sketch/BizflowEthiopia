"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Download,
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingCart,
  Banknote,
  Smartphone,
  Building,
  Info,
  FileSpreadsheet,
  RefreshCw,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Receipt,
  X,
} from "lucide-react";
import { formatMoney, calculateGrossProfit, calculateFinancialSummary } from "@/lib/money";
import { DashboardSkeleton } from "@/components/ui/skeleton";

type ReportPeriod = "today" | "week" | "month" | "quarter";

interface VatSummary {
  totalGrossSales: number;
  totalTaxableSales: number;
  totalOutputVat: number;
  totalExemptSales: number;
  vatInvoicesCount: number;
  exemptInvoicesCount: number;
  totalInvoicesCount: number;
  effectiveVatRate: number;
}

interface PeriodData {
  revenue: number;
  cogs: number;
  expenses: number;
  transactions: number;
  prevRevenue: number;
  topProducts: { name: string; units: number; revenue: number; margin: string }[];
  dailyRevenue: { label: string; amount: number }[];
  expenseBreakdown: { category: string; amount: number; percentage: number; color: string }[];
  paymentSplit: { method: string; amount: number; percentage: number; color: string; icon: string }[];
  vatSummary?: VatSummary;
}

const DEFAULT_VAT_SUMMARY: VatSummary = {
  totalGrossSales: 0,
  totalTaxableSales: 0,
  totalOutputVat: 0,
  totalExemptSales: 0,
  vatInvoicesCount: 0,
  exemptInvoicesCount: 0,
  totalInvoicesCount: 0,
  effectiveVatRate: 0,
};

const DEFAULT_PERIOD_DATA: PeriodData = {
  revenue: 0,
  cogs: 0,
  expenses: 0,
  transactions: 0,
  prevRevenue: 0,
  topProducts: [],
  dailyRevenue: [],
  expenseBreakdown: [],
  paymentSplit: [],
  vatSummary: DEFAULT_VAT_SUMMARY,
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  const { data: resData, isLoading, mutate } = useSWR(`/api/reports?period=${period}`, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const { data: ledgerRes, isLoading: isLoadingLedger } = useSWR(
    isLedgerModalOpen ? `/api/reports/vat-ledger?period=${period}` : null,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const data: PeriodData = resData?.report || DEFAULT_PERIOD_DATA;
  const loading = isLoading && !resData;

  const fetchReports = async () => {
    await mutate();
  };

  const financial = calculateFinancialSummary({
    salesInvoiced: data.revenue,
    paymentsCollected: data.revenue,
    cogs: data.cogs,
    operatingExpenses: data.expenses,
  });

  const revenueChange =
    data.prevRevenue > 0
      ? (((data.revenue - data.prevRevenue) / data.prevRevenue) * 100).toFixed(1)
      : "0";
  const isPositiveGrowth = data.revenue >= data.prevRevenue;

  const maxRevenue = Math.max(1, ...data.dailyRevenue.map((d) => d.amount));

  const handleExportVatLedger = () => {
    window.open(`/api/reports/vat-ledger?period=${period}&format=csv`, "_blank");
  };

  const handleExportCSV = () => {
    const vat = data.vatSummary || DEFAULT_VAT_SUMMARY;
    const lines = [
      `"BIZFLOW ETHIOPIA - FINANCIAL & P&L SUMMARY STATEMENT"`,
      `"Reporting Period","${PERIOD_LABELS[period]}"`,
      `"Generated At","${new Date().toISOString()}"`,
      `""`,
      `"METRIC","AMOUNT (ETB)"`,
      `"Gross Sales Invoiced","${data.revenue.toFixed(2)}"`,
      `"Taxable Sales (15% VAT Base)","${vat.totalTaxableSales.toFixed(2)}"`,
      `"15% Output VAT Collected","${vat.totalOutputVat.toFixed(2)}"`,
      `"Tax-Exempt / Non-VAT Sales","${vat.totalExemptSales.toFixed(2)}"`,
      `"Cost of Goods Sold (COGS)","${data.cogs.toFixed(2)}"`,
      `"Estimated Gross Profit","${financial.grossProfit.toFixed(2)}"`,
      `"Gross Margin","${financial.grossMarginPercentage}%"`,
      `"Operating Expenses","${data.expenses.toFixed(2)}"`,
      `"Estimated Net Operating Profit","${financial.netOperatingProfit.toFixed(2)}"`,
      `"Net Margin","${financial.netMarginPercentage}%"`,
      `"Total Transactions Count","${data.transactions}"`,
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizflow-financial-statement-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const avgBasket = data.transactions > 0 ? data.revenue / data.transactions : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-slate-400" />
            Reports & Financial Summary
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gross profit estimates, COGS analysis, Ethiopian MoR 15% VAT register, and exportable statements
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchReports()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Report Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button
            onClick={handleExportVatLedger}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] text-white px-3.5 py-2.5 text-xs font-bold hover:bg-[#00D287] hover:text-slate-900 transition shadow-2xs"
            title="Download Official Ethiopian Ministry of Revenue 15% VAT & Itemized Sales Ledger"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>MoR VAT Ledger (CSV)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Export Profit & Loss Statement"
          >
            <FileText className="h-4 w-4" />
            <span>Export P&L</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#101827] dark:bg-slate-800 border border-transparent dark:border-slate-700 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <Download className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs self-start w-fit">
        {(
          [
            { id: "today", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "quarter", label: "Quarter" },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              period === p.id
                ? "bg-[#101827] dark:bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && data.dailyRevenue.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* 4 Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gross Revenue</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatMoney(financial.totalInvoiced)}
          </p>
          <div className="flex items-center gap-1 text-xs">
            {isPositiveGrowth ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            )}
            <span className={`font-bold ${isPositiveGrowth ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {isPositiveGrowth ? "+" : ""}
              {revenueChange}%
            </span>
            <span className="text-slate-400">vs previous period</span>
          </div>
        </div>

        {/* COGS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cost of Goods Sold</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono tracking-tight">
            {formatMoney(financial.cogs)}
          </p>
          <p className="text-xs text-slate-400">
            {data.revenue > 0 ? ((data.cogs / data.revenue) * 100).toFixed(1) : "0.0"}% of revenue
          </p>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
              Gross Profit{" "}
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1 rounded font-mono">Est.</span>
            </span>
            <div className="p-2 rounded-xl bg-[#DCEFE7] dark:bg-emerald-950/40 text-[#0D9668] dark:text-emerald-400 border border-[#0D9668]/20 dark:border-emerald-800/40">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0D9668] dark:text-emerald-400 font-mono tracking-tight">
            {formatMoney(financial.grossProfit)}
          </p>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {financial.grossMarginPercentage}% gross margin
          </p>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-400">Net Operating Profit</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">
            {formatMoney(financial.netOperatingProfit)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            After -{formatMoney(financial.operatingExpenses)} expenses
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart & Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                Revenue Trend ({PERIOD_LABELS[period]})
              </h2>
              <p className="text-xs text-slate-400">
                {data.transactions} transactions • {formatMoney(avgBasket)} avg basket
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0D9668] dark:text-emerald-400 bg-[#DCEFE7] dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
              Total: {formatMoney(data.revenue)}
            </span>
          </div>

          <div className="pt-4 pb-2">
            {data.dailyRevenue.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                No revenue records logged for this period yet.
              </div>
            ) : (
              <div className="h-48 flex items-end gap-3 sm:gap-4 justify-between px-2">
                {data.dailyRevenue.map((bar) => {
                  const heightPct =
                    maxRevenue > 0
                      ? Math.max(8, Math.round((bar.amount / maxRevenue) * 100))
                      : 8;

                  return (
                    <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatMoney(bar.amount)}
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-36 flex items-end p-1">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-gradient-to-t from-[#101827] to-[#1e293b] group-hover:from-[#0D9668] group-hover:to-[#10b981] rounded-t-md transition-all duration-300 shadow-2xs"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Payment Split (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Payment Methods</h2>
              <p className="text-xs text-slate-400">Revenue by collection channel</p>
            </div>

            {/* Stacked Horizontal Bar */}
            <div className="mt-4 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              {data.paymentSplit.map((pm) => (
                <div
                  key={pm.method}
                  className={`h-full ${pm.color} transition-all duration-300`}
                  style={{ width: `${pm.percentage}%` }}
                />
              ))}
            </div>

            <div className="space-y-3 mt-4">
              {data.paymentSplit.map((pm) => (
                <div key={pm.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${pm.color}`} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pm.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(pm.amount)}</span>
                    <span className="text-slate-400 ml-1.5">({pm.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* P&L Statement & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profit & Loss Statement (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Estimated Profit & Loss Statement</h2>
            <p className="text-xs text-slate-400">
              {PERIOD_LABELS[period]} • Financial Accounting Overview
            </p>
          </div>

          <div className="space-y-0 text-xs">
            <div className="py-3 flex justify-between font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
              <span>Gross Sales Revenue</span>
              <span className="font-mono">{formatMoney(data.revenue)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-600 dark:text-slate-400 pl-4">
              <span>Less: Cost of Goods Sold (COGS)</span>
              <span className="font-mono text-red-600 dark:text-red-400">-{formatMoney(data.cogs)}</span>
            </div>

            <div className="py-3 flex justify-between font-bold text-[#0D9668] dark:text-emerald-400 border-t border-b border-slate-200 dark:border-slate-800 bg-[#DCEFE7]/30 dark:bg-emerald-950/30 px-3 -mx-3 rounded">
              <span>Estimated Gross Profit</span>
              <span className="font-mono">{formatMoney(financial.grossProfit)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-600 dark:text-slate-400 pl-4 mt-2">
              <span>Less: Operating Expenses</span>
              <span className="font-mono text-red-600 dark:text-red-400">-{formatMoney(data.expenses)}</span>
            </div>

            {data.expenseBreakdown.map((exp) => (
              <div
                key={exp.category}
                className="py-1.5 flex justify-between text-slate-400 dark:text-slate-500 pl-8 text-[11px]"
              >
                <span>{exp.category}</span>
                <span className="font-mono">-{formatMoney(exp.amount)}</span>
              </div>
            ))}

            <div className="py-3 flex justify-between font-black text-blue-700 dark:text-blue-400 border-t-2 border-blue-200 dark:border-blue-800 mt-2 text-sm">
              <span>Estimated Net Operating Profit</span>
              <span className="font-mono">{formatMoney(financial.netOperatingProfit)}</span>
            </div>

            <div className="py-2 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Net Margin</span>
              <span className="font-mono font-semibold">{financial.netMarginPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Expense Breakdown</h2>
            <p className="text-xs text-slate-400">
              Total: <span className="font-mono font-bold text-red-600 dark:text-red-400">{formatMoney(data.expenses)}</span>
            </p>
          </div>

          {/* Visual Bars */}
          <div className="space-y-3">
            {data.expenseBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No expenses logged for this period.
              </p>
            ) : (
              data.expenseBreakdown.map((exp) => (
                <div key={exp.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{exp.category}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatMoney(exp.amount)}
                      <span className="text-slate-400 ml-1 font-sans">({exp.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${exp.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(2, exp.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ethiopian MoR 15% VAT & Tax Register Section */}
      {(() => {
        const vat = data.vatSummary || DEFAULT_VAT_SUMMARY;
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span>Ethiopian MoR 15% VAT & Tax Declaration Register</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#0D9668] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Proclamation No. 285/2002
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Official tax reporting metrics and itemized sales register compliant with the Ethiopian Ministry of Revenue (MoR / ገቢዎች ሚኒስቴር).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLedgerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Preview Register ({vat.totalInvoicesCount})</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportVatLedger}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0D9668] hover:bg-[#00D287] text-white hover:text-slate-900 transition shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Ledger CSV</span>
                </button>
              </div>
            </div>

            {/* 4 MoR VAT Metric Tiles */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 15% Taxable Supplies */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>15% Taxable Sales Base</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400">መደበኛ ሽያጭ</span>
                </div>
                <div className="text-lg font-mono font-black text-slate-900 dark:text-white">
                  {formatMoney(vat.totalTaxableSales)}
                </div>
                <div className="text-[11px] text-slate-400">
                  {vat.vatInvoicesCount} invoices subject to 15% VAT
                </div>
              </div>

              {/* 15% Output VAT */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  <span>15% Output VAT Collected</span>
                  <span className="text-[10px] uppercase font-mono text-emerald-700 dark:text-emerald-400">የተሰበሰበ ታክስ</span>
                </div>
                <div className="text-lg font-mono font-black text-[#0D9668] dark:text-emerald-400">
                  {formatMoney(vat.totalOutputVat)}
                </div>
                <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  Payable to Ministry of Revenue (MoR)
                </div>
              </div>

              {/* Tax-Exempt Supplies */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Tax-Exempt / Non-VAT</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400">ከታክስ ነፃ</span>
                </div>
                <div className="text-lg font-mono font-black text-slate-900 dark:text-white">
                  {formatMoney(vat.totalExemptSales)}
                </div>
                <div className="text-[11px] text-slate-400">
                  {vat.exemptInvoicesCount} transactions with 0% VAT
                </div>
              </div>

              {/* Gross Invoiced Sales */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Gross Sales Total</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400">ጠቅላላ ሽያጭ</span>
                </div>
                <div className="text-lg font-mono font-black text-slate-900 dark:text-white">
                  {formatMoney(vat.totalGrossSales)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Effective VAT: {vat.effectiveVatRate.toFixed(1)}% of taxable base
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Top Performing Products Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              Top-Performing Products ({PERIOD_LABELS[period]})
            </h2>
            <p className="text-xs text-slate-400">
              Revenue contribution and estimated margin per product
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {data.topProducts.length} products tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          {data.topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No product sales transactions recorded in this period.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">#</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue (ETB)</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.topProducts.map((p, idx) => {
                  const share =
                    data.revenue > 0 ? ((p.revenue / data.revenue) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={p.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.units}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatMoney(p.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-[#0D9668] rounded-full"
                              style={{ width: `${Math.min(100, Number(share) * 3)}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-600 dark:text-slate-400">{share}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#0D9668] dark:text-emerald-400">
                        {p.margin}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </>
      )}

      {/* MoR VAT Itemized Ledger Inspection Modal */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#0D9668]" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    MoR Sales & 15% VAT Itemized Register ({PERIOD_LABELS[period]})
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Transaction-level ledger for tax auditing and Ministry of Revenue filing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportVatLedger}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0D9668] hover:bg-[#00D287] text-white hover:text-slate-900 transition shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 min-h-[300px]">
              {isLoadingLedger ? (
                <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#0D9668]" />
                  <span className="text-xs font-bold">Loading itemized tax ledger...</span>
                </div>
              ) : !ledgerRes?.ledger || ledgerRes.ledger.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
                  <Receipt className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-bold">No sales transactions recorded in this period.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg">Invoice #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Customer / TIN</th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Taxable (ETB)</th>
                      <th className="py-2.5 px-3 text-right">15% VAT</th>
                      <th className="py-2.5 px-3 text-right">Total (ETB)</th>
                      <th className="py-2.5 px-3 rounded-r-lg">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {ledgerRes.ledger.map((row: any, i: number) => (
                      <tr key={`${row.saleNumber}-${row.productName}-${i}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{row.saleNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] font-sans">{row.date}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{row.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">TIN: {row.customerTin}</div>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{row.productName}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{row.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">{formatMoney(row.taxableAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#0D9668] dark:text-emerald-400">{formatMoney(row.vatAmount)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{formatMoney(row.grossAmount)}</td>
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-500">{row.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Showing {ledgerRes?.ledger?.length || 0} line items</span>
              <button
                type="button"
                onClick={() => setIsLedgerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
