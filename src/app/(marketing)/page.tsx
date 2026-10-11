"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShoppingCart,
  Layers,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  ChevronRight,
  Package,
  Receipt,
  Users,
  BarChart3,
  Check,
  Sparkles,
  Banknote,
  DollarSign,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

export default function MarketingLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "reports">("pos");

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101827] antialiased selection:bg-[#0D9668] selection:text-white">
      {/* 01. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-[#101827] flex items-center justify-center font-bold text-white shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform duration-200">
              <span className="text-[#0D9668] font-black text-xl leading-none">B</span>
              <span className="text-white font-black text-xl leading-none">F</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#101827]">
                  BizFlow
                </span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-[#DCEFE7] text-[#0D9668] border border-[#0D9668]/20">
                  Ethiopia
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">
                Business Management SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#0D9668] transition">
              Features
            </a>
            <a href="#solutions" className="hover:text-[#0D9668] transition">
              Solutions
            </a>
            <a href="#preview" className="hover:text-[#0D9668] transition">
              Product Tour
            </a>
            <a href="#pricing" className="hover:text-[#0D9668] transition">
              Pricing
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-700 hover:text-[#0D9668] px-3 py-2 transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0D9668]/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 shadow-xl">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-700"
            >
              Features
            </a>
            <a
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-700"
            >
              Solutions
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-700"
            >
              Product Tour
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-700"
            >
              Pricing
            </a>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full text-center py-2.5 text-sm font-bold text-slate-800 border border-slate-300 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#0D9668] rounded-xl shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 02. HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 pointer-events-none -z-10 flex justify-center">
          <div className="w-[850px] h-[550px] bg-gradient-to-tr from-[#DCEFE7]/60 via-[#E0E7FF]/30 to-transparent rounded-full blur-3xl opacity-70 transform -translate-y-24" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline and Call to Actions (6 Cols) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-bold text-[#101827]">
                <span className="h-2 w-2 rounded-full bg-[#0D9668] animate-pulse" />
                <span>Designed for Retailers & Wholesalers in Ethiopia</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-[#101827] leading-[1.12]">
                Run your business. <br />
                <span className="text-[#0D9668]">Know your numbers.</span> <br />
                Grow with confidence.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Manage products, inventory, sales, expenses, and business performance from one simple platform built for growing businesses in Ethiopia.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#0D9668] hover:bg-[#097852] text-white font-bold text-base shadow-lg shadow-[#0D9668]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Start for Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/sales/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-base shadow-xs transition"
                >
                  <ShoppingCart className="h-4 w-4 text-[#0D9668]" />
                  <span>Try Live POS Terminal</span>
                </Link>
              </div>

              {/* Local payments trust indicators */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9668]" /> Ethiopian Birr (ETB)
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9668]" /> Telebirr & CBE Ready
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9668]" /> Installable PWA
                </span>
              </div>
            </div>

            {/* Right Column: Realistic Floating Dashboard Preview Mockup (6 Cols) */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl bg-[#101827] p-4 sm:p-5 shadow-2xl shadow-slate-900/30 border border-slate-800 text-white transition-all duration-300 hover:shadow-slate-900/40">
                {/* Mockup Window Titlebar */}
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                      bizflow.et/dashboard — Addis Mini Mart (Bole)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#0D9668] bg-[#0D9668]/10 px-2 py-0.5 rounded-full border border-[#0D9668]/30">
                      Live Store Data
                    </span>
                  </div>
                </div>

                {/* Dashboard KPI Grid in Mockup */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400 block">Today's Sales</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5 block">
                      {formatMoney(18450)}
                    </span>
                    <span className="text-[10px] text-[#0D9668] font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" /> +14.2% vs yesterday
                    </span>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400 block">Gross Profit (Est.)</span>
                    <span className="text-lg sm:text-xl font-bold font-mono text-[#0D9668] mt-0.5 block">
                      {formatMoney(5230)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      28.3% margin on COGS
                    </span>
                  </div>
                </div>

                {/* Simulated Real-Time POS Cart & Checkout Strip */}
                <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 mb-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5 text-[#0D9668]" />
                      Active Checkout (Invoice #BF-948210)
                    </span>
                    <span className="text-[11px] font-mono text-[#0D9668] bg-[#0D9668]/15 px-2 py-0.5 rounded">
                      Telebirr Verified
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
                    <div className="flex justify-between py-0.5 border-b border-slate-800">
                      <span>Magna Teff 5kg Bag × 1</span>
                      <span className="text-white font-bold">ETB 850.00</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-800">
                      <span>Ambo Mineral Water (500ml) × 2</span>
                      <span className="text-white font-bold">ETB 70.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-400">Total Paid:</span>
                    <span className="text-base font-extrabold text-white font-mono">
                      ETB 920.00
                    </span>
                  </div>
                </div>

                {/* Stock Movement Mini Ledger in Mockup */}
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-2">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-400" /> Low Stock Alerts
                    </span>
                    <span className="text-[#0D9668] text-[10px] font-bold">Auto-Reorder Level</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">Sunflower Cooking Oil 3L</p>
                      <p className="text-[10px] text-slate-500 font-mono">SKU: PAN-002</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                        8 left
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating accent badge */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white border border-slate-200 p-3.5 rounded-xl shadow-xl items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#DCEFE7] text-[#0D9668] flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#101827]">Multi-Tenant Safe</p>
                  <p className="text-[10px] text-slate-500">Zero cross-tenant data leaks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03. TRUST AND BENEFITS STRIP */}
      <section className="bg-white border-y border-slate-200/90 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#DCEFE7] text-[#0D9668] flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Inventory Visibility</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Always know what is on the shelf and in the backroom. Prevent stockouts and unexplained stock loss.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Faster Sales Tracking</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Barcode search, rapid cart additions, and instant receipts printed in seconds for waiting customers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Clear Expense Records</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Log shop rent, electricity, fiber internet, and transport so operational overhead never eats your profit.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reports in One Place</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Estimated Gross Profit calculated from snapshotted cost of goods sold. Export clear CSV summaries anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04. FEATURES SHOWCASE (Alternating Text and Previews) */}
      <section id="features" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#DCEFE7] px-3 py-1 rounded-full">
            Core Modules
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101827] tracking-tight">
            Built for the Daily Realities of Ethiopian Commerce
          </h2>
          <p className="text-slate-600 text-base">
            From busy counter checkout in Merkato or Bole to high-volume wholesale distribution, BizFlow keeps every transaction accountable.
          </p>
        </div>

        {/* Feature 1: Smart Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0D9668] bg-[#DCEFE7] px-2.5 py-1 rounded-md">
              <Package className="h-3.5 w-3.5" />
              <span>Smart Inventory Management</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#101827] tracking-tight">
              Know what is in stock before shelves run dry
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Paper notebooks lead to shrinkage and forgotten stock. BizFlow maintains an immutable stock ledger for every receipt, sale, return, and damage adjustment.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Mandatory reason codes for every manual inventory adjustment</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Automatic low-stock threshold notifications for fast reordering</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Prevents negative stock by default during busy cashier rushes</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="font-bold text-xs text-slate-800">Stock Movement Ledger</span>
              <span className="text-[11px] text-slate-400 font-mono">Real-Time Trace</span>
            </div>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-900 block font-sans">Ambo Mineral Water (500ml)</span>
                  <span className="text-[10px] text-slate-500 font-sans">Delivery PO-883</span>
                </div>
                <span className="text-emerald-700 font-bold font-mono">+150 units</span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-900 block font-sans">Magna Teff 5kg Bag</span>
                  <span className="text-[10px] text-slate-500 font-sans">Sale #BF-948209</span>
                </div>
                <span className="text-blue-700 font-bold font-mono">-1 unit</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-900 block font-sans">Sunflower Cooking Oil 3L</span>
                  <span className="text-[10px] text-slate-500 font-sans">Reason: Broken in storage</span>
                </div>
                <span className="text-amber-700 font-bold font-mono">-1 unit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Sales & Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="font-bold text-xs text-slate-800">Ethiopian Payment Recording</span>
              <span className="text-[11px] text-[#0D9668] font-bold">Manual Reference Guard</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl border border-[#0D9668] bg-[#DCEFE7]/30 text-center">
                <Smartphone className="h-5 w-5 text-[#0D9668] mx-auto mb-1" />
                <span className="font-bold text-xs text-[#101827]">Telebirr</span>
                <span className="text-[10px] text-slate-500 block">Code: TL-893021</span>
              </div>
              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 text-center">
                <Banknote className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <span className="font-bold text-xs text-[#101827]">CBE Birr</span>
                <span className="text-[10px] text-slate-500 block">Ref: CBE-481920</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Cash Received:</span>
                <span className="font-mono font-semibold">ETB 1,000.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sale Subtotal:</span>
                <span className="font-mono font-semibold">ETB 850.00</span>
              </div>
              <div className="flex justify-between text-[#0D9668] font-bold pt-1 border-t border-slate-200">
                <span>Change to Return:</span>
                <span className="font-mono">ETB 150.00</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Sales Management & POS</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#101827] tracking-tight">
              Fast counter checkout with Telebirr, CBE & Cash
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Customers don't like waiting in queues. Cashiers can complete sales in three clicks, apply authorized discounts, capture Telebirr or CBE confirmation codes, and hand over a clean receipt.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Price & cost snapshots at checkout prevent past reports from distorting</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Idempotent transactions eliminate double sales if a button is clicked twice</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Thermal receipt printing and mobile-friendly digital layout</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3: Gross Profit & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Financial Truth & Insights</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#101827] tracking-tight">
              True Estimated Gross Profit, not guesswork
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Revenue alone does not mean your shop is profitable. BizFlow accurately subtracts your cost of goods sold (COGS) to calculate your true gross profit, and clearly reports operational expenses separately.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Automated Gross Margin percentage tracking across product categories</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>Categorized shop overhead (rent, electricity, delivery logistics)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#0D9668] shrink-0" />
                <span>One-click CSV statements ready for your accountant or tax records</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="font-bold text-xs text-slate-800">Monthly P&L Snapshot</span>
              <span className="text-[11px] text-slate-400 font-mono">Currency: ETB</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-sans text-slate-600">Total Revenue:</span>
                <span className="font-bold text-slate-900">{formatMoney(184500)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 text-slate-500">
                <span className="font-sans text-slate-600">Cost of Goods Sold (COGS):</span>
                <span className="font-bold">-{formatMoney(132000)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 bg-[#DCEFE7]/40 px-3 rounded-lg text-[#0D9668] font-bold">
                <span className="font-sans">Estimated Gross Profit:</span>
                <span>{formatMoney(52500)} (28.4%)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 text-rose-600">
                <span className="font-sans text-slate-600">Operating Expenses:</span>
                <span className="font-bold">-{formatMoney(14250)}</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-slate-900 text-white px-3 rounded-lg font-bold">
                <span className="font-sans">Estimated Net Operational:</span>
                <span className="text-emerald-400">{formatMoney(38250)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05. INTERACTIVE PRODUCT PREVIEW */}
      <section id="preview" className="bg-[#101827] text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#0D9668]/15 px-3 py-1 rounded-full border border-[#0D9668]/30">
              Interactive Product Tour
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Designed for Speed. Engineered for Control.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Experience the core workflows your shop will use every day.
            </p>

            {/* Interactive Tab Selector */}
            <div className="inline-flex p-1 rounded-xl bg-slate-800/90 border border-slate-700/80 mt-4">
              <button
                onClick={() => setActiveTab("pos")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "pos"
                    ? "bg-[#0D9668] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1. POS Checkout
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "inventory"
                    ? "bg-[#0D9668] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2. Stock Control
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "reports"
                    ? "bg-[#0D9668] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3. Profit Statements
              </button>
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-4xl mx-auto shadow-2xl">
            {activeTab === "pos" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-[#0D9668]" />
                    <span className="font-bold text-sm">POS Counter Mode — Speed Checkout</span>
                  </div>
                  <Link
                    href="/sales/new"
                    className="text-xs text-[#0D9668] font-bold hover:underline flex items-center gap-1"
                  >
                    Open Live Terminal <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-xs text-white">Ambo Mineral Water (500ml)</p>
                        <p className="text-[10px] text-slate-400 font-mono">BEV-001 • 150 on hand</p>
                      </div>
                      <span className="font-bold text-xs text-[#0D9668] font-mono">ETB 35.00</span>
                    </div>
                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-xs text-white">Magna Teff 5kg Bag</p>
                        <p className="text-[10px] text-slate-400 font-mono">PAN-001 • 40 on hand</p>
                      </div>
                      <span className="font-bold text-xs text-[#0D9668] font-mono">ETB 850.00</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-2">Cart Summary</span>
                      <div className="text-xs space-y-1 font-mono">
                        <div className="flex justify-between text-slate-300">
                          <span>Subtotal:</span>
                          <span>ETB 920.00</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Discount:</span>
                          <span className="text-emerald-400">ETB 0.00</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                          <span>Grand Total:</span>
                          <span className="text-[#0D9668]">ETB 920.00</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/sales/new"
                      className="mt-4 w-full py-2.5 bg-[#0D9668] text-white font-bold text-xs rounded-lg text-center shadow-md hover:bg-[#097852] transition"
                    >
                      Complete Checkout
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#0D9668]" /> Stock Ledger with Mandatory Reason Codes
                  </span>
                  <Link
                    href="/inventory"
                    className="text-xs text-[#0D9668] font-bold hover:underline flex items-center gap-1"
                  >
                    View Inventory <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-300 border-b border-slate-700 pb-2">
                    <span>Receipt: 25L Sunflower Oil</span>
                    <span className="text-emerald-400 font-bold">+25 units (Delivery PO-883)</span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-b border-slate-700 pb-2">
                    <span>Adjustment: Ambo Water Bottle</span>
                    <span className="text-amber-400 font-bold">-1 unit (Glass broken in storage)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>POS Deduction: Magna Teff</span>
                    <span className="text-blue-400 font-bold">-1 unit (Invoice #BF-948209)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#0D9668]" /> Cost-Snapshotted Gross Margins
                  </span>
                  <Link
                    href="/reports"
                    className="text-xs text-[#0D9668] font-bold hover:underline flex items-center gap-1"
                  >
                    View Reports <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Gross Sales</span>
                    <span className="text-base font-bold font-mono text-white mt-1 block">ETB 184.5k</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">COGS Costs</span>
                    <span className="text-base font-bold font-mono text-slate-300 mt-1 block">ETB 132.0k</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D9668]/20 border border-[#0D9668]/40">
                    <span className="text-[10px] text-[#0D9668] font-bold block">Gross Profit</span>
                    <span className="text-base font-bold font-mono text-[#0D9668] mt-1 block">ETB 52.5k</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 06. PRICING SECTION */}
      <section id="pricing" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#DCEFE7] px-3 py-1 rounded-full">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101827] tracking-tight">
            Predictable Plans in Ethiopian Birr (ETB)
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            No foreign exchange surprises. Pay monthly or annually via Telebirr or CBE Birr.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {/* Starter Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div>
              <h3 className="text-xl font-bold text-[#101827]">Starter</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-8">
                Best for small independent neighborhood kiosks and single-counter shops.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#101827] font-mono">
                  {formatMoney(499)}
                </span>
                <span className="text-xs text-slate-500">/month</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> 1 Business account
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Up to 2 Staff accounts (Owner + Cashier)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> POS Sales & Receipt printing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Stock ledger & low-stock alerts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Daily sales report
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center transition"
              >
                Choose Starter
              </Link>
            </div>
          </div>

          {/* Business Plan (Recommended) */}
          <div className="bg-white rounded-2xl border-2 border-[#0D9668] p-8 flex flex-col justify-between shadow-xl shadow-[#0D9668]/10 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0D9668] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Most Popular
            </span>

            <div>
              <h3 className="text-xl font-bold text-[#101827]">Business</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-8">
                The complete operating system for retail shops, supermarkets, and pharmacies.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#101827] font-mono">
                  {formatMoney(999)}
                </span>
                <span className="text-xs text-slate-500">/month</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Up to 5 Staff accounts (Managers, Cashiers)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Stock adjustments with mandatory reasons
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Expense tracking & categorization
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> True Estimated Gross Profit statements
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> CSV export for business accounting
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Priority local phone & Telegram support
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl bg-[#0D9668] hover:bg-[#097852] text-white font-bold text-xs flex items-center justify-center shadow-md shadow-[#0D9668]/30 transition"
              >
                Choose Business Plan
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div>
              <h3 className="text-xl font-bold text-[#101827]">Pro</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-8">
                For high-volume wholesalers, multi-counter stores, and expanding operations.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-[#101827] font-mono">
                  {formatMoney(1999)}
                </span>
                <span className="text-xs text-slate-500">/month</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Unlimited staff accounts & custom roles
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Multi-counter simultaneous POS terminals
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Full immutable security audit logs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Onboarding assistance & inventory migration
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#0D9668]" /> Dedicated account manager
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center transition"
              >
                Choose Pro Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 07. FINAL CALL TO ACTION (Deep Navy with Emerald Accents) */}
      <section className="bg-[#101827] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10 flex justify-end">
          <div className="w-[600px] h-[400px] bg-[#0D9668]/15 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Your business deserves better visibility.
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-base">
            Bring your daily business operations together with BizFlow. Start today and manage sales, stock, and profits from one unified dashboard.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#0D9668] hover:bg-[#097852] font-bold text-base text-white shadow-xl shadow-[#0D9668]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started Today</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            No long-term lock-in • Local Ethiopian support • Setup in minutes
          </p>
        </div>
      </section>

      {/* 08. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#0D9668] flex items-center justify-center font-bold text-white">
                BF
              </div>
              <span className="font-extrabold text-base text-white">BizFlow Ethiopia</span>
            </div>

            <div className="flex items-center gap-6 font-medium">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#preview" className="hover:text-white transition">Product Tour</a>
              <a href="#pricing" className="hover:text-white transition">Pricing</a>
              <Link href="/login" className="hover:text-white transition">Sign In</Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} BizFlow Ethiopia. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span>Made with pride for Ethiopian Businesses</span> 🇪🇹
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
