"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";

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
    <div className="min-h-screen bg-[#072623] text-white selection:bg-[#00D084] selection:text-[#051E1C]">
      {/* Unified Marketing Navbar */}
      <MarketingNavbar currentPath="/pricing" />

      {/* Main Pricing Hero & Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D084]/15 border border-[#00D084]/30 text-xs font-bold text-[#00D084] uppercase tracking-wider mb-2">
          TRANSPARENT PRICING
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Simple, Local Pricing in Ethiopian Birr (ETB)
        </h1>
        <p className="text-emerald-100/70 max-w-2xl mx-auto text-base sm:text-lg">
          No hidden fees or foreign currency complications. Pay monthly or annually via Telebirr or CBE Birr.
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                tier.highlight
                  ? "bg-[#0A322E] border-2 border-[#00D084] shadow-2xl shadow-emerald-500/20 relative -translate-y-2"
                  : "bg-[#06201E]/90 border border-[#0F3A36] hover:border-[#00D084]/40"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00D084] text-[#051E1C] text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-lg">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                <p className="text-xs text-emerald-100/70 mt-2 min-h-10 leading-relaxed">
                  {tier.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                    {formatMoney(tier.price)}
                  </span>
                  <span className="text-emerald-200/60 text-xs font-medium">/month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-xs text-emerald-100/90">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#00D084] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-6 border-t border-[#0F3A36]">
                <Link
                  href="/register"
                  className={`w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 ${
                    tier.highlight
                      ? "bg-gradient-to-r from-[#00D084] to-[#059669] text-[#051E1C] shadow-lg shadow-emerald-500/30"
                      : "bg-[#0D3833] hover:bg-[#0F423C] text-white border border-[#0F3A36]"
                  }`}
                >
                  <span>Start with {tier.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Unified Marketing Footer */}
      <MarketingFooter />
    </div>
  );
}
