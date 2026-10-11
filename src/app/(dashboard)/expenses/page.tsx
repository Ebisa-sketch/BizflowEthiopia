"use client";

import React, { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { formatMoney } from "@/lib/money";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  recordedBy: string;
}

const SAMPLE_EXPENSES: Expense[] = [
  { id: "E-01", category: "Rent", amount: 12000, description: "Monthly shop store rent (Bole branch)", date: "Oct 1, 2026", recordedBy: "Abebe K." },
  { id: "E-02", category: "Utilities", amount: 1450, description: "Electricity & Ethio Telecom fiber internet", date: "Oct 3, 2026", recordedBy: "Abebe K." },
  { id: "E-03", category: "Logistics", amount: 800, description: "Teff transport from warehouse", date: "Oct 5, 2026", recordedBy: "Tigist H." },
];

export default function ExpensesPage() {
  const [expenses] = useState<Expense[]>(SAMPLE_EXPENSES);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operating Expenses</h1>
          <p className="text-sm text-slate-500">Record overhead, rent, utilities, and transport to calculate true net margin</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition">
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">Total Month Expenses:</span>
        <span className="text-xl font-bold font-mono text-red-600">{formatMoney(totalExpenses)}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Amount (ETB)</th>
              <th className="py-3 px-4 text-right">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-sans text-slate-500">{e.date}</td>
                <td className="py-3 px-4 font-sans">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {e.category}
                  </span>
                </td>
                <td className="py-3 px-4 font-sans text-slate-700">{e.description}</td>
                <td className="py-3 px-4 text-right font-bold text-red-600">{formatMoney(e.amount)}</td>
                <td className="py-3 px-4 text-right font-sans text-slate-600">{e.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
