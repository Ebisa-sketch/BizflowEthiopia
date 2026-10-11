"use client";

import React, { useState } from "react";
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

const METRICS_BY_RANGE: Record<DateRange, RangeMetrics> = {
  today: {
    invoiced: 18450,
    collected: 17600,
    cogs: 13220,
    expenses: 1450,
    salesCount: 42,
    chartData: [
      { day: "08:00", amount: 1200, sales: 4 },
      { day: "10:00", amount: 3450, sales: 9 },
      { day: "12:00", amount: 4800, sales: 12 },
      { day: "14:00", amount: 3900, sales: 8 },
      { day: "16:00", amount: 2800, sales: 5 },
      { day: "18:00", amount: 2300, sales: 4 },
    ],
  },
  "7d": {
    invoiced: 112800,
    collected: 108400,
    cogs: 80500,
    expenses: 8900,
    salesCount: 265,
    chartData: [
      { day: "Mon", amount: 14200, sales: 34 },
      { day: "Tue", amount: 16800, sales: 39 },
      { day: "Wed", amount: 13900, sales: 31 },
      { day: "Thu", amount: 15400, sales: 36 },
      { day: "Fri", amount: 18600, sales: 44 },
      { day: "Sat", amount: 21500, sales: 52 },
      { day: "Sun", amount: 12400, sales: 29 },
    ],
  },
  "30d": {
    invoiced: 482000,
    collected: 465000,
    cogs: 342000,
    expenses: 36500,
    salesCount: 1120,
    chartData: [
      { day: "Week 1", amount: 114000, sales: 260 },
      { day: "Week 2", amount: 121000, sales: 285 },
      { day: "Week 3", amount: 119000, sales: 275 },
      { day: "Week 4", amount: 128000, sales: 300 },
    ],
  },
  month: {
    invoiced: 215000,
    collected: 208000,
    cogs: 153000,
    expenses: 16200,
    salesCount: 510,
    chartData: [
      { day: "Oct 1-5", amount: 52000, sales: 122 },
      { day: "Oct 6-10", amount: 64000, sales: 151 },
      { day: "Oct 11-15", amount: 49000, sales: 115 },
      { day: "Oct 16-20", amount: 50000, sales: 122 },
    ],
  },
};

const LOW_STOCK_PRODUCTS = [
  { id: "1", name: "Dano Milk Powder 400g", sku: "DAI-001", onHand: 0, reorderLevel: 10, category: "Dairy" },
  { id: "2", name: "Sunflower Cooking Oil 3L", sku: "PAN-002", onHand: 4, reorderLevel: 15, category: "Grains & Pantry" },
  { id: "3", name: "Magna Teff 5kg Bag", sku: "PAN-001", onHand: 10, reorderLevel: 20, category: "Grains & Pantry" },
  { id: "4", name: "Coca Cola Glass (300ml)", sku: "BEV-002", onHand: 18, reorderLevel: 24, category: "Beverages" },
  { id: "5", name: "Prednisone Tablets (Pack)", sku: "MED-001", onHand: 12, reorderLevel: 15, category: "Pharmacy" },
];

const BEST_SELLING = [
  { name: "Ambo Mineral Water (500ml)", sku: "BEV-001", units: 182, revenue: 6370, margin: "28.5%" },
  { name: "Magna Teff 5kg Bag", sku: "PAN-001", units: 48, revenue: 40800, margin: "23.5%" },
  { name: "Coca Cola Glass (300ml)", sku: "BEV-002", units: 95, revenue: 2850, margin: "33.3%" },
  { name: "Sunflower Cooking Oil 3L", sku: "PAN-002", units: 36, revenue: 25920, margin: "19.4%" },
];

