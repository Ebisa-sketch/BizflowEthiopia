"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  Package,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Trash2,
  Tag,
  DollarSign,
  Layers,
  Wand2,
  Printer,
  Barcode,
  TrendingUp,
  ArrowUpRight,
  Truck,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";

interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  categoryId?: string | null;
  cost: number;
  price: number;
  stock: number;
  reorderLevel: number;
  status: "ACTIVE" | "ARCHIVED";
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  // Filters
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");

  const queryParams = new URLSearchParams();
  if (searchTerm.trim()) queryParams.set("search", searchTerm.trim());
  if (selectedCategory && selectedCategory !== "ALL") queryParams.set("category", selectedCategory);
  if (statusFilter !== "ACTIVE") queryParams.set("status", statusFilter);

  const swrKey = `/api/products?${queryParams.toString()}`;
  const { data, error: swrError, isLoading, mutate } = useSWR(swrKey, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const products: Product[] = data?.products || [];
  const categories: Category[] = data?.categories || [];
  const loading = isLoading && !data;
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    await mutate();
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Stock Level Filter
  const [stockLevelFilter, setStockLevelFilter] = useState<"ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | "IN_STOCK">("ALL");

  // Barcode Label Print Modal
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<Product | null>(null);
  const [barcodeLabelCount, setBarcodeLabelCount] = useState<number>(4);

  // Quick Restock Modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<string>("10");
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  // Add Product Form State
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formCategoryNew, setFormCategoryNew] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formSellingPrice, setFormSellingPrice] = useState("");
  const [formInitialStock, setFormInitialStock] = useState("0");
  const [formReorderLevel, setFormReorderLevel] = useState("5");

  // Auto SKU & Barcode Generator
  const generateSku = (name: string, categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId)?.name || "PRD";
    const prefix = (cat.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "PRD").toUpperCase();
    const namePart = (name.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "ITM").toUpperCase();
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${namePart}-${num}`;
  };

  const generateBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    return `200${randomDigits}`;
  };

  // Profit Margin Calculator
  const calculateMargin = (costStr: string, priceStr: string) => {
    const cost = parseFloat(costStr) || 0;
    const price = parseFloat(priceStr) || 0;
    if (price <= 0) return null;
    const profit = price - cost;
    const marginPct = (profit / price) * 100;
    const markupPct = cost > 0 ? (profit / cost) * 100 : 100;
    return {
      profit,
      marginPct: Math.round(marginPct * 10) / 10,
      markupPct: Math.round(markupPct * 10) / 10,
      isLoss: profit < 0,
      isZero: profit === 0,
    };
  };

  const handleQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qty = parseInt(restockQuantity, 10);
    if (!qty || qty <= 0) return;

    try {
      setRestockSubmitting(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: restockProduct.id,
          movementType: "RECEIPT",
          quantity: qty,
          reason: `Direct catalog restock (+${qty} units)`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Restock failed");

      showToast(`Restocked ${restockProduct.name}: +${qty} units added!`);
      setRestockProduct(null);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to restock");
    } finally {
      setRestockSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const resetForm = () => {
    setFormName("");
    setFormSku("");
    setFormBarcode("");
    setFormCategoryId("");
    setFormCategoryNew("");
    setFormCostPrice("");
    setFormSellingPrice("");
    setFormInitialStock("0");
    setFormReorderLevel("5");
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    // Auto-generate suggested SKU
    setFormSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBarcode(generateBarcode());
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openAddModal();
    }
  }, [searchParams]);

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku || "");
    setFormBarcode(p.barcode || "");
    setFormCategoryId(p.categoryId || "");
    setFormCategoryNew("");
    setFormCostPrice(p.cost.toString());
    setFormSellingPrice(p.price.toString());
    setFormReorderLevel(p.reorderLevel.toString());
  };

  // Submit Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSellingPrice) {
      setError("Please fill out product name and selling price.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formName.trim(),
        sku: formSku.trim() || undefined,
        barcode: formBarcode.trim() || undefined,
        categoryId: formCategoryId || undefined,
        categoryName: !formCategoryId && formCategoryNew.trim() ? formCategoryNew.trim() : undefined,
        sellingPrice: parseFloat(formSellingPrice) || 0,
        costPrice: parseFloat(formCostPrice) || 0,
        quantityOnHand: parseFloat(formInitialStock) || 0,
        reorderLevel: parseFloat(formReorderLevel) || 5,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      setIsAddModalOpen(false);
      resetForm();
      showToast(`Product "${payload.name}" successfully created!`);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formName.trim(),
        sku: formSku.trim() || null,
        barcode: formBarcode.trim() || null,
        categoryId: formCategoryId || null,
        sellingPrice: parseFloat(formSellingPrice) || 0,
        costPrice: parseFloat(formCostPrice) || 0,
        reorderLevel: parseFloat(formReorderLevel) || 5,
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      setEditingProduct(null);
      resetForm();
      showToast(`Product "${payload.name}" updated successfully!`);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Archive / Active
  const handleToggleArchive = async (p: Product) => {
    const newStatus = p.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    const confirmText =
      p.status === "ACTIVE"
        ? `Archive "${p.name}"? It will be hidden from the active POS terminal.`
        : `Unarchive "${p.name}" back into active inventory?`;

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product status");

      showToast(`Product "${p.name}" is now ${newStatus.toLowerCase()}.`);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to change status");
    }
  };

  // Delete product
  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to permanently remove "${p.name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      showToast(data.message || "Product removed.");
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      <DataLoadError error={swrError} onRetry={mutate} />
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500">
            Manage inventory items, retail prices, SKUs, and reorder thresholds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProducts()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Catalog"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
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

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-0 bg-transparent pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ACTIVE">Active Only</option>
            <option value="ARCHIVED">Archived Only</option>
            <option value="ALL">All Status</option>
          </select>
        </div>
      </div>

      {/* Stock Level Quick Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        <button
          type="button"
          onClick={() => setStockLevelFilter("ALL")}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            stockLevelFilter === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>All Items</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            stockLevelFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
          }`}>
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStockLevelFilter("LOW_STOCK")}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            stockLevelFilter === "LOW_STOCK"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-amber-700 hover:bg-amber-50"
          }`}
        >
          <span>Low Stock Alert</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            stockLevelFilter === "LOW_STOCK" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
          }`}>
            {products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStockLevelFilter("OUT_OF_STOCK")}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            stockLevelFilter === "OUT_OF_STOCK"
              ? "bg-red-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-red-600 hover:bg-red-50"
          }`}
        >
          <span>Out of Stock</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            stockLevelFilter === "OUT_OF_STOCK" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
          }`}>
            {products.filter((p) => p.stock <= 0).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStockLevelFilter("IN_STOCK")}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            stockLevelFilter === "IN_STOCK"
              ? "bg-[#0D9668] text-white shadow-xs"
              : "bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <span>Optimal Stock</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            stockLevelFilter === "IN_STOCK" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
          }`}>
            {products.filter((p) => p.stock > p.reorderLevel).length}
          </span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={6} hasFilters={false} />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Package className="h-10 w-10 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== "ALL"
                ? "Try adjusting your search criteria or category filter."
                : "Get started by adding your first product to begin tracking sales and inventory."}
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost (ETB)</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Stock on Hand</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {products
                  .filter((p) => {
                    if (stockLevelFilter === "LOW_STOCK") return p.stock > 0 && p.stock <= p.reorderLevel;
                    if (stockLevelFilter === "OUT_OF_STOCK") return p.stock <= 0;
                    if (stockLevelFilter === "IN_STOCK") return p.stock > p.reorderLevel;
                    return true;
                  })
                  .map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= p.reorderLevel;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <p className="font-sans font-semibold text-slate-900 text-sm">{p.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{p.sku || "No SKU"}</span>
                            {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                            <Tag className="h-3 w-3 text-slate-400" />
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">{formatMoney(p.cost)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                          {formatMoney(p.price)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-bold ${
                              isOutOfStock
                                ? "text-red-600"
                                : isLow
                                ? "text-amber-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {p.stock} units
                          </span>
                          {isOutOfStock && (
                            <span className="block text-[10px] text-red-600 font-sans font-medium">
                              Out of stock
                            </span>
                          )}
                          {isLow && (
                            <span className="block text-[10px] text-amber-600 font-sans font-medium">
                              Low (min {p.reorderLevel})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-sans ${
                              p.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <div className="inline-flex items-center gap-1.5">
                            {/* 1-Click Quick Restock */}
                            <button
                              type="button"
                              onClick={() => {
                                setRestockProduct(p);
                                setRestockQuantity("10");
                              }}
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                              title="Quick Restock Stock"
                            >
                              <Truck className="h-3.5 w-3.5" />
                            </button>

                            {/* Barcode Sticker Label Printing */}
                            <button
                              type="button"
                              onClick={() => {
                                setBarcodePrintProduct(p);
                                setBarcodeLabelCount(4);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                              title="Print Barcode Labels"
                            >
                              <Barcode className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleArchive(p)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                p.status === "ACTIVE"
                                  ? "border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title={p.status === "ACTIVE" ? "Archive Product" : "Restore Product"}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Product</h2>
                <p className="text-xs text-slate-500">Record a new product item into store inventory</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ambo Mineral Water (500ml)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">SKU Code</label>
                    <button
                      type="button"
                      onClick={() => setFormSku(generateSku(formName, formCategoryId))}
                      className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="h-2.5 w-2.5" />
                      <span>Auto</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. BEV-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Barcode</label>
                    <button
                      type="button"
                      onClick={() => setFormBarcode(generateBarcode())}
                      className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="h-2.5 w-2.5" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Scan or enter barcode"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => {
                    setFormCategoryId(e.target.value);
                    if (e.target.value) setFormCategoryNew("");
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 mb-2"
                >
                  <option value="">-- Choose Existing Category or Type Below --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!formCategoryId && (
                  <input
                    type="text"
                    placeholder="Or type a new category name (e.g. Beverages)"
                    value={formCategoryNew}
                    onChange={(e) => setFormCategoryNew(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (ETB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Live Profit Margin & Markup Indicator */}
              {calculateMargin(formCostPrice, formSellingPrice) && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    calculateMargin(formCostPrice, formSellingPrice)?.isLoss
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>
                      Unit Profit: {formatMoney(calculateMargin(formCostPrice, formSellingPrice)!.profit)}
                    </span>
                    {calculateMargin(formCostPrice, formSellingPrice)?.isLoss && (
                      <span className="font-extrabold text-red-600">(Loss!)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
                    <span>Margin: {calculateMargin(formCostPrice, formSellingPrice)!.marginPct}%</span>
                    <span>•</span>
                    <span>Markup: {calculateMargin(formCostPrice, formSellingPrice)!.markupPct}%</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formInitialStock}
                    onChange={(e) => setFormInitialStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Automatically logged as stock intake receipt.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reorder Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formReorderLevel}
                    onChange={(e) => setFormReorderLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">Triggers low-stock warning.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving Product..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Product</h2>
                <p className="text-xs text-slate-500">Update pricing and product details</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">SKU Code</label>
                    <button
                      type="button"
                      onClick={() => setFormSku(generateSku(formName, formCategoryId))}
                      className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="h-2.5 w-2.5" />
                      <span>Auto</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Barcode</label>
                    <button
                      type="button"
                      onClick={() => setFormBarcode(generateBarcode())}
                      className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="h-2.5 w-2.5" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">-- General / Uncategorized --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Live Profit Margin & Markup Indicator */}
              {calculateMargin(formCostPrice, formSellingPrice) && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    calculateMargin(formCostPrice, formSellingPrice)?.isLoss
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>
                      Unit Profit: {formatMoney(calculateMargin(formCostPrice, formSellingPrice)!.profit)}
                    </span>
                    {calculateMargin(formCostPrice, formSellingPrice)?.isLoss && (
                      <span className="font-extrabold text-red-600">(Loss!)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
                    <span>Margin: {calculateMargin(formCostPrice, formSellingPrice)!.marginPct}%</span>
                    <span>•</span>
                    <span>Markup: {calculateMargin(formCostPrice, formSellingPrice)!.markupPct}%</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reorder Alert Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={formReorderLevel}
                  onChange={(e) => setFormReorderLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Barcode Label Sticker Print Modal */}
      {barcodePrintProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Print Barcode Labels</h3>
              </div>
              <button
                type="button"
                onClick={() => setBarcodePrintProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Print shelf tags or product barcode stickers for <strong>{barcodePrintProduct.name}</strong>.
            </p>

            {/* Label Quantity Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Number of Stickers:</span>
              <div className="flex items-center gap-1">
                {[1, 4, 8, 12, 24].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setBarcodeLabelCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      barcodeLabelCount === cnt
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Preview Area */}
            <div
              id="pos-barcode-print"
              className="p-4 rounded-xl border border-dashed border-slate-300 bg-white space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: barcodeLabelCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-300 text-center font-mono space-y-1 bg-white"
                  >
                    <p className="text-[10px] font-sans font-bold text-slate-900 truncate uppercase">
                      {barcodePrintProduct.name}
                    </p>
                    {/* Simulated 1D Barcode */}
                    <div className="flex items-center justify-center gap-[1.5px] h-6 w-full max-w-[140px] mx-auto opacity-90 overflow-hidden">
                      {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 1, 2, 3, 2, 1].map(
                        (w, i) => (
                          <span
                            key={i}
                            className="bg-black inline-block h-full"
                            style={{ width: `${w}px` }}
                          />
                        )
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold tracking-wider">
                      {barcodePrintProduct.barcode || barcodePrintProduct.sku}
                    </p>
                    <p className="text-xs font-black text-slate-900 font-sans">
                      {formatMoney(barcodePrintProduct.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBarcodePrintProduct(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Labels</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Quick Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#0D9668]" />
                <h3 className="font-bold text-slate-900 text-base">Quick Restock</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900 text-sm truncate">{restockProduct.name}</p>
              <p className="text-slate-500 font-mono">
                Current Stock:{" "}
                <span className="font-bold text-slate-900">{restockProduct.stock} units</span>
              </p>
            </div>

            <form onSubmit={handleQuickRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units Received to Add <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 p-2.5 text-base font-mono font-bold text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <div className="flex gap-1">
                    {[10, 25, 50].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setRestockQuantity(String(inc))}
                        className="px-2.5 py-2 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  disabled={restockSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0D9668] hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {restockSubmitting ? "Restocking..." : "Receive Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
