"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr-fetcher";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Package,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Info,
  ChevronRight,
  RefreshCw,
  Plus,
  Receipt,
  FileSpreadsheet,
  Banknote,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Tag,
  ArrowRight,
  BookOpen,
  Award,
} from "lucide-react";
import {
  formatMoney,
  calculateFinancialSummary,
  calculateStockSeverity,
} from "@/lib/money";
import { formatEatTime } from "@/lib/dashboard-metrics";
import { DashboardSkeleton } from "@/components/ui/skeleton";

type DateRange = "today" | "7d" | "30d" | "month";

interface RangeMetrics {
  invoiced: number;
  collected: number;
  cogs: number;
  expenses: number;
  grossProfit?: number;
  grossMarginPercentage?: number;
  netOperatingProfit?: number;
  netMarginPercentage?: number;
  salesCount: number;
  avgOrderValue?: number;
  creditDebtInRange?: number;
  creditSalesCount?: number;
  totalOutstandingCredit?: number;
  totalCreditCustomers?: number;
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
  count?: number;
}

interface TopProduct {
  name: string;
  units: number;
  revenue: number;
  margin: string;
}

interface RecentTransaction {
  id: string;
  saleNumber: string;
  createdAt: string;
  customerName: string;
  cashierName: string;
  grandTotal: number;
  itemCount: number;
  paymentMethod: string;
  status: string;
}

