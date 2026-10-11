"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, Edit2, Archive, Package } from "lucide-react";
import { formatMoney } from "@/lib/money";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reorderLevel: number;
  status: "ACTIVE" | "ARCHIVED";
}

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", sku: "BEV-001", name: "Ambo Mineral Water (500ml)", category: "Beverages", costPrice: 25.0, sellingPrice: 35.0, stock: 150, reorderLevel: 24, status: "ACTIVE" },
  { id: "2", sku: "BEV-002", name: "Coca Cola Glass Bottle (300ml)", category: "Beverages", costPrice: 20.0, sellingPrice: 30.0, stock: 80, reorderLevel: 20, status: "ACTIVE" },
  { id: "3", sku: "PAN-001", name: "Magna Teff 5kg Bag", category: "Grains & Pantry", costPrice: 650.0, sellingPrice: 850.0, stock: 40, reorderLevel: 10, status: "ACTIVE" },
  { id: "4", sku: "PAN-002", name: "Sunflower Cooking Oil 3L", category: "Grains & Pantry", costPrice: 580.0, sellingPrice: 720.0, stock: 25, reorderLevel: 8, status: "ACTIVE" },
  { id: "5", sku: "COF-001", name: "Ethiopian Yirgacheffe Coffee 500g", category: "Coffee & Tea", costPrice: 320.0, sellingPrice: 450.0, stock: 60, reorderLevel: 15, status: "ACTIVE" },
];

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500">Manage items, pricing, SKUs, and inventory thresholds</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition">
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-0 bg-transparent pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Product / SKU</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Cost Price</th>
              <th className="py-3 px-4 text-right">Selling Price</th>
              <th className="py-3 px-4 text-right">Stock on Hand</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filtered.map((p) => {
              const isLow = p.stock <= p.reorderLevel;
              return (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <p className="font-sans font-semibold text-slate-900 text-sm">{p.name}</p>
                    <span className="text-[11px] text-slate-400">{p.sku}</span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600">{p.category}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatMoney(p.costPrice)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatMoney(p.sellingPrice)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-bold ${isLow ? "text-amber-600" : "text-slate-800"}`}>
                      {p.stock}
                    </span>
                    {isLow && <span className="block text-[10px] text-amber-600 font-sans">Low stock</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 font-sans">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition">
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
