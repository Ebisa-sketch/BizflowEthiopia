"use client";

import React, { useState } from "react";
import { Plus, History, ArrowDownLeft, ArrowUpRight, AlertCircle } from "lucide-react";

interface StockMovement {
  id: string;
  date: string;
  product: string;
  sku: string;
  type: "RECEIPT" | "SALE" | "ADJUSTMENT" | "RETURN" | "DAMAGE";
  quantity: number;
  reason?: string;
  actor: string;
}

const SAMPLE_MOVEMENTS: StockMovement[] = [
  { id: "M-101", date: "Today 10:42 AM", product: "Ambo Mineral Water (500ml)", sku: "BEV-001", type: "SALE", quantity: -2, reason: "Invoice #BF-948210", actor: "Tigist H." },
  { id: "M-100", date: "Today 10:15 AM", product: "Magna Teff 5kg Bag", sku: "PAN-001", type: "SALE", quantity: -1, reason: "Invoice #BF-948209", actor: "Tigist H." },
  { id: "M-099", date: "Yesterday 04:30 PM", product: "Sunflower Cooking Oil 3L", sku: "PAN-002", type: "RECEIPT", quantity: +25, reason: "Supplier Delivery PO-883", actor: "Abebe K." },
  { id: "M-098", date: "Yesterday 02:15 PM", product: "Ambo Mineral Water (500ml)", sku: "BEV-001", type: "ADJUSTMENT", quantity: -1, reason: "Glass broke in storage during restock", actor: "Abebe K." },
];

export default function InventoryPage() {
  const [movements] = useState<StockMovement[]>(SAMPLE_MOVEMENTS);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory & Stock Ledger</h1>
          <p className="text-sm text-slate-500">Track receipts, sales deductions, and adjustments with reason codes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
            <Plus className="h-4 w-4" />
            Stock Adjustment
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition">
            <Plus className="h-4 w-4" />
            Receive Delivery
          </button>
        </div>
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
                  <td className="py-3 px-4 text-slate-500 font-sans">{m.date}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {m.product}
                    <span className="block text-[11px] text-slate-400 font-mono">{m.sku}</span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      m.type === "RECEIPT"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : m.type === "SALE"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {m.type}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${isPositive ? "text-emerald-600" : "text-slate-800"}`}>
                    {isPositive ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">{m.reason || "—"}</td>
                  <td className="py-3 px-4 text-right font-sans text-slate-600 font-medium">{m.actor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
