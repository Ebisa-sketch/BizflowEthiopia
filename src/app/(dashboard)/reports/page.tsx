"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { formatMoney, calculateGrossProfit, calculateFinancialSummary } from "@/lib/money";

type ReportPeriod = "today" | "week" | "month" | "quarter";

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
}

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
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [data, setData] = useState<PeriodData>(DEFAULT_PERIOD_DATA);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        if (json.report) {
          setData(json.report);
        }
      }
    } catch {
      // Retain existing state on fetch error
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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

  const handleExportCSV = () => {
    const csvHeaders = "Date,Revenue,COGS,Gross Profit,Expenses,Net Profit\n";
    const csvRow = `${PERIOD_LABELS[period]},${data.revenue},${data.cogs},${financial.grossProfit},${data.expenses},${financial.netOperatingProfit}\n`;
    const blob = new Blob([csvHeaders + csvRow], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizflow-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const avgBasket = data.transactions > 0 ? data.revenue / data.transactions : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-slate-400" />
            Reports & Financial Summary
          </h1>
          <p className="text-sm text-slate-500">
            Gross profit estimates, COGS analysis, expense breakdown, and exportable statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReports()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Report Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#101827] px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start w-fit">
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
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              period === p.id
                ? "bg-[#101827] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gross Revenue</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatMoney(financial.totalInvoiced)}
          </p>
          <div className="flex items-center gap-1 text-xs">
            {isPositiveGrowth ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
            )}
            <span className={`font-bold ${isPositiveGrowth ? "text-emerald-600" : "text-red-600"}`}>
              {isPositiveGrowth ? "+" : ""}
              {revenueChange}%
            </span>
            <span className="text-slate-400">vs previous period</span>
          </div>
        </div>

        {/* COGS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cost of Goods Sold</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 font-mono tracking-tight">
            {formatMoney(financial.cogs)}
          </p>
          <p className="text-xs text-slate-400">
            {data.revenue > 0 ? ((data.cogs / data.revenue) * 100).toFixed(1) : "0.0"}% of revenue
          </p>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
              Gross Profit{" "}
              <span className="text-[10px] bg-emerald-100 px-1 rounded font-mono">Est.</span>
            </span>
            <div className="p-2 rounded-xl bg-[#DCEFE7] text-[#0D9668] border border-[#0D9668]/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0D9668] font-mono tracking-tight">
            {formatMoney(financial.grossProfit)}
          </p>
          <p className="text-xs font-semibold text-emerald-700">
            {financial.grossMarginPercentage}% gross margin
          </p>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Net Operating Profit</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 font-mono tracking-tight">
            {formatMoney(financial.netOperatingProfit)}
          </p>
          <p className="text-xs text-slate-500">
            After -{formatMoney(financial.operatingExpenses)} expenses
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart & Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Revenue Trend ({PERIOD_LABELS[period]})
              </h2>
              <p className="text-xs text-slate-400">
                {data.transactions} transactions • {formatMoney(avgBasket)} avg basket
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0D9668] bg-[#DCEFE7] px-2.5 py-1 rounded-lg">
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
                      <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end p-1">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-gradient-to-t from-[#101827] to-[#1e293b] group-hover:from-[#0D9668] group-hover:to-[#10b981] rounded-t-md transition-all duration-300 shadow-2xs"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
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
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Payment Methods</h2>
              <p className="text-xs text-slate-400">Revenue by collection channel</p>
            </div>

            {/* Stacked Horizontal Bar */}
            <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden flex">
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
                    <span className="font-semibold text-slate-700">{pm.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">{formatMoney(pm.amount)}</span>
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
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Estimated Profit & Loss Statement</h2>
            <p className="text-xs text-slate-400">
              {PERIOD_LABELS[period]} • Financial Accounting Overview
            </p>
          </div>

          <div className="space-y-0 text-xs">
            <div className="py-3 flex justify-between font-bold text-slate-900 border-b border-slate-100">
              <span>Gross Sales Revenue</span>
              <span className="font-mono">{formatMoney(data.revenue)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-600 pl-4">
              <span>Less: Cost of Goods Sold (COGS)</span>
              <span className="font-mono text-red-600">-{formatMoney(data.cogs)}</span>
            </div>

            <div className="py-3 flex justify-between font-bold text-[#0D9668] border-t border-b border-slate-200 bg-[#DCEFE7]/30 px-3 -mx-3 rounded">
              <span>Estimated Gross Profit</span>
              <span className="font-mono">{formatMoney(financial.grossProfit)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-600 pl-4 mt-2">
              <span>Less: Operating Expenses</span>
              <span className="font-mono text-red-600">-{formatMoney(data.expenses)}</span>
            </div>

            {data.expenseBreakdown.map((exp) => (
              <div
                key={exp.category}
                className="py-1.5 flex justify-between text-slate-400 pl-8 text-[11px]"
              >
                <span>{exp.category}</span>
                <span className="font-mono">-{formatMoney(exp.amount)}</span>
              </div>
            ))}

            <div className="py-3 flex justify-between font-black text-blue-700 border-t-2 border-blue-200 mt-2 text-sm">
              <span>Estimated Net Operating Profit</span>
              <span className="font-mono">{formatMoney(financial.netOperatingProfit)}</span>
            </div>

            <div className="py-2 flex justify-between text-[11px] text-slate-400">
              <span>Net Margin</span>
              <span className="font-mono font-semibold">{financial.netMarginPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Expense Breakdown</h2>
            <p className="text-xs text-slate-400">
              Total: <span className="font-mono font-bold text-red-600">{formatMoney(data.expenses)}</span>
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
                    <span className="font-semibold text-slate-700">{exp.category}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatMoney(exp.amount)}
                      <span className="text-slate-400 ml-1 font-sans">({exp.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
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

      {/* Top Performing Products Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
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
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">#</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue (ETB)</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.topProducts.map((p, idx) => {
                  const share =
                    data.revenue > 0 ? ((p.revenue / data.revenue) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={p.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {p.units}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(p.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-[#0D9668] rounded-full"
                              style={{ width: `${Math.min(100, Number(share) * 3)}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-600">{share}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#0D9668]">
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
    </div>
  );
}
