"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr-fetcher";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock,
  Printer,
  Banknote,
  RefreshCw,
  Lightbulb,
  CreditCard,
  Users,
  Layers,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Sun,
  Droplet,
  Box,
  Receipt,
  Plus,
  Zap,
  PackagePlus,
  BarChart3,
} from "lucide-react";
import { formatMoney, calculateFinancialSummary } from "@/lib/money";
import { formatEatTime } from "@/lib/dashboard-metrics";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { DailyZReportModal } from "@/components/dashboard/daily-z-report-modal";
import { CashDrawerReconciliationModal } from "@/components/dashboard/cash-drawer-reconciliation-modal";

type DateRange = "today" | "7d" | "30d" | "month";

interface RangeMetrics {
  invoiced: number;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
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
  cashCollected?: number;
  cashSalesCount?: number;
  digitalCollected?: number;
  expectedCashInTill?: number;
  chartData: { day: string; amount: number; profit?: number; sales: number }[];
  comparisons?: {
    sales: { changePercent: number; text: string; direction: "up" | "down" | "neutral" };
    grossProfit: { changePercent: number; text: string; direction: "up" | "down" | "neutral" };
    transactions: { changePercent: number; text: string; direction: "up" | "down" | "neutral" };
    label: string;
  };
}

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  isOut: boolean;
}

interface RecentTransaction {
  id: string;
  saleNumber: string;
  createdAt: string;
  customerName: string;
  cashierName: string;
  grandTotal: number;
  itemCount: number;
  productsSummary?: string;
  paymentMethod: string;
  status: string;
}

interface QuickStats {
  totalProducts: number;
  totalCustomers: number;
  totalStockValue: number;
  totalExpensesMonth: number;
}

interface BusinessInsights {
  topProduct: {
    name: string;
    units: number;
    revenue: number;
  } | null;
  slowMovingProduct: {
    name: string;
    units: number;
    days: number;
  } | null;
  expenseTrendText: string;
}

