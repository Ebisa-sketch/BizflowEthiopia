"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Banknote,
  Smartphone,
  Building,
  CreditCard,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";

type ReportPeriod = "today" | "week" | "month" | "quarter";

interface PaymentMethod {
  method: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface ReportData {
  revenue: number;
  transactions: number;
  prevRevenue: number;
  paymentSplit: PaymentMethod[];
  dailyRevenue: { label: string; amount: number }[];
}

const DEFAULT_DATA: ReportData = {
  revenue: 0,
  transactions: 0,
  prevRevenue: 0,
  paymentSplit: [],
  dailyRevenue: [],
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  Telebirr: <Smartphone className="h-5 w-5" />,
  Cash: <Banknote className="h-5 w-5" />,
  "CBE Birr": <CreditCard className="h-5 w-5" />,
  "Bank Transfer": <Building className="h-5 w-5" />,
};

const METHOD_RING: Record<string, string> = {
  Telebirr: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  Cash: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  "CBE Birr": "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  "Bank Transfer": "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
};

export default function PaymentsTillPage() {
  const [period, setPeriod] = useState<ReportPeriod>("today");

  const swrKey = `/api/reports?period=${period}`;
  const { data: resData, error, isLoading, mutate } = useSWR(swrKey, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const data: ReportData = resData?.report
    ? {
        revenue: resData.report.revenue,
        transactions: resData.report.transactions,
        prevRevenue: resData.report.prevRevenue,
        paymentSplit: resData.report.paymentSplit || [],
        dailyRevenue: resData.report.dailyRevenue || [],
      }
    : DEFAULT_DATA;

  const loading = isLoading && !resData;

  const revenueChange =
    data.prevRevenue > 0
      ? (((data.revenue - data.prevRevenue) / data.prevRevenue) * 100).toFixed(1)
      : "0";
  const isGrowth = data.revenue >= data.prevRevenue;
  const avgBasket = data.transactions > 0 ? data.revenue / data.transactions : 0;
  const maxRevenue = Math.max(1, ...data.dailyRevenue.map((d) => d.amount));

  // Top payment method
  const topMethod = useMemo(
    () =>
      data.paymentSplit.length > 0
        ? data.paymentSplit.reduce((a, b) => (a.amount > b.amount ? a : b))
        : null,
    [data.paymentSplit]
  );

  return (
    <div className="space-y-6">
      <DataLoadError error={error} onRetry={() => mutate()} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Banknote className="h-6 w-6 text-slate-400" />
            Payments &amp; Till
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cash, Telebirr, CBE Birr, and bank payment collection breakdown by period
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
        {(["today", "week", "month", "quarter"] as ReportPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              period === p
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Collected */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Collected ({PERIOD_LABELS[period]})
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {formatMoney(data.revenue)}
              </p>
              <div className="flex items-center gap-1 text-xs">
                {isGrowth ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                )}
                <span className={`font-bold ${isGrowth ? "text-emerald-600" : "text-red-600"}`}>
                  {isGrowth ? "+" : ""}
                  {revenueChange}%
                </span>
                <span className="text-slate-400">vs previous period</span>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Transactions</span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                  <ShoppingCart className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {data.transactions}
              </p>
              <p className="text-xs text-slate-400">
                Avg basket:{" "}
                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                  {formatMoney(avgBasket)}
                </span>
              </p>
            </div>

            {/* Top Method */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Payment Method</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {topMethod ? topMethod.method : "—"}
              </p>
              <p className="text-xs text-slate-400">
                {topMethod ? (
                  <>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      {formatMoney(topMethod.amount)}
                    </span>{" "}
                    ({topMethod.percentage}% of revenue)
                  </>
                ) : (
                  "No transactions yet"
                )}
              </p>
            </div>
          </div>

          {/* Payment Method Breakdown + Revenue Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Payment Method Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Collection by Payment Channel
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {PERIOD_LABELS[period]} breakdown
                  </p>
                </div>

                {/* Stacked bar */}
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex mb-4">
                  {data.paymentSplit.map((pm) => (
                    <div
                      key={pm.method}
                      className={`h-full ${pm.color} transition-all duration-500`}
                      style={{ width: `${pm.percentage}%` }}
                    />
                  ))}
                </div>

                {data.paymentSplit.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No payment transactions recorded for this period.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.paymentSplit.map((pm) => (
                      <div
                        key={pm.method}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition"
                      >
                        <div
                          className={`p-2 rounded-xl ${
                            METHOD_RING[pm.method] || "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {METHOD_ICONS[pm.method] || <CreditCard className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {pm.method}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {formatMoney(pm.amount)}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full ${pm.color} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.max(2, pm.percentage)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-slate-400">{pm.percentage}% of total</span>
                            {pm.amount > 0 && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Revenue Trend ({PERIOD_LABELS[period]})
                  </h2>
                  <p className="text-xs text-slate-400">
                    {data.transactions} transactions · {formatMoney(avgBasket)} avg basket
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                  {formatMoney(data.revenue)}
                </span>
              </div>

              <div className="pt-2 pb-2">
                {data.dailyRevenue.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                    No revenue records for this period yet.
                  </div>
                ) : (
                  <div className="h-48 flex items-end gap-2 sm:gap-3 justify-between px-2">
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
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-lg h-36 flex items-end p-1">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full bg-gradient-to-t from-slate-900 dark:from-slate-200 to-slate-700 dark:to-slate-400 group-hover:from-emerald-600 group-hover:to-emerald-400 rounded-t-md transition-all duration-300 shadow-sm"
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
          </div>

          {/* Cash Till Summary */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                  Till Summary — {PERIOD_LABELS[period]}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Total physical &amp; digital payments collected from completed POS sales
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white font-mono">{formatMoney(data.revenue)}</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  {data.transactions} completed transaction{data.transactions !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