const RECENT_ACTIVITIES = [
  { id: "A-1", time: "10:42 AM", title: "POS Sale Completed", detail: "Invoice #BF-948210 (ETB 850.00 via Telebirr)", actor: "Tigist H.", type: "SALE" },
  { id: "A-2", time: "09:30 AM", title: "Stock Receipt Recorded", detail: "+25 Sunflower Cooking Oil 3L (Supplier Delivery PO-883)", actor: "Abebe K.", type: "INVENTORY" },
  { id: "A-3", time: "Yesterday", title: "Stock Adjustment", detail: "-1 Ambo Water (Reason: Broken bottle in storage)", actor: "Abebe K.", type: "ADJUSTMENT" },
  { id: "A-4", time: "Oct 5", title: "Expense Recorded", detail: "ETB 800.00 for Teff transport logistics", actor: "Tigist H.", type: "EXPENSE" },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>("today");

  const currentMetrics = METRICS_BY_RANGE[dateRange];
  const financialSummary = calculateFinancialSummary({
    salesInvoiced: currentMetrics.invoiced,
    paymentsCollected: currentMetrics.collected,
    cogs: currentMetrics.cogs,
    operatingExpenses: currentMetrics.expenses,
  });

  const avgOrderValue = currentMetrics.salesCount > 0
    ? currentMetrics.invoiced / currentMetrics.salesCount
    : 0;

  const maxChartAmount = Math.max(...currentMetrics.chartData.map((d) => d.amount));

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Timezone and Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Business Overview
            </h1>
            <span className="text-xs font-bold text-[#0D9668] bg-[#DCEFE7] px-2.5 py-0.5 rounded-full border border-[#0D9668]/20">
              Live Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store: <span className="font-semibold text-slate-700">Addis Mini Mart (Bole)</span> • Timezone:{" "}
            <span className="font-mono text-slate-600">Africa/Addis_Ababa (EAT)</span>
          </p>
        </div>

        {/* Date-Range Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
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

      {/* Demo Data Notice Strip */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>Illustrative Business Data:</strong> All figures use precise ETB currency math and snapshotted cost structures from your catalog ledger.
          </span>
        </div>
        <Link
          href="/sales/new"
          className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline shrink-0 hidden sm:inline"
        >
          Create Live Sale →
        </Link>
      </div>

      {/* 2. Four Precise KPI Cards (Equal Height, Consistent Spacing) */}
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
            <span className={`font-mono font-bold ${financialSummary.outstandingBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {formatMoney(financialSummary.outstandingBalance)}
            </span>
          </div>
        </div>

        {/* KPI 2: Estimated Gross Profit & COGS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span className="flex items-center gap-1">
                Gross Profit <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">Est.</span>
              </span>
              <div className="p-2 rounded-xl bg-[#DCEFE7] text-[#0D9668] border border-[#0D9668]/20">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-[#0D9668] font-mono tracking-tight">
              {formatMoney(financialSummary.grossProfit)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Snapshotted COGS:{" "}
              <strong className="text-slate-700 font-mono">
                {formatMoney(financialSummary.cogs)}
              </strong>
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Gross Profit Margin:</span>
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
              {currentMetrics.salesCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Audited customer checkout count
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
              {LOW_STOCK_PRODUCTS.length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Items at or below reorder limit
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Critical (0 stock):</span>
            <span className="font-mono font-bold text-red-600">
              1 item out of stock
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
                Hourly and daily sales volumes in Ethiopian Birr
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0D9668] bg-[#DCEFE7] px-2.5 py-1 rounded-lg">
              Total: {formatMoney(financialSummary.totalInvoiced)}
            </span>
          </div>

          {/* Clean SVG / CSS Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="h-48 flex items-end gap-3 sm:gap-6 justify-between px-2">
              {currentMetrics.chartData.map((bar, i) => {
                const heightPct = Math.max(12, Math.round((bar.amount / maxChartAmount) * 100));
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
          </div>
        </div>

        {/* Payment Method Breakdown (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Payment Methods</h2>
              <p className="text-xs text-slate-400">Share of collected transactions</p>
            </div>

            <div className="space-y-3.5 pt-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-blue-600" /> Telebirr (Manual)
                  </span>
                  <span className="font-mono font-bold text-slate-900">54% • ETB 9,963.00</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "54%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-emerald-600" /> Cash
                  </span>
                  <span className="font-mono font-bold text-slate-900">32% • ETB 5,904.00</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: "32%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-purple-600" /> CBE Birr (Manual)
                  </span>
                  <span className="font-mono font-bold text-slate-900">12% • ETB 2,214.00</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: "12%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-amber-600" /> Bank Transfer
                  </span>
                  <span className="font-mono font-bold text-slate-900">2% • ETB 369.00</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: "2%" }} />
                </div>
              </div>
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

      {/* 4. Best Selling Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Best-Selling Products Table (7 Cols) */}
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
                {BEST_SELLING.map((p) => (
                  <tr key={p.sku} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <p className="font-sans font-bold text-slate-900 text-xs">{p.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
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
          </div>
        </div>

        {/* Low Stock Watch with Severity Badges (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Inventory Alerts
                <span className="h-2 w-2 rounded-full bg-amber-500" />
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
            {LOW_STOCK_PRODUCTS.map((prod) => {
              const status = calculateStockSeverity(prod.onHand, prod.reorderLevel);
              return (
                <div
                  key={prod.sku}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{prod.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      SKU: {prod.sku} • Reorder threshold: {prod.reorderLevel}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${status.badgeClass}`}>
                      {prod.onHand} left
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">{status.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Feed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              Recent Operations Stream
            </h2>
            <p className="text-xs text-slate-400">Audited business and staff events</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {RECENT_ACTIVITIES.map((act) => (
            <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-slate-400 w-16">{act.time}</span>
                <div>
                  <span className="font-bold text-slate-800">{act.title}</span>
                  <span className="text-slate-500 ml-2">{act.detail}</span>
                </div>
              </div>
              <span className="font-medium text-slate-400 font-mono text-[11px] hidden sm:inline">
                {act.actor}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
