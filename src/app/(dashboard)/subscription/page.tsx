"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Check,
  CreditCard,
  Download,
  AlertCircle,
  Smartphone,
  Banknote,
  Building,
  Zap,
  X,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: 499,
    description: "Ideal for small independent kiosks and single-counter shops.",
    current: false,
    features: [
      "1 Business Account",
      "Up to 2 Staff accounts",
      "Point of Sale (POS) checkout",
      "Inventory tracking & alerts",
      "Daily sales reports",
      "Telebirr & Cash recording",
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 999,
    description: "The complete operating system for retail stores and mini-marts.",
    current: true,
    features: [
      "Up to 5 Staff accounts",
      "Stock adjustment ledger with reasons",
      "Operating expense tracking",
      "True Estimated Gross Profit calculations",
      "CSV & Excel exports",
      "Priority local support",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 1999,
    description: "For high-volume wholesalers and multi-terminal operations.",
    current: false,
    features: [
      "Unlimited staff accounts & custom roles",
      "Multi-terminal simultaneous POS",
      "Complete immutable audit log",
      "Inventory onboarding & migration",
      "Dedicated account manager",
    ],
  },
];

const BILLING_HISTORY = [
  {
    id: "INV-2026-10",
    date: "Oct 01, 2026",
    plan: "Business Plan (Monthly)",
    amount: 999.0,
    status: "PAID",
    method: "Telebirr (Manual Verified)",
    ref: "TL-774912",
  },
  {
    id: "INV-2026-09",
    date: "Sep 01, 2026",
    plan: "Business Plan (Monthly)",
    amount: 999.0,
    status: "PAID",
    method: "CBE Birr (Manual Verified)",
    ref: "CBE-991204",
  },
  {
    id: "INV-2026-08",
    date: "Aug 01, 2026",
    plan: "Starter Plan (Monthly)",
    amount: 499.0,
    status: "PAID",
    method: "Telebirr (Manual Verified)",
    ref: "TL-551920",
  },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<(typeof BILLING_HISTORY)[0] | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Subscription & Billing
        </h1>
        <p className="text-sm text-slate-500">
          Manage your BizFlow Ethiopia software plan, limits, and local payment records
        </p>
      </div>

      {/* Current Active Subscription Banner */}
      <div className="bg-[#101827] text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#0D9668]/15 px-2.5 py-0.5 rounded-full border border-[#0D9668]/30">
              Active Plan
            </span>
            <span className="text-xs text-slate-400">Renews on Nov 01, 2026</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Business Tier <span className="text-[#0D9668] font-mono text-xl">(ETB 999 / mo)</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Active for your store. Covers up to 5 staff accounts, full stock movement ledgers, and gross profit analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#0D9668] hover:bg-[#097852] font-bold text-xs text-white shadow-md shadow-[#0D9668]/30 transition"
          >
            Change Plan
          </button>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl p-6 border flex flex-col justify-between transition ${
              plan.current
                ? "border-2 border-[#0D9668] shadow-lg shadow-[#0D9668]/10 relative"
                : "border-slate-200 shadow-2xs hover:shadow-md"
            }`}
          >
            {plan.current && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0D9668] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                Current Plan
              </span>
            )}

            <div>
              <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-8">{plan.description}</p>

              <div className="mt-4 flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-black text-slate-900">
                  {formatMoney(plan.price)}
                </span>
                <span className="text-xs text-slate-400 font-sans">/month</span>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                disabled={plan.current}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setIsUpgradeModalOpen(true);
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                  plan.current
                    ? "bg-[#DCEFE7] text-[#0D9668] cursor-default font-extrabold"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                {plan.current ? "Active Plan" : `Select ${plan.name}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ethiopian Local Payment Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div>
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building className="h-4 w-4 text-[#0D9668]" /> Local Subscription Payment Methods
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Subscriptions are billed monthly in Ethiopian Birr (ETB). No foreign currency required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Smartphone className="h-4 w-4 text-blue-600" /> Option 1: Telebirr
            </div>
            <p className="text-slate-600">
              Send payment to BizFlow Telebirr Merchant Code:{" "}
              <strong className="font-mono text-slate-900">928100</strong> or Phone{" "}
              <strong className="font-mono text-slate-900">+251 911 234567</strong>.
            </p>
            <p className="text-slate-500 text-[11px]">
              Include your Business Name as the transaction reference note.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <Banknote className="h-4 w-4 text-purple-600" /> Option 2: Commercial Bank of Ethiopia (CBE)
            </div>
            <p className="text-slate-600">
              Deposit or transfer to CBE Account:{" "}
              <strong className="font-mono text-slate-900">1000 3849 20194</strong> (BizFlow Ethiopia Ltd).
            </p>
            <p className="text-slate-500 text-[11px]">
              Accounts are confirmed and activated within 1 hour of payment confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Billing History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-500" /> Payment & Billing History
          </h2>
          <span className="text-xs text-slate-400 font-mono">Currency: ETB</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Plan Description</th>
                <th className="py-3 px-4 text-right">Amount (ETB)</th>
                <th className="py-3 px-4">Payment Method / Ref</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {BILLING_HISTORY.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.id}</td>
                  <td className="py-3.5 px-4 font-sans text-slate-500">{item.date}</td>
                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-800">
                    {item.plan}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatMoney(item.amount)}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-600">
                    <span>{item.method}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      Ref: {item.ref}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    <button
                      onClick={() => setActiveReceipt(item)}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0D9668] transition font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Upgrade / Change Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Plan Subscription Upgrade</h3>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                To upgrade or renew your plan, send your payment via Telebirr or CBE Birr with your store name as reference.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-slate-800">
                <p><strong>Telebirr Code:</strong> 928100</p>
                <p><strong>CBE Account:</strong> 1000 3849 20194</p>
                <p><strong>Support Hotline:</strong> +251 911 234567</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Our Addis Ababa support team will confirm and activate your tier within 1 hour.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-sans">
              <h3 className="font-bold text-slate-900 text-sm">Subscription Receipt</h3>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center space-y-1 py-2 font-sans">
              <h4 className="font-bold text-slate-900">BizFlow Ethiopia SaaS</h4>
              <p className="text-slate-500 text-[11px]">Invoice #{activeReceipt.id}</p>
              <p className="text-slate-400 text-[10px]">Addis Ababa, Ethiopia</p>
            </div>

            <div className="space-y-1.5 border-t border-b border-dashed border-slate-200 py-3 text-slate-700">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Plan:</span>
                <span>{activeReceipt.plan}</span>
              </div>
              <div className="flex justify-between">
                <span>Method:</span>
                <span>{activeReceipt.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Reference:</span>
                <span>{activeReceipt.ref}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span>{formatMoney(activeReceipt.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 font-sans">
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
