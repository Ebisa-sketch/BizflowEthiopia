"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  FolderOpen,
  DollarSign,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  productCount: number;
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  createdAt: string;
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, error: swrError, isLoading, mutate } = useSWR(
    "/api/categories",
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    }
  );

  const categories: CategoryItem[] = data?.categories || [];
  const loading = isLoading && !data;

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  // KPI Computations
  const totalCategories = categories.length;
  const totalProductsCount = categories.reduce((sum, c) => sum + c.productCount, 0);
  const totalStockUnits = categories.reduce((sum, c) => sum + c.totalStock, 0);
  const totalCatalogValue = categories.reduce((sum, c) => sum + c.totalValue, 0);

  const handleOpenAdd = () => {
    setFormName("");
    setFormDescription("");
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: CategoryItem) => {
    setEditingCategory(c);
    setFormName(c.name);
    setFormDescription(c.description || "");
    setError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingCategory) {
        // Update existing category
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
          }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Failed to update category");

        showToast(`Category "${formName.trim()}" updated successfully.`);
        setEditingCategory(null);
      } else {
        // Create new category
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
          }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Failed to create category");

        showToast(`Category "${formName.trim()}" created successfully.`);
        setIsAddModalOpen(false);
      }

      setFormName("");
      setFormDescription("");
      await mutate();
    } catch (err: any) {
      setError(err.message || "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete category");

      showToast(`Category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
      await mutate();
    } catch (err: any) {
      setError(err.message || "Failed to delete category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DataLoadError error={swrError} onRetry={mutate} />

      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Catalog Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
        >
          <Package className="h-4 w-4" />
          <span>All Products</span>
        </Link>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#073228] text-[#00D287] border border-[#0D9668]/40 shadow-xs"
        >
          <Tag className="h-4 w-4 text-[#00D287]" />
          <span>Product Categories</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#00D287]/20 text-[#00D287] font-mono">
            {categories.length}
          </span>
        </Link>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
        >
          <Layers className="h-4 w-4" />
          <span>Inventory & Stock</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Product Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize catalog departments, group similar goods, and track category inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
            title="Refresh Categories"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Tag className="h-4 w-4 text-emerald-600" />
            <span>Total Categories</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalCategories}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active catalog groupings</p>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Package className="h-4 w-4 text-blue-600" />
            <span>Categorized Products</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalProductsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Items linked to a category</p>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Total Stock Units</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalStockUnits}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Quantity across categories</p>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <DollarSign className="h-4 w-4 text-teal-600" />
            <span>Total Category Value</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatMoney(totalCatalogValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Retail inventory value</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-0 bg-transparent pl-10 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Categories Table / Card List */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && categories.length === 0 ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={5} hasFilters={false} />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FolderOpen className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {searchTerm ? "No matching categories found" : "No categories created yet"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? "Try searching with a different keyword."
                : "Create your first category (e.g. Beverages, Bakery, Essentials) to organize products into groups."}
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Category Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Products</th>
                  <th className="py-3 px-4 text-right">Total Units</th>
                  <th className="py-3 px-4 text-right">Retail Value</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredCategories.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {c.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {c.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300 max-w-xs">
                      {c.description ? (
                        <p className="truncate">{c.description}</p>
                      ) : (
                        <span className="text-slate-400 italic">No description</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {c.productCount} {c.productCount === 1 ? "product" : "products"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300 font-bold">
                      {c.totalStock} units
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white text-sm">
                      {formatMoney(c.totalValue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/products?category=${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition text-xs font-semibold"
                          title="View all products in this category"
                        >
                          <span>Products</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCategory(c)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {(isAddModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-850 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingCategory
                      ? "Update category details and grouping"
                      : "Create a new category for your store catalog"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCategory(null);
                  setError(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beverages, Bakery, Dairy, Household"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Soft drinks, juices, mineral water bottles, and canned refreshments"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                    setError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-850 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Delete Category?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deletingCategory.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 dark:text-white">&quot;{deletingCategory.name}&quot;</strong>?
              {deletingCategory.productCount > 0 ? (
                <span className="block mt-1 text-amber-700 dark:text-amber-400">
                  Note: The {deletingCategory.productCount} products in this category will not be deleted;
                  their category will simply be set to &quot;Unassigned&quot;.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteCategory}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

