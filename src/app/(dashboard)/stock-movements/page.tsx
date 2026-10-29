"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Package,
  Search,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Tag,
  X,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";

interface StockMovement {
  id: string;
  date: string;
  product: string;
  productId: string;
  sku: string;
  currentStock: number;
  type: "RECEIPT" | "SALE" | "ADJUSTMENT" | "RETURN" | "DAMAGE";
  quantity: number;
  reason?: string;
  referenceType?: string;
  actor: string;
}

const TYPE_PILLS = [
  { id: "ALL", label: "All Movements" },
  { id: "RECEIPT", label: "Deliveries" },
  { id: "SALE", label: "Sales" },
  { id: "ADJUSTMENT", label: "Adjustments" },
  { id: "DAMAGE", label: "Damages" },
  { id: "RETURN", label: "Returns" },
];

const TYPE_BADGE: Record<string, string> = {
  RECEIPT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SALE: "bg-blue-50 text-blue-700 border-blue-200",
  DAMAGE: "bg-red-50 text-red-700 border-red-200",
  RETURN: "bg-purple-50 text-purple-700 border-purple-200",
  ADJUSTMENT: "bg-amber-50 text-amber-700 border-amber-200",
};

function TypeIcon({ type }: { type: StockMovement["type"] }) {
  const cls = "h-3 w-3";
  if (type === "RECEIPT") return <Truck className={cls} />;
  if (type === "SALE") return <ArrowDownLeft className={cls} />;
  if (type === "DAMAGE") return <AlertCircle className={cls} />;
  if (type === "RETURN") return <RotateCcw className={cls} />;
  return <SlidersHorizontal className={cls} />;
}

export default function StockMovementsPage() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const params = new URLSearchParams();
  if (typeFilter !== "ALL") params.set("type", typeFilter);
  const swrKey = `/api/inventory?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(swrKey, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const movements: StockMovement[] = data?.movements || [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return movements;
    const q = searchQuery.toLowerCase();
    return movements.filter(
      (m) =>
        m.product.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.actor.toLowerCase().includes(q) ||
        (m.reason && m.reason.toLowerCase().includes(q))
    );
  }, [movements, searchQuery]);

  const loading = isLoading && !data;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <DataLoadError error={error} onRetry={() => mutate()} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-6 w-6 text-slate-400" />
            Stock Movements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Immutable audit ledger of all stock changes — deliveries, sales deductions, adjustments, damages &amp; returns
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          title="Refresh ledger"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Catalog Nav Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[
          { label: "Products", href: "/products", Icon: Package },
          { label: "Categories", href: "/categories", Icon: Tag },
          { label: "Inventory", href: "/inventory", Icon: Layers },
          { label: "Stock Movements", href: "/stock-movements", Icon: History },
        ].map(({ label, href, Icon }) => {
          const active = href === "/stock-movements";
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                active
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product, SKU, reason, or staff member…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-700/50 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
          {TYPE_PILLS.map((pill) => {
            const active = typeFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setTypeFilter(pill.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Audit Ledger</h2>
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              {filtered.length} records
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable Compliance Log</span>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} cols={6} hasFilters={false} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Package className="h-10 w-10 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">No movements found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || typeFilter !== "ALL"
                ? "Try changing your search or filter."
                : "Deliveries, sales deductions, and manual adjustments will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Change</th>
                  <th className="py-3 px-4 text-right">Stock After</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                  <th className="py-3 px-4 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(m.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{m.product}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">{m.sku}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                            TYPE_BADGE[m.type] || "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          <TypeIcon type={m.type} />
                          {m.type}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold font-mono text-sm ${
                          isPositive ? "text-emerald-600" : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {m.currentStock}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {m.reason || m.referenceType || "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                        {m.actor}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary row */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Showing {filtered.length} of {movements.length} total movement records
          {typeFilter !== "ALL" && <span>· filtered by <strong>{typeFilter}</strong></span>}
        </div>
      )}
    </div>
  );
}

