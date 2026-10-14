"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Package,
  CreditCard,
  Calendar,
  Layers,
  Smartphone,
  Banknote,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  formatMoney,
  calculateFinancialSummary,
  calculateStockSeverity,
} from "@/lib/money";

type DateRange = "today" | "7d" | "30d" | "month";

interface RangeMetrics {
  invoiced: number;
  collected: number;
  cogs: number;
  expenses: number;
  salesCount: number;
  chartData: { day: string; amount: number; sales: number }[];
}

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  isOut: boolean;
}

interface PaymentMethodStat {
  method: string;
  amount: number;
  percentage: number;
}

interface TopProduct {
  name: string;
  units: number;
  revenue: number;
  margin: string;
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Live Metrics
  const [metrics, setMetrics] = useState<RangeMetrics>({
    invoiced: 0,
    collected: 0,
    cogs: 0,
    expenses: 0,
    salesCount: 0,
    chartData: [],
  });

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await fetch(`/api/dashboard/metrics?range=${dateRange}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load dashboard data.");
      }

      setMetrics(data.metrics);
      setLowStockItems(data.lowStockItems || []);
      setPaymentMethods(data.paymentMethods || []);
      setTopProducts(data.topProducts || []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const financialSummary = calculateFinancialSummary({
    salesInvoiced: metrics.invoiced,
    paymentsCollected: metrics.collected,
    cogs: metrics.cogs,
    operatingExpenses: metrics.expenses,
  });

  const avgOrderValue = metrics.salesCount > 0 ? metrics.invoiced / metrics.salesCount : 0;
  const maxChartAmount = Math.max(1, ...metrics.chartData.map((d) => d.amount));

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Business Overview
            </h1>
            <span className="text-xs font-bold text-[#0D9668] bg-[#DCEFE7] px-2.5 py-0.5 rounded-full border border-[#0D9668]/20 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0D9668] animate-pulse" />
              Live Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store Currency: <span className="font-semibold text-slate-700">ETB (Ethiopian Birr)</span> • Timezone:{" "}
            <span className="font-mono text-slate-600">Africa/Addis_Ababa (EAT)</span>
          </p>
        </div>

        {/* Date-Range Selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchDashboardData()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {(
              [
                { id: "today", label: "Today" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "month", label: "This Month" },
              ] as const
            ).map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  dateRange === range.id
                    ? "bg-[#101827] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-500" role="status">
          Loading live business data…
        </p>
      )}
      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={fetchDashboardData} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* POS Quick Launcher Strip */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>Database Synced Metrics:</strong> Financial aggregates update instantly with every completed POS terminal sale and operating expense.
          </span>
        </div>
        <Link
          href="/sales/new"
          className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline shrink-0 hidden sm:inline"
        >
          Open POS Terminal →
        </Link>
      </div>

      {/* 2. Four Precise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue & Collected Cash */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Gross Sales Invoiced</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatMoney(financialSummary.totalInvoiced)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Payments Collected:{" "}
              <strong className="text-slate-700 font-mono">
                {formatMoney(financialSummary.paymentsCollected)}
              </strong>
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Uncollected Balance:</span>
            <span
              className={`font-mono font-bold ${
                financialSummary.outstandingBalance > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {formatMoney(financialSummary.outstandingBalance)}
            </span>
          </div>
        </div>

        {/* KPI 2: Gross Profit & COGS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span className="flex items-center gap-1">
                Gross Profit{" "}
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                  Live
                </span>
              </span>
              <div className="p-2 rounded-xl bg-[#DCEFE7] text-[#0D9668] border border-[#0D9668]/20">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-[#0D9668] font-mono tracking-tight">
              {formatMoney(financialSummary.grossProfit)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Recorded COGS:{" "}
              <strong className="text-slate-700 font-mono">
                {formatMoney(financialSummary.cogs)}
              </strong>
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Gross Margin:</span>
            <span className="font-mono font-bold text-[#0D9668]">
              {financialSummary.grossMarginPercentage}% margin
            </span>
          </div>
        </div>

        {/* KPI 3: Sales Completed & Basket Size */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Completed Transactions</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.salesCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Customer checkout orders
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Avg. Basket Value:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatMoney(avgOrderValue)}
            </span>
          </div>
        </div>

        {/* KPI 4: Low Stock Thresholds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Low Stock Qualified</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              {lowStockItems.length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Items at or below reorder threshold
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Out of Stock:</span>
            <span className="font-mono font-bold text-red-600">
              {lowStockItems.filter((i) => i.isOut).length} items
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sales Trend Visual Chart & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Performance Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Sales Performance Trend ({dateRange.toUpperCase()})
              </h2>
              <p className="text-xs text-slate-400">
                Periodic sales volume in Ethiopian Birr
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0D9668] bg-[#DCEFE7] px-2.5 py-1 rounded-lg">
              Total: {formatMoney(financialSummary.totalInvoiced)}
            </span>
          </div>

          {/* Bar Chart */}
          <div className="pt-4 pb-2">
            {metrics.chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                No transactions recorded for this period yet.
              </div>
            ) : (
              <div className="h-48 flex items-end gap-3 sm:gap-6 justify-between px-2">
                {metrics.chartData.map((bar) => {
                  const heightPct =
                    maxChartAmount > 0
                      ? Math.max(8, Math.round((bar.amount / maxChartAmount) * 100))
                      : 8;

                  return (
                    <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatMoney(bar.amount)}
                      </div>
                      <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end p-1">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-[#101827] group-hover:bg-[#0D9668] rounded-t-md transition-all duration-200 shadow-2xs"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        {bar.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Breakdown (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Payment Methods</h2>
              <p className="text-xs text-slate-400">Share of collected customer transactions</p>
            </div>

            <div className="space-y-3.5 pt-3">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No payment records yet for this period.
                </div>
              ) : (
                paymentMethods.map((pm) => {
                  const isTelebirr = pm.method === "TELEBIRR";
                  const isCbe = pm.method === "CBE_BIRR";
                  const isCash = pm.method === "CASH";

                  const colorClass = isTelebirr
                    ? "bg-blue-600"
                    : isCash
                    ? "bg-emerald-600"
                    : isCbe
                    ? "bg-purple-600"
                    : "bg-amber-600";

                  const Icon = isTelebirr
                    ? Smartphone
                    : isCash
                    ? Banknote
                    : isCbe
                    ? CreditCard
                    : Building;

                  return (
                    <div key={pm.method}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-slate-500" />
                          {pm.method}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {pm.percentage}% • {formatMoney(pm.amount)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${colorClass} rounded-full`}
                          style={{ width: `${Math.max(2, pm.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Link
            href="/sales"
            className="pt-3 border-t border-slate-100 text-xs font-bold text-[#0D9668] hover:underline flex items-center justify-between"
          >
            <span>Review payment transaction audit</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Top Performing Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Top-Performing Products</h2>
              <p className="text-xs text-slate-400">By sales volume and contribution</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-[#0D9668] hover:underline flex items-center gap-1"
            >
              All products <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No product sales recorded in this period yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Product</th>
                    <th className="py-2.5 px-3 text-center">Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {topProducts.map((p) => (
                    <tr key={p.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <p className="font-sans font-bold text-slate-900 text-xs">{p.name}</p>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {p.units}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatMoney(p.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#0D9668]">
                        {p.margin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Watch (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Inventory Alerts
                {lowStockItems.length > 0 && <span className="h-2 w-2 rounded-full bg-amber-500" />}
              </h2>
              <p className="text-xs text-slate-400">Products requiring replenishment</p>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-[#0D9668] hover:underline flex items-center gap-1"
            >
              Restock ledger <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 text-emerald-800 text-xs text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All product stock levels are healthy above reorder thresholds!</span>
              </div>
            ) : (
              lowStockItems.slice(0, 5).map((prod) => {
                const status = calculateStockSeverity(prod.stock, prod.reorderLevel);
                return (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        SKU: {prod.sku} • Reorder threshold: {prod.reorderLevel}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${status.badgeClass}`}
                      >
                        {prod.stock} left
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">{status.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