function getPaymentMethodDetails(method: string) {
  switch (method) {
    case "TELEBIRR":
      return {
        label: "Telebirr (ቴሌብር)",
        colorHex: "#005BAC",
        Icon: Smartphone,
      };
    case "CBE_BIRR":
      return {
        label: "CBE Birr (ሲቢኢ ብር)",
        colorHex: "#702382",
        Icon: CreditCard,
      };
    case "CASH":
      return {
        label: "Cash (ጥሬ ገንዘብ)",
        colorHex: "#0D9668",
        Icon: Banknote,
      };
    case "BANK_TRANSFER":
      return {
        label: "Bank Transfer (ባንክ)",
        colorHex: "#1E293B",
        Icon: Building,
      };
    case "OTHER":
    default:
      return {
        label: "Credit (Idda ዕዳ) / Other",
        colorHex: "#EA580C",
        Icon: BookOpen,
      };
  }
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("today");

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/dashboard/metrics?range=${dateRange}`,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    }
  );
  const { data: sessionData } = useSWR("/api/auth/me", swrFetcher);
  const currency = sessionData?.user?.currency || "ETB";
  const formatStoreMoney = (amount: number) => formatMoney(amount, { currency });

  const metrics: RangeMetrics = data?.metrics || {
    invoiced: 0,
    collected: 0,
    cogs: 0,
    expenses: 0,
    salesCount: 0,
    chartData: [],
  };

  const lowStockItems: LowStockItem[] = data?.lowStockItems || [];
  const paymentMethods: PaymentMethodStat[] = data?.paymentMethods || [];
  const topProducts: TopProduct[] = data?.topProducts || [];
  const recentTransactions: RecentTransaction[] = data?.recentTransactions || [];
  const loading = isLoading && !data;
  const isRefreshing = isValidating;
  const loadError = error ? (error instanceof Error ? error.message : "Unable to load dashboard data.") : "";

  const fetchDashboardData = () => {
    mutate();
  };

  const financialSummary = calculateFinancialSummary({
    salesInvoiced: metrics.invoiced,
    paymentsCollected: metrics.collected,
    cogs: metrics.cogs,
    operatingExpenses: metrics.expenses,
  });

  const avgOrderValue =
    metrics.avgOrderValue !== undefined
      ? metrics.avgOrderValue
      : metrics.salesCount > 0
      ? metrics.invoiced / metrics.salesCount
      : 0;

  const maxChartAmount = Math.max(1, ...metrics.chartData.map((d) => d.amount));
  const isZeroState =
    !loading && !loadError && data?.hasBusinessActivity === false;
  const noActivityInRange =
    !loading &&
    !loadError &&
    data?.hasBusinessActivity === true &&
    metrics.salesCount === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Date Range Filter & Quick Refresh */}
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
            Store Currency: <span className="font-semibold text-slate-700">{currency}</span> • Local Timezone:{" "}
            <span className="font-mono text-slate-600">Africa/Addis_Ababa (EAT)</span>
          </p>
        </div>

        {/* Date-Range Selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition disabled:opacity-50"
            title="Refresh Live Metrics"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#0D9668]" : ""}`}
            />
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
                type="button"
                onClick={() => setDateRange(range.id)}
                aria-pressed={dateRange === range.id}
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

      {/* Quick Action Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/sales/new"
          className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#101827] text-white hover:bg-[#1f2937] transition shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-[#0D9668]">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">New Sale</p>
              <p className="text-[10px] text-slate-400">Launch POS Checkout</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
        </Link>

        <Link
          href="/products"
          className="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 transition shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Add Product</p>
              <p className="text-[10px] text-slate-500">Manage Catalog</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all" />
        </Link>

        <Link
          href="/expenses"
          className="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 transition shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Record Expense</p>
              <p className="text-[10px] text-slate-500">Operating Costs</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all" />
        </Link>

        <Link
          href="/reports"
          className="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 transition shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#0D9668]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">View Reports</p>
              <p className="text-[10px] text-slate-500">Gross & Net P&L</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all" />
        </Link>
      </div>

      {loadError && data && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}
      {noActivityInRange && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          No completed sales in this date range.
        </div>
      )}

      {loadError && !data ? (
        <div
          className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div>
            <p className="font-bold">Dashboard data is unavailable</p>
            <p className="mt-1">{loadError}</p>
            <p className="mt-1 text-xs">
              Metrics are hidden so missing data is not mistaken for zero activity.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="shrink-0 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      ) : loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Zero state for brand new business with no recorded activity */}
          {isZeroState && (
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 p-6 text-slate-800">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-600 text-white shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Welcome to your new BizFlow Ethiopia Store!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    Your business database is fully initialized with zero transaction entries. Start
                    recording your sales, add products, or track initial operating costs to populate your live
                    KPI graphs and financial audit trail.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> 1. Add First Product
                    </Link>
                    <Link
                      href="/sales/new"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> 2. Create First Sale
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Five Precise KPI Cards (Gross Sales, Gross Profit, Customer Credit Idda, Transactions, Low Stock) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* KPI 1: Gross Sales Invoiced */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span>Gross Sales Invoiced</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatStoreMoney(financialSummary.totalInvoiced)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Payments Collected:{" "}
                  <strong className="text-slate-700 font-mono">
                    {formatStoreMoney(financialSummary.paymentsCollected)}
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
                  {formatStoreMoney(financialSummary.outstandingBalance)}
                </span>
              </div>
            </div>

            {/* KPI 2: Gross Profit vs Net Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span className="flex items-center gap-1">
                    Gross Profit
                    <span className="text-[10px] bg-emerald-50 text-[#0D9668] border border-emerald-200/50 px-1.5 py-0.2 rounded font-mono font-semibold">
                      {financialSummary.grossMarginPercentage}%
                    </span>
                  </span>
                  <div className="p-2 rounded-xl bg-[#DCEFE7] text-[#0D9668] border border-[#0D9668]/20">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-[#0D9668] font-mono tracking-tight">
                  {formatStoreMoney(financialSummary.grossProfit)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Product Cost (COGS):{" "}
                  <strong className="text-slate-700 font-mono">
                    {formatStoreMoney(financialSummary.cogs)}
                  </strong>
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Net Operating Profit:</span>
                <span
                  className={`font-mono font-bold ${
                    financialSummary.netOperatingProfit >= 0 ? "text-[#0D9668]" : "text-red-600"
                  }`}
                  title="Gross Profit minus Operating Expenses"
                >
                  {formatStoreMoney(financialSummary.netOperatingProfit)}
                </span>
              </div>
            </div>

            {/* KPI 3: Customer Credit (Idda / ዕዳ) Ledger */}
            <Link
              href="/customers"
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full group hover:border-orange-300 transition"
              title="Click to view customer credit and debt ledger"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span className="group-hover:text-orange-700 transition-colors">
                    Customer Credit (Idda)
                  </span>
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 group-hover:scale-105 transition-transform">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-orange-600 font-mono tracking-tight">
                  {formatStoreMoney(metrics.totalOutstandingCredit ?? 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {metrics.totalCreditCustomers ?? 0} active debtor{" "}
                  {(metrics.totalCreditCustomers ?? 0) === 1 ? "customer" : "customers"}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Period Credit:</span>
                <span className="font-mono font-bold text-slate-700">
                  {formatStoreMoney(metrics.creditDebtInRange ?? 0)}
                  {metrics.creditSalesCount ? ` (${metrics.creditSalesCount})` : ""}
                </span>
              </div>
            </Link>

            {/* KPI 4: Completed Transactions & Basket Size */}
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
                  Customer POS checkouts recorded
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Avg Order Value:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatStoreMoney(avgOrderValue)}
                </span>
              </div>
            </div>

            {/* KPI 5: Inventory Alerts */}
            <Link
              href="/inventory"
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full group hover:border-amber-300 transition"
              title="Click to view restocking ledger"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                  <span className="group-hover:text-amber-700 transition-colors">
                    Inventory Alerts
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-105 transition-transform">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                  {lowStockItems.length}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Items requiring inventory replenishment
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Out of Stock:</span>
                <span className="font-mono font-bold text-red-600">
                  {lowStockItems.filter((i) => i.isOut).length} items
                </span>
              </div>
            </Link>
          </div>

          {/* 3. Sales Trend Visual Chart & Payment Methods Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sales Performance Chart (8 Cols) */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    Sales Trend ({dateRange.toUpperCase()})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Periodic revenue in Ethiopian Birr (Addis Ababa Local Time)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#0D9668] bg-[#DCEFE7] px-2.5 py-1 rounded-lg">
                  Total: {formatStoreMoney(financialSummary.totalInvoiced)}
                </span>
              </div>

              {/* Bar Chart */}
              <div className="pt-4 pb-2">
                {metrics.chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                    No transactions recorded for this period yet.
                  </div>
                ) : (
                  <div className="h-48 flex items-end gap-2 sm:gap-4 justify-between px-2">
                    {metrics.chartData.map((bar) => {
                      const heightPct =
                        bar.amount > 0 && maxChartAmount > 0
                          ? Math.max(8, Math.round((bar.amount / maxChartAmount) * 100))
                          : 0;

                      return (
                        <div
                          key={bar.day}
                          tabIndex={0}
                          aria-label={`${bar.day}: ${formatStoreMoney(bar.amount)} from ${bar.sales} sales`}
                          title={`${formatStoreMoney(bar.amount)} from ${bar.sales} sales`}
                          className="flex-1 flex flex-col items-center gap-2 group rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                        >
                          <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity whitespace-nowrap">
                            {formatStoreMoney(bar.amount)}
                          </div>
                          <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end p-1">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full bg-[#101827] group-hover:bg-[#0D9668] rounded-t-md transition-all duration-200 shadow-2xs"
                            />
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 font-mono truncate max-w-full">
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
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Payment Methods</h2>
                    <p className="text-xs text-slate-400">Share of payments collected in this period</p>
                  </div>
                  {metrics.collected > 0 && (
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {formatStoreMoney(metrics.collected)}
                    </span>
                  )}
                </div>

                <div className="space-y-3 pt-3">
                  {paymentMethods.length === 0 || metrics.collected === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No payment records yet for this period.
                    </div>
                  ) : (
                    paymentMethods.map((pm) => {
                      const meta = getPaymentMethodDetails(pm.method);
                      const Icon = meta.Icon;

                      return (
                        <div key={pm.method} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span
                                className="p-1 rounded-md"
                                style={{ backgroundColor: `${meta.colorHex}15` }}
                              >
                                <Icon className="h-3.5 w-3.5" style={{ color: meta.colorHex }} />
                              </span>
                              <span>{meta.label}</span>
                              {pm.count !== undefined && pm.count > 0 && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({pm.count} txn{pm.count === 1 ? "" : "s"})
                                </span>
                              )}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {pm.percentage}% • {formatStoreMoney(pm.amount)}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.max(2, pm.percentage)}%`,
                                backgroundColor: meta.colorHex,
                              }}
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
                <span>Review sales transaction ledger</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 4. Recent Transactions & Top Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Authorized Transactions Table (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-500" />
                    Recent Transactions
                  </h2>
                  <p className="text-xs text-slate-400">Transactions in the selected date range</p>
                </div>
                <Link
                  href="/sales"
                  className="text-xs font-bold text-[#0D9668] hover:underline flex items-center gap-1"
                >
                  All sales <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No transactions recorded in this date range.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-lg">Invoice #</th>
                        <th className="py-2.5 px-3">Customer / Cashier</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Total ({currency})</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {recentTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900">{tx.saleNumber}</span>
                            <span className="block text-[10px] text-slate-400 font-sans">
                              {formatEatTime(tx.createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                              {tx.customerName}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              By {tx.cashierName} • {tx.itemCount} items
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {formatStoreMoney(tx.grandTotal)}
                          </td>
                          <td className="py-3 px-3 text-right font-sans">
                            <Link
                              href="/sales"
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Top Selling Products Widget (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      Top Selling Products
                    </h2>
                    <p className="text-xs text-slate-400">Ranked by revenue in selected period</p>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs font-bold text-[#0D9668] hover:underline flex items-center gap-1"
                  >
                    Catalog <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="space-y-2.5 pt-2">
                  {topProducts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No product sales recorded in this date range.
                    </div>
                  ) : (
                    topProducts.slice(0, 5).map((prod, idx) => {
                      const rankColor =
                        idx === 0
                          ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                          : idx === 1
                          ? "bg-slate-200 text-slate-800 border-slate-300 font-bold"
                          : idx === 2
                          ? "bg-orange-100 text-orange-800 border-orange-300 font-bold"
                          : "bg-slate-100 text-slate-600 border-slate-200";

                      return (
                        <Link
                          key={prod.name}
                          href={`/products?search=${encodeURIComponent(prod.name)}`}
                          className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 transition flex items-center justify-between gap-3 group block"
                          title={`View ${prod.name} in catalog`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`h-6 w-6 rounded-full border text-[11px] flex items-center justify-center shrink-0 font-mono ${rankColor}`}
                            >
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                {prod.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {prod.units} {prod.units === 1 ? "unit" : "units"} sold
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-mono font-bold text-slate-900">
                              {formatStoreMoney(prod.revenue)}
                            </p>
                            <span className="inline-block text-[10px] bg-emerald-50 text-[#0D9668] border border-emerald-200/60 px-1.5 py-0.2 rounded font-mono font-semibold">
                              {prod.margin} margin
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              <Link
                href="/reports"
                className="pt-3 border-t border-slate-100 text-xs font-bold text-[#0D9668] hover:underline flex items-center justify-between"
              >
                <span>Product sales & profit reports</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 5. Inventory Restock Watchlist (12 Cols) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Inventory Alerts
                  {lowStockItems.length > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {lowStockItems.length} items to reorder
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Products at or below reorder threshold requiring replenishment
                </p>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-bold text-[#0D9668] hover:underline flex items-center gap-1"
              >
                Restock ledger <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 text-emerald-800 text-xs text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All catalog product inventory levels are healthy above reorder thresholds!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.slice(0, 6).map((prod) => {
                  const status = calculateStockSeverity(prod.stock, prod.reorderLevel);
                  return (
                    <Link
                      key={prod.id}
                      href={`/products?search=${encodeURIComponent(prod.name)}`}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 transition flex items-center justify-between gap-2 group block"
                      title={`Manage ${prod.name} in product catalog`}
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          SKU: {prod.sku} • Threshold: {prod.reorderLevel}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${status.badgeClass}`}
                        >
                          {prod.stock} left
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5 font-medium">
                          {status.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
