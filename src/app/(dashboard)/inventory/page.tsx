"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Plus,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  X,
  Package,
  Filter,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Wallet,
  TrendingUp,
  Search,
  Boxes,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";
import { formatMoney } from "@/lib/money";

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
  actor: string;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  cost: number;
  price: number;
  reorderLevel: number;
}

export default function InventoryPage() {
  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const params = new URLSearchParams();
  if (typeFilter !== "ALL") params.set("type", typeFilter);
  if (productFilter !== "ALL") params.set("productId", productFilter);

  const swrKey = `/api/inventory?${params.toString()}`;
  const { data: movementsData, error: swrError, isLoading, mutate } = useSWR(swrKey, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const { data: productsData, error: productsError, mutate: mutateProducts } = useSWR("/api/products?status=ALL", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const movements: StockMovement[] = movementsData?.movements || [];
  const products: ProductItem[] = useMemo(() => {
    return (productsData?.products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || "N/A",
      stock: Number(p.stock ?? p.quantityOnHand ?? 0),
      cost: Number(p.cost ?? p.costPrice ?? 0),
      price: Number(p.price ?? p.sellingPrice ?? 0),
      reorderLevel: Number(p.reorderLevel ?? 5),
    }));
  }, [productsData]);

  // Inventory Valuation KPI Computations
  const valuation = useMemo(() => {
    const totalUnits = products.reduce((acc, p) => acc + Math.max(0, p.stock), 0);
    const totalCostValuation = products.reduce((acc, p) => acc + (Math.max(0, p.stock) * p.cost), 0);
    const totalRetailValuation = products.reduce((acc, p) => acc + (Math.max(0, p.stock) * p.price), 0);
    const potentialMargin = totalRetailValuation > 0
      ? ((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100
      : 0;

    const outOfStock = products.filter((p) => p.stock <= 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel);

    return {
      totalUnits,
      totalCostValuation,
      totalRetailValuation,
      potentialMargin,
      outOfStock,
      lowStock,
      criticalItems: [...outOfStock, ...lowStock],
    };
  }, [products]);

  // Filtered movements based on search query
  const filteredMovements = useMemo(() => {
    if (!searchQuery.trim()) return movements;
    const q = searchQuery.toLowerCase();
    return movements.filter(
      (m) =>
        m.product.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        (m.reason && m.reason.toLowerCase().includes(q)) ||
        (m.actor && m.actor.toLowerCase().includes(q))
    );
  }, [movements, searchQuery]);

  const loading = isLoading && !movementsData;
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchMovements = async () => {
    await mutate();
  };

  const fetchProductsCatalog = async () => {
    await mutateProducts();
  };

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Receive Form
  const [receiveProductId, setReceiveProductId] = useState("");
  const [receiveQty, setReceiveQty] = useState("");
  const [receivePoRef, setReceivePoRef] = useState("");

  // Adjustment Form
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState<"ADJUSTMENT" | "DAMAGE" | "RETURN">("ADJUSTMENT");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleReceiveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveProductId || !receiveQty) {
      setError("Please select a product and enter the delivered quantity.");
      return;
    }

    const qty = parseFloat(receiveQty);
    if (qty <= 0) {
      setError("Received quantity must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: receiveProductId,
          movementType: "RECEIPT",
          quantity: qty,
          reason: receivePoRef.trim() || "Supplier Stock Delivery",
          referenceType: "DELIVERY_PO",
          referenceId: receivePoRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record delivery");

      setIsReceiveModalOpen(false);
      setReceiveQty("");
      setReceivePoRef("");
      showToast(`Successfully received ${qty} units into store stock!`);
      await fetchMovements();
      await fetchProductsCatalog();
    } catch (err: any) {
      setError(err.message || "Failed to record delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId || !adjustQty || !adjustReason.trim()) {
      setError("Product, quantity, and mandatory reason are required.");
      return;
    }

    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty === 0) {
      setError("Quantity change cannot be zero.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustProductId,
          movementType: adjustType,
          quantity: qty,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust stock");

      setIsAdjustModalOpen(false);
      setAdjustQty("");
      setAdjustReason("");
      showToast(`Stock adjustment recorded. New stock level: ${data.updatedStock} units.`);
      await fetchMovements();
      await fetchProductsCatalog();
    } catch (err: any) {
      setError(err.message || "Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const selectedAdjustProduct = products.find((p) => p.id === adjustProductId);

  return (
    <div className="space-y-6">
      <DataLoadError
        error={swrError || productsError}
        onRetry={() => Promise.all([mutate(), mutateProducts()])}
      />
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory & Stock Ledger</h1>
          <p className="text-sm text-slate-500">
            Real-time store stock valuation, low inventory alerts, and immutable audit movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchMovements();
              fetchProductsCatalog();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              if (products.length > 0 && !adjustProductId) setAdjustProductId(products[0].id);
              setIsAdjustModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => {
              if (products.length > 0 && !receiveProductId) setReceiveProductId(products[0].id);
              setIsReceiveModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
          >
            <Truck className="h-4 w-4" />
            <span>Receive Delivery</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Inventory Valuation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Units */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Units on Hand</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {valuation.totalUnits.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{products.length}</span> active SKUs in catalog
            </div>
          </div>
        </div>

        {/* Total Cost Valuation */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Wholesale Asset Value (Cost)</span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatMoney(valuation.totalCostValuation)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Capital tied up in merchandise
            </div>
          </div>
        </div>

        {/* Retail Potential Value */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Retail Potential Value</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {formatMoney(valuation.totalRetailValuation)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span>+{valuation.potentialMargin.toFixed(1)}%</span>
              <span className="text-slate-400">projected gross markup</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`rounded-2xl border p-4 shadow-xs transition ${
          valuation.criticalItems.length > 0
            ? "border-rose-200 bg-rose-50/40"
            : "border-slate-200/80 bg-white"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Replenishment Alerts</span>
            <div className={`rounded-xl p-2.5 ${
              valuation.criticalItems.length > 0
                ? "bg-rose-100 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold font-mono ${
              valuation.criticalItems.length > 0 ? "text-rose-700" : "text-slate-900"
            }`}>
              {valuation.criticalItems.length} Products
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span className="font-semibold text-rose-600">{valuation.outOfStock.length}</span> out ·{" "}
              <span className="font-semibold text-amber-600">{valuation.lowStock.length}</span> low stock
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Low Stock Restock Banner */}
      {valuation.criticalItems.length > 0 && (
        <div className="rounded-2xl border border-rose-200/90 bg-gradient-to-r from-rose-50 via-white to-amber-50/30 p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-500 p-2 text-white shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Inventory Replenishment Required ({valuation.criticalItems.length} items critical)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Products below reorder threshold may cause checkout disruptions at POS. Click any item to restock.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Restock Item Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-rose-100">
            {valuation.criticalItems.slice(0, 6).map((item) => {
              const isOut = item.stock <= 0;
              const suggestedRestock = Math.max(10, item.reorderLevel * 2 - Math.max(0, item.stock));
              return (
                <div
                  key={item.id}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition ${
                    isOut
                      ? "border-red-300 bg-red-100/70 text-red-900"
                      : "border-amber-300 bg-amber-50 text-amber-900"
                  }`}
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="font-mono text-[11px] opacity-80">
                    ({item.stock} / min {item.reorderLevel})
                  </span>
                  <button
                    onClick={() => {
                      setReceiveProductId(item.id);
                      setReceiveQty(suggestedRestock.toString());
                      setIsReceiveModalOpen(true);
                    }}
                    className="ml-1 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 shadow-2xs hover:bg-blue-50 border border-blue-200 transition"
                  >
                    <Truck className="h-3 w-3" />
                    <span>+Restock {suggestedRestock}</span>
                  </button>
                </div>
              );
            })}
            {valuation.criticalItems.length > 6 && (
              <span className="text-xs text-slate-500 italic">
                +{valuation.criticalItems.length - 6} more items
              </span>
            )}
          </div>
        </div>
      )}

      {/* Movement Ledger Controls & Filters */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ledger by product, SKU, reference, or staff member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
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

          {/* Product selector filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 shrink-0">Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
            >
              <option value="ALL">All Products in Store ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.stock} in stock
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {[
            { id: "ALL", label: "All Movements" },
            { id: "RECEIPT", label: "Delivery Receipts" },
            { id: "SALE", label: "Sales Deductions" },
            { id: "ADJUSTMENT", label: "Audits & Corrections" },
            { id: "DAMAGE", label: "Damages & Spoilage" },
            { id: "RETURN", label: "Customer Returns" },
          ].map((pill) => {
            const isActive = typeFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setTypeFilter(pill.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Movement Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 text-sm">
              Audit Ledger (Movement History)
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
              {filteredMovements.length} records
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable Compliance Log</span>
        </div>

        {loading && filteredMovements.length === 0 ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={6} hasFilters={false} />
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Package className="h-10 w-10 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-700">No stock movements found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Deliveries, POS checkout deductions, or manual count adjustments will automatically log audit records here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Change</th>
                  <th className="py-3 px-4">Mandatory Reason / Reference</th>
                  <th className="py-3 px-4 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredMovements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-500 font-sans">{formatDate(m.date)}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        {m.product}
                        <span className="block text-[11px] text-slate-400 font-mono">{m.sku}</span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                            m.type === "RECEIPT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : m.type === "SALE"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : m.type === "DAMAGE"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : m.type === "RETURN"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {m.type === "RECEIPT" && <Truck className="h-3 w-3" />}
                          {m.type === "SALE" && <ArrowDownLeft className="h-3 w-3" />}
                          {m.type === "DAMAGE" && <AlertCircle className="h-3 w-3" />}
                          {m.type === "RETURN" && <RotateCcw className="h-3 w-3" />}
                          {m.type === "ADJUSTMENT" && <SlidersHorizontal className="h-3 w-3" />}
                          <span>{m.type}</span>
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold text-sm ${
                          isPositive ? "text-emerald-600" : "text-slate-800"
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">
                        {m.reason || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-sans text-slate-600 font-medium">
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

      {/* Receive Delivery Modal */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Receive Supplier Delivery</h2>
                <p className="text-xs text-slate-500">Add incoming merchandise stock directly to store inventory</p>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  required
                  value={receiveProductId}
                  onChange={(e) => setReceiveProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Choose Product to Restock --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current: {p.stock} units
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivered Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Delivery Note / PO Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supplier Invoice #INV-8839 / Merkato distributor"
                  value={receivePoRef}
                  onChange={(e) => setReceivePoRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Receiving..." : "Receive Delivery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Stock Adjustment / Audit</h2>
                <p className="text-xs text-slate-500">Record physical count discrepancies, breakage, or damage</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  required
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current: {p.stock} units
                    </option>
                  ))}
                </select>
                {selectedAdjustProduct && (
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Current stock on hand: <span className="font-bold text-slate-900">{selectedAdjustProduct.stock} units</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ADJUSTMENT">Count Discrepancy / Audit Correction</option>
                  <option value="DAMAGE">Damaged / Broken / Expired Goods (Deduction)</option>
                  <option value="RETURN">Customer Return to Stock (Addition)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Change <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder={adjustType === "DAMAGE" ? "e.g. 2 (will deduct 2)" : "e.g. -3 or +5"}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {adjustType === "DAMAGE"
                    ? "Enter positive count damaged; system will automatically deduct from inventory."
                    : "Enter positive number to increase stock, or negative number (e.g. -3) to decrease."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Audit Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Glass bottle broke during warehouse shelf restock"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving Adjustment..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
