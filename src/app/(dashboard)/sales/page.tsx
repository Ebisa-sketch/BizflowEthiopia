"use client";

import React from "react";
import Link from "next/link";
import { Plus, Search, Receipt, Printer } from "lucide-react";
import { formatMoney } from "@/lib/money";

const SALES = [
  { id: "BF-948210", date: "Today 10:42 AM", cashier: "Tigist H.", method: "Telebirr", subtotal: 850, discount: 0, total: 850, items: 3 },
  { id: "BF-948209", date: "Today 10:15 AM", cashier: "Tigist H.", method: "Cash", subtotal: 140, discount: 0, total: 140, items: 4 },
  { id: "BF-948208", date: "Today 09:50 AM", cashier: "Abebe K.", method: "CBE Birr", subtotal: 1500, discount: 60, total: 1440, items: 6 },
  { id: "BF-948207", date: "Today 09:32 AM", cashier: "Tigist H.", method: "Telebirr", subtotal: 320, discount: 0, total: 320, items: 2 },
  { id: "BF-948206", date: "Today 08:45 AM", cashier: "Tigist H.", method: "Cash", subtotal: 720, discount: 0, total: 720, items: 1 },
];

export default function SalesHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Transactions</h1>
          <p className="text-sm text-slate-500">View transaction history, payment methods, and reprint receipts</p>
        </div>
        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Sale (POS)</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Cashier</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4 text-right">Total (ETB)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {SALES.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-bold text-slate-900">{s.id}</td>
                <td className="py-3 px-4 text-slate-500 font-sans">{s.date}</td>
                <td className="py-3 px-4 font-sans text-slate-700">{s.cashier}</td>
                <td className="py-3 px-4 font-sans">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                    {s.method}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-slate-600">{s.items}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                  {formatMoney(s.total)}
                </td>
                <td className="py-3 px-4 text-right font-sans">
                  <button
                    onClick={() => alert(`Printing receipt for invoice ${s.id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Receipt</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
