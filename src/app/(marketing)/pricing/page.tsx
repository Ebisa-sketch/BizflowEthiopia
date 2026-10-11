import React from "react";
import Link from "next/link";
import { Check, Building2, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";

const TIERS = [
  {
    name: "Starter",
    price: 499,
    description: "Ideal for small independent neighborhood kiosks and single-counter shops.",
    features: [
      "1 Business Account",
      "Up to 2 Staff accounts (Owner + Cashier)",
      "Point of Sale (POS) checkout",
      "Real-time Inventory tracking",
      "Low-stock alert warnings",
      "Basic sales reports",
      "Cash & Telebirr recording",
    ],
    highlight: false,
  },
  {
    name: "Business",
    price: 999,
    popular: true,
    description: "The complete operating system for retail shops, supermarkets, and mini-marts.",
    features: [
      "Everything in Starter, plus:",
      "Up to 5 Staff accounts (Managers, Cashiers)",
      "Stock adjustment ledger with mandatory reasons",
      "Operating expense tracking & categorization",
      "True Estimated Gross Profit calculations",
      "CSV & Excel export capabilities",
      "Priority phone & Telegram support",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: 1999,
    description: "For high-volume wholesalers, multi-counter stores, and expanding businesses.",
    features: [
      "Everything in Business, plus:",
      "Unlimited staff accounts & custom permissions",
      "Multiple simultaneous POS terminals",
      "Comprehensive audit trail & logs",
      "Dedicated account manager",
      "Staff training & initial inventory import",
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">BizFlow Ethiopia</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Transparent, Local Pricing in Ethiopian Birr (ETB)
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base">
          No hidden fees or dollar exchange complications. Pay monthly via Telebirr or CBE Birr.
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 flex flex-col justify-between transition ${
                tier.highlight
                  ? "bg-slate-800/90 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 relative"
                  : "bg-slate-900 border border-slate-800"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="text-xs text-slate-400 mt-2 min-h-10">{tier.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">
                    {formatMoney(tier.price)}
                  </span>
                  <span className="text-slate-400 text-xs">/month</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/60">
                <Link
                  href="/dashboard"
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    tier.highlight
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  <span>Start with {tier.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
