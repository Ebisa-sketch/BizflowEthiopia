"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  X,
  Package,
  Filter,
  Truck,
  RotateCcw,
  SlidersHorizontal,
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
  actor: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

export default function InventoryPage() {
  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");

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
  });

  const movements: StockMovement[] = movementsData?.movements || [];
  const products: ProductOption[] = (productsData?.products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku || "N/A",
    stock: p.stock ?? p.quantityOnHand ?? 0,
  }));
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
            Track deliveries, sales deductions, damages, and audit adjustments with immutable ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchMovements();
              fetchProductsCatalog();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter Ledger:</span>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Movement Types</option>
          <option value="RECEIPT">Delivery Receipts</option>
          <option value="SALE">Sales Deductions</option>
          <option value="ADJUSTMENT">Adjustments</option>
          <option value="DAMAGE">Damages & Spoilage</option>
          <option value="RETURN">Customer Returns</option>
        </select>

        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
        >
          <option value="ALL">All Products in Store</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </div>

      {/* Movement Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            Audit Ledger (Movement History)
          </h2>
          <span className="text-xs text-slate-500 font-mono">Immutable Trace</span>
        </div>

        {loading && movements.length === 0 ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={6} hasFilters={false} />
          </div>
        ) : movements.length === 0 ? (
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
                {movements.map((m) => {
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
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.type === "RECEIPT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : m.type === "SALE"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : m.type === "DAMAGE"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {m.type}
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