function renderSparkline(values: number[], strokeColor: string, id: string = "spark") {
  if (!values || values.length === 0) return null;

  // Ensure sufficient points for a smooth curve
  let data = values;
  if (data.length === 1) data = [data[0], data[0], data[0]];
  if (data.length === 2) data = [data[0], (data[0] + data[1]) / 2, data[1]];

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 84;
  const height = 28;
  const padX = 2;
  const padY = 4;

  const points = data.map((val, idx) => {
    const x = data.length > 1 ? padX + (idx / (data.length - 1)) * (width - padX * 2) : width / 2;
    const y = padY + (1 - (val - min) / range) * (height - padY * 2);
    return { x, y };
  });

  // Calculate smooth cubic Catmull-Rom to Bézier spline
  let linePath = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L ${last.x.toFixed(1)},${height} L ${first.x.toFixed(1)},${height} Z`;
  const gradId = `spark-grad-${id}`;

  return (
    <svg className="w-22 h-7 overflow-visible shrink-0" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderComparisonBadge(
  comparison?: { text: string; direction: "up" | "down" | "neutral" },
  label?: string
) {
  const dir = comparison?.direction || "neutral";
  const text = comparison?.text || "0%";
  const compLabel = label || "vs. prev period";

  if (dir === "up") {
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="text-[#0D9668] font-bold">↗ {text}</span>
        <span className="text-slate-400">{compLabel}</span>
      </div>
    );
  }
  if (dir === "down") {
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="text-red-500 font-bold">↘ {text}</span>
        <span className="text-slate-400">{compLabel}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-slate-500 font-semibold">— {text}</span>
      <span className="text-slate-400">{compLabel}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<number | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every minute for live Addis Ababa time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/dashboard/metrics?range=${dateRange}`,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    }
  );

  const { data: sessionData } = useSWR("/api/auth/me", swrFetcher);
  const { data: businessData } = useSWR("/api/businesses/current", swrFetcher);

  const business = businessData?.settings;
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
  const recentTransactions: RecentTransaction[] = data?.recentTransactions || [];
  const quickStats: QuickStats = data?.quickStats || {
    totalProducts: 0,
    totalCustomers: 0,
    totalStockValue: 0,
    totalExpensesMonth: 0,
  };
  const businessInsights: BusinessInsights = data?.businessInsights || {
    topProduct: null,
    slowMovingProduct: null,
    expenseTrendText: "No operating expenses recorded",
  };

  const loading = isLoading && !data;
  const isRefreshing = isValidating;
  const loadError = error
    ? error instanceof Error
      ? error.message
      : "Unable to load dashboard data."
    : "";

  const financialSummary = calculateFinancialSummary({
    salesInvoiced: metrics.invoiced,
    paymentsCollected: metrics.collected,
    cogs: metrics.cogs,
    operatingExpenses: metrics.expenses,
  });

  // Calculate dynamic Addis Ababa Date, Time, and Greeting
  const ethiopiaDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(currentTime);

  const ethiopiaTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(currentTime);

  const ethiopiaHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Addis_Ababa",
      hour: "numeric",
      hour12: false,
    }).format(currentTime)
  );

  const greeting =
    ethiopiaHour < 12
      ? "Good morning"
      : ethiopiaHour < 17
      ? "Good afternoon"
      : "Good evening";

  // Resolve logged-in account name dynamically without hardcoding "Manager"
  const accountUser = sessionData?.user;
  const rawAccountName =
    accountUser?.name ||
    (accountUser?.email ? accountUser.email.split("@")[0] : "") ||
    business?.ownerName ||
    "";

  const accountDisplayName = rawAccountName
    ? rawAccountName.trim().split(" ")[0]
    : "there";

  const accountRole = accountUser?.role
    ? accountUser.role.charAt(0).toUpperCase() + accountUser.role.slice(1).toLowerCase()
    : "";

  // True business figures directly from current tenant scope
  const displayGrossSales = metrics.invoiced;
  const displayGrossProfit = financialSummary.grossProfit;
  const displayTransactions = metrics.salesCount;
  const displayLowStock = lowStockItems.length;

  const displayLowStockList = lowStockItems.slice(0, 4);
  const displayTransactionsList = recentTransactions.slice(0, 6);

  // Sparkline data series
  const salesSparklinePoints = (metrics.chartData || []).map((d) => d.amount);
  const profitSparklinePoints = (metrics.chartData || []).map((d) => d.profit || 0);
  const txSparklinePoints = (metrics.chartData || []).map((d) => d.sales);
  const stockSparklinePoints = lowStockItems.length > 0 
    ? [lowStockItems.length + 3, lowStockItems.length + 2, lowStockItems.length + 1, lowStockItems.length + 2, lowStockItems.length + 1, lowStockItems.length]
    : [2, 1, 1, 0, 0, 0];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Greeting on Left, Date/Time & Business Status on Right */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xs shrink-0">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {greeting}, {accountDisplayName}!
                </h1>
                {accountRole && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0D9668] border border-emerald-200/60 dark:border-emerald-800/60 tracking-wider">
                    {accountRole}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{ethiopiaDate}</span>
                <span>•</span>
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{ethiopiaTime} Addis Ababa</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Business Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 text-[#0D9668] text-xs font-semibold shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#0D9668] animate-pulse" />
              <span>{business?.status === "ACTIVE" || !business ? "Business Open" : business.status}</span>
            </div>

            {/* Operational actions: Cash Drawer */}
            <button
              type="button"
              onClick={() => setIsReconciliationOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Open Cash Drawer Reconciliation"
            >
              <Banknote className="h-3.5 w-3.5 text-[#0D9668]" />
              <span>Cash Drawer</span>
              {countedCash !== undefined ? (
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Reconciled
                </span>
              ) : metrics.expectedCashInTill !== undefined && metrics.expectedCashInTill > 0 ? (
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                  {formatStoreMoney(metrics.expectedCashInTill)}
                </span>
              ) : null}
            </button>

            {/* Daily Z-Report Button */}
            <button
              type="button"
              onClick={() => setIsZReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#071924] dark:bg-slate-700 hover:bg-[#0c283a] dark:hover:bg-slate-600 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Generate Daily Z-Report"
            >
              <Printer className="h-3.5 w-3.5 text-[#00D287]" />
              <span>Z-Report</span>
            </button>

            {/* Refresh Live Metrics */}
            <button
              type="button"
              onClick={() => mutate()}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Refresh Live Metrics"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#0D9668]" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Unified Date-Range Controls & Filter Scope Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-850 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Overview Period:
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {dateRange === "today"
                ? "Today (00:00 – Present EAT)"
                : dateRange === "7d"
                ? "Last 7 Days"
                : dateRange === "30d"
                ? "Last 30 Days"
                : "This Calendar Month"}
            </span>
          </div>

          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDateRange("today")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateRange === "today"
                  ? "bg-[#071924] dark:bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRange("7d")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateRange === "7d"
                  ? "bg-[#071924] dark:bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange("30d")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateRange === "30d"
                  ? "bg-[#071924] dark:bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange("month")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateRange === "month"
                  ? "bg-[#071924] dark:bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              This Month
            </button>
          </div>
        </div>
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
            onClick={() => mutate()}
            className="font-semibold underline hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        /* 2-Column Dashboard Grid: Main Left Content (~75%) + Right Action Sidebar (~25%) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Left Content Area (9 Columns on XL, 8 Columns on LG) */}
          <div className="xl:col-span-9 lg:col-span-8 space-y-6">
            {/* Top 4 KPI Cards with Real Data, Profit Margin Pill, & Smooth Gradient Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Gross Sales */}
              <Link
                href="/sales"
                className="group bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-650 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00A86B] dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">Gross Sales</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500 transition" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
                      {currency}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                      {formatMoney(displayGrossSales, { currency, showSymbol: false })}
                    </h3>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  {renderComparisonBadge(metrics.comparisons?.sales, metrics.comparisons?.label)}
                  {renderSparkline(salesSparklinePoints, "#00A86B", "sales")}
                </div>
              </Link>

              {/* Card 2: Gross Profit */}
              <Link
                href="/reports"
                className="group bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-650 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/50 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">Gross Profit</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500 transition" />
                  </div>
                  <div className="flex items-baseline justify-between gap-1.5 mt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
                        {currency}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                        {formatMoney(displayGrossProfit, { currency, showSymbol: false })}
                      </h3>
                    </div>
                    {displayGrossSales > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                        {((displayGrossProfit / displayGrossSales) * 100).toFixed(0)}% Margin
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  {renderComparisonBadge(metrics.comparisons?.grossProfit, metrics.comparisons?.label)}
                  {renderSparkline(profitSparklinePoints, "#2563EB", "profit")}
                </div>
              </Link>

              {/* Card 3: Completed Transactions */}
              <Link
                href="/sales"
                className="group bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-650 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100/80 dark:border-purple-800/50 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">Completed Transactions</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500 transition" />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                      {displayTransactions}
                    </h3>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  {renderComparisonBadge(metrics.comparisons?.transactions, metrics.comparisons?.label)}
                  {renderSparkline(txSparklinePoints, "#9333EA", "tx")}
                </div>
              </Link>

              {/* Card 4: Low Stock Items */}
              <Link
                href="/inventory"
                className="group bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-650 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">Low Stock Items</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500 transition" />
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                      {displayLowStock}
                    </h3>
                    {displayLowStock > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                        Action Needed
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-xs">
                    {displayLowStock > 0 ? (
                      <>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {lowStockItems.filter((i) => i.isOut || i.stock <= 0).length > 0
                            ? "Out of stock"
                            : "Reorder required"}
                        </span>
                        <span className="text-slate-400">• Review</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#00A86B] font-bold">✓ Healthy</span>
                        <span className="text-slate-400">• Optimal</span>
                      </>
                    )}
                  </div>
                  {renderSparkline(stockSparklinePoints, "#F59E0B", "stock")}
                </div>
              </Link>
            </div>

            {/* Secondary Financial Metrics Strip */}
            {(financialSummary.paymentsCollected > 0 || financialSummary.cogs > 0 || financialSummary.outstandingBalance > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Payments Collected */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 shadow-2xs">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                    <Banknote className="h-4 w-4 text-[#00A86B]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Payments Collected</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                      {formatStoreMoney(financialSummary.paymentsCollected)}
                    </p>
                  </div>
                </div>

                {/* Cost of Goods Sold */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 shadow-2xs">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cost of Goods Sold</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                      {formatStoreMoney(financialSummary.cogs)}
                    </p>
                  </div>
                </div>

                {/* Outstanding Credit */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 shadow-2xs">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                    <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Outstanding Credit</p>
                    <p className={`text-sm font-bold font-mono tracking-tight ${
                      financialSummary.outstandingBalance > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-900 dark:text-slate-100"
                    }`}>
                      {formatStoreMoney(financialSummary.outstandingBalance)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Middle Row: Sales Trend (7 Cols) & Inventory Alerts (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Sales Trend Chart (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col">
                <SalesTrendChart
                  data={metrics.chartData}
                  dateRange={dateRange}
                  onRangeChange={(r) => setDateRange(r)}
                  currency={currency}
                  totalInvoiced={metrics.invoiced}
                />
              </div>

              {/* Inventory Alerts Card (5 Cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                        <Package className="h-4 w-4" />
                      </div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Inventory Alerts
                      </h2>
                    </div>
                    <Link
                      href="/inventory"
                      className="text-xs font-semibold text-[#0D9668] hover:underline flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="pt-2">
                    {displayLowStockList.length === 0 ? (
                      <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Inventory Levels Healthy
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                          All products currently meet or exceed their restock thresholds.
                        </p>
                        <Link
                          href="/inventory"
                          className="mt-3 text-xs font-semibold text-[#0D9668] hover:underline"
                        >
                          Review restock catalog →
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayLowStockList.map((item) => (
                          <Link
                            key={item.id}
                            href="/inventory"
                            className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition px-1.5 rounded-xl group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Item Thumbnail Icon */}
                              <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-750 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                                {item.name.toLowerCase().includes("oil") ? (
                                  <Droplet className="h-4 w-4 text-amber-500" />
                                ) : item.name.toLowerCase().includes("cola") ? (
                                  <Package className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Box className="h-4 w-4 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#0D9668] transition">
                                  {item.name}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {item.isOut || item.stock <= 0 ? (
                                    <span className="text-red-500 font-semibold">
                                      Out of stock
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-amber-600 font-semibold">
                                        {item.stock} left
                                      </span>{" "}
                                      • Threshold ({item.reorderLevel})
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${
                                item.isOut || item.stock <= 0
                                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-800/60"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-800/60"
                              }`}
                            >
                              {item.isOut || item.stock <= 0 ? "Out of Stock" : "Low Stock"}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href="/inventory"
                    className="text-xs font-bold text-[#0D9668] hover:underline flex items-center justify-between"
                  >
                    <span>Manage Restock Catalog</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Transactions Full Table */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Recent Transactions
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Live store checkouts for {dateRange === "today" ? "today" : `selected ${dateRange} period`}
                    </p>
                  </div>
                </div>
                <Link
                  href="/sales"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>View All Sales</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {displayTransactionsList.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-2.5">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No transactions recorded for this period
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                    Sales processed through the POS terminal will appear here automatically.
                  </p>
                  <Link
                    href="/sales/new"
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D9668] text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Start New Sale (POS)
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-lg">#</th>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Product(s)</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Payment Method</th>
                        <th className="py-2.5 px-3">Total</th>
                        <th className="py-2.5 px-3 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayTransactionsList.map((tx, idx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {idx + 1}. #{tx.saleNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {formatEatTime(tx.createdAt)}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate">
                            {tx.productsSummary || "Store Goods"}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                            {tx.customerName}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {tx.paymentMethod === "TELEBIRR"
                              ? "Telebirr"
                              : tx.paymentMethod === "CBE_BIRR"
                              ? "CBE Birr"
                              : tx.paymentMethod === "BANK_TRANSFER"
                              ? "Bank Transfer"
                              : tx.paymentMethod === "OTHER"
                              ? "Credit (Idda)"
                              : "Cash"}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatStoreMoney(tx.grandTotal)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Sidebar Panel (3 Columns on XL, 4 Columns on LG) */}
          <div className="xl:col-span-3 lg:col-span-4 space-y-4">
            {/* Top 4 Action Buttons - Exact Match with Reference Design */}
            <div className="space-y-2.5">
              {/* Button 1: New Sale (POS) Primary Button */}
              <Link
                href="/sales/new"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#00A86B] hover:bg-[#00965f] text-white shadow-xs transition shadow-[#00A86B]/20"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 text-white">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold">New Sale (POS)</span>
                </div>
                <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Button 2: + Add Product */}
              <Link
                href="/products?action=new"
                className="group flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650 hover:bg-slate-50/70 transition shadow-2xs"
              >
                <div className="h-7 w-7 rounded-full bg-[#00A86B] text-white flex items-center justify-center font-bold text-base leading-none shrink-0 group-hover:scale-105 transition-transform">
                  +
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Add Product
                </span>
              </Link>

              {/* Button 3: Record Expense */}
              <Link
                href="/expenses?action=new"
                className="group flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650 hover:bg-slate-50/70 transition shadow-2xs"
              >
                <div className="h-7 w-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Record Expense
                </span>
              </Link>

              {/* Button 4: View Reports */}
              <Link
                href="/reports"
                className="group flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650 hover:bg-slate-50/70 transition shadow-2xs"
              >
                <div className="h-7 w-7 rounded-lg text-[#00A86B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  View Reports
                </span>
              </Link>
            </div>

            {/* Business Insights Card */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Business Insights
                </h3>
              </div>

              <div className="space-y-4">
                {/* Insight 1: Top Selling Product */}
                <div>
                  <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                    Top Selling Product
                  </p>
                  {businessInsights.topProduct ? (
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {businessInsights.topProduct.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {businessInsights.topProduct.units} units •{" "}
                          {formatStoreMoney(businessInsights.topProduct.revenue)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No sales recorded yet</p>
                  )}
                </div>

                {/* Insight 2: Slow Moving Stock */}
                <div>
                  <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                    Slow Moving Stock
                  </p>
                  {businessInsights.slowMovingProduct ? (
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {businessInsights.slowMovingProduct.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          0 units sold in current period
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Inventory moving consistently</p>
                  )}
                </div>

                {/* Insight 3: Expense Trend */}
                <div>
                  <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                    Expense Trend
                  </p>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingDown className="h-4 w-4 text-[#0D9668] shrink-0" />
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                        {businessInsights.expenseTrendText}
                      </p>
                    </div>
                    <span className="shrink-0 p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[#0D9668]">
                      <ArrowRight className="h-3 w-3 rotate-45" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/reports"
                  className="text-xs font-semibold text-[#0D9668] hover:underline flex items-center gap-1"
                >
                  <span>Detailed Financial Reports</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Quick Stats</h3>
              </div>

              <div className="space-y-2.5">
                {/* Total Products */}
                <Link
                  href="/products"
                  className="flex items-center justify-between py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <span>Total Products</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 font-mono">
                    <span>{quickStats.totalProducts}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Total Customers */}
                <Link
                  href="/customers"
                  className="flex items-center justify-between py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <span>Total Customers</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 font-mono">
                    <span>{quickStats.totalCustomers}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Total Stock Value */}
                <Link
                  href="/inventory"
                  className="flex items-center justify-between py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Layers className="h-3.5 w-3.5" />
                    </div>
                    <span>Total Stock Value</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 font-mono">
                    <span>{formatStoreMoney(quickStats.totalStockValue)}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Total Expenses (This Month) */}
                <Link
                  href="/expenses"
                  className="flex items-center justify-between py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <CreditCard className="h-3.5 w-3.5" />
                    </div>
                    <span>Total Expenses (Period)</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100 font-mono">
                    <span>{formatStoreMoney(quickStats.totalExpensesMonth)}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Z-Report Modal */}
      <DailyZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        data={{
          businessName: business?.name || sessionData?.user?.businessName || "BizFlow Store",
          tinNumber: business?.tinNumber || undefined,
          phone: business?.phone || undefined,
          address: business?.address || undefined,
          currency,
          dateRange: dateRange.toUpperCase(),
          operatorName: sessionData?.user?.name || "Store Cashier",
          invoiced: financialSummary.totalInvoiced,
          subtotal: metrics.subtotal || financialSummary.totalInvoiced,
          discountTotal: metrics.discountTotal || 0,
          taxTotal: metrics.taxTotal || 0,
          cogs: financialSummary.cogs,
          grossProfit: financialSummary.grossProfit,
          grossMarginPercentage: financialSummary.grossMarginPercentage,
          expenses: financialSummary.operatingExpenses,
          netOperatingProfit: financialSummary.netOperatingProfit,
          salesCount: metrics.salesCount,
          avgOrderValue: metrics.salesCount > 0 ? metrics.invoiced / metrics.salesCount : 0,
          cashCollected: metrics.cashCollected ?? 0,
          cashSalesCount: metrics.cashSalesCount ?? 0,
          digitalCollected: metrics.digitalCollected ?? 0,
          expectedCashInTill: metrics.expectedCashInTill ?? metrics.cashCollected ?? 0,
          paymentMethods: [],
          countedCash,
        }}
      />

      {/* Cash Drawer Reconciliation Modal */}
      <CashDrawerReconciliationModal
        isOpen={isReconciliationOpen}
        onClose={() => setIsReconciliationOpen(false)}
        currency={currency}
        cashCollected={metrics.cashCollected ?? 0}
        cashSalesCount={metrics.cashSalesCount ?? 0}
        expenses={financialSummary.operatingExpenses}
        expectedCashInTill={metrics.expectedCashInTill ?? metrics.cashCollected ?? 0}
        onGenerateZReport={(counted) => {
          setCountedCash(counted);
          setIsZReportOpen(true);
        }}
      />
    </div>
  );
}
