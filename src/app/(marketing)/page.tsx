"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Check,
  ShieldCheck,
  Zap,
  Lock,
  Banknote,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  Building2,
  RefreshCw,
  Target,
  Star,
  Quote,
  Headphones,
  Menu,
  X,
  Cloud,
} from "lucide-react";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";

/* ─────────────────────────────────────────────────────────────
   02. HERO SECTION
   Deep Forest Pine (#072623 to #051E1C) with Vibrant Emerald
───────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-[#072623] via-[#062220] to-[#051E1C] text-white pt-12 pb-20 lg:pt-16 lg:pb-24">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[650px] h-[450px] bg-[#00D084]/15 rounded-full blur-[140px]" />
        <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D084]/10 border border-[#00D084]/30 text-xs font-semibold text-emerald-300">
              <span className="text-[#00D084]">•</span>
              Built for Ethiopian Businesses
              <span className="text-[#00D084]">•</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.65rem] font-black tracking-tight text-white leading-[1.12]">
              Run your business. <br />
              <span className="text-[#00D084] drop-shadow-[0_0_25px_rgba(0,208,132,0.3)]">Know your numbers.</span> <br />
              Grow with confidence.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-emerald-100/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              BizFlow Ethiopia is a complete business management platform for retailers, wholesalers and small businesses. Manage your inventory, sales, expenses and get real-time insights — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-[#051E1C] font-black text-base bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#00E591] hover:to-[#04885f] shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Start for Free
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>

              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white/5 border border-white/20 hover:border-white/40 hover:bg-white/10 text-white font-semibold text-base transition-all duration-200"
              >
                <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-2 text-xs font-medium text-emerald-200/80">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#00D084] stroke-[3]" /> No credit card required
              </span>
              <span className="hidden sm:inline text-emerald-800">|</span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#00D084] stroke-[3]" /> 30-day free trial
              </span>
              <span className="hidden sm:inline text-emerald-800">|</span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#00D084] stroke-[3]" /> Cancel anytime
              </span>
            </div>
          </div>

          {/* Right Visual: Photorealistic 3D Laptop + Phone Showcase */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[580px]">
              {/* Glow backdrop behind mockup */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#00D084]/20 to-emerald-600/10 rounded-3xl blur-2xl -z-10" />

              {/* High-Resolution Device Showcase Frame */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-[#0F3A36] aspect-[16/10] bg-[#072623]">
                <Image
                  src="/images/hero_devices_mockup.jpg"
                  alt="BizFlow Ethiopia software running on modern laptop and smartphone"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 580px"
                  priority
                />

                {/* Subtle glass reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
              </div>

              {/* Floating Pill Badge: "Trusted by 1,000+ Ethiopian businesses" */}
              <div className="absolute -bottom-4 right-4 sm:right-8 bg-white text-slate-900 px-5 py-2.5 rounded-full shadow-2xl border border-slate-100 flex items-center gap-3 z-20">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900 leading-tight">Trusted by 1,000+</p>
                  <p className="text-[10px] text-slate-500 font-medium">Ethiopian businesses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   03. WHY CHOOSE BIZFLOW ("Built for Ethiopian businesses")
   Pure White Section with Emerald & Pine Accents
───────────────────────────────────────────────────────────── */
function WhyChooseSection() {
  const reasons = [
    {
      icon: Banknote,
      title: "Local Currency & Payments",
      description: "Work with ETB, Telebirr and CBE payment records.",
    },
    {
      icon: ShieldCheck,
      title: "Multi-Tenant Security",
      description: "Keep your business data safe and isolated.",
    },
    {
      icon: Zap,
      title: "Easy to Use",
      description: "No technical skills required. Get started in minutes.",
    },
    {
      icon: Lock,
      title: "Reliable & Secure",
      description: "Your data is protected with industry-standard security.",
    },
  ];

  return (
    <section id="why-choose" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text & 4 Features */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#E8F7F1] px-3.5 py-1.5 rounded-full border border-[#C3ECD8]">
                WHY CHOOSE BIZFLOW
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black text-[#072623] tracking-tight leading-tight">
                Built for Ethiopian <br />
                businesses
              </h2>
              <p className="mt-3 text-slate-600 text-base max-w-lg leading-relaxed">
                We understand the unique needs of local businesses. That&apos;s why BizFlow is designed to be simple, reliable and affordable.
              </p>
            </div>

            {/* 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
              {reasons.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] border border-[#C3ECD8] flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-[#00D084]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#072623]">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual: Asymmetrical Emerald Curve Shape + Spice Store + Receipt */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            <div className="relative w-full max-w-[420px]">
              {/* Vibrant Asymmetrical Emerald Curve Shape */}
              <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-br from-[#00D084] to-[#059669] rounded-[3rem] -rotate-2 opacity-95 -z-10 shadow-xl shadow-emerald-500/20" />

              {/* Photo Frame Container */}
              <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl aspect-[4/3] bg-slate-100">
                <Image
                  src="/images/ethiopian_store_spices.jpg"
                  alt="Authentic Ethiopian grocery and spice market"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                  priority
                />
              </div>

              {/* Floating Payment Received Receipt Card */}
              <div className="absolute -bottom-8 -right-3 sm:-right-6 w-60 sm:w-64 bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-5 space-y-3.5 z-20">
                <div className="text-center">
                  <div className="h-9 w-9 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Payment Received</h4>
                  <p className="text-lg font-black text-[#0D9668] font-mono mt-0.5">
                    ETB 1,250.00
                  </p>
                  <p className="text-[10px] text-slate-400">Cash Payment</p>
                </div>

                <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Cash</span>
                    <span className="font-mono font-medium">ETB 1,250.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Change</span>
                    <span className="font-mono font-medium">ETB 0.00</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-slate-900">
                    <span>Total</span>
                    <span className="font-mono text-[#0D9668]">ETB 1,250.00</span>
                  </div>
                </div>
              </div>

              {/* Handwritten Script Annotation in bottom-right */}
              <div className="absolute -bottom-16 right-2 text-right">
                <span className="font-handwriting text-3xl sm:text-4xl text-[#072623] rotate-[-5deg] inline-block font-bold tracking-wide">
                  Local. Simple. Powerful.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   04. TRUSTED BY BUSINESSES (STATS STRIP)
   "Real results from real businesses" with soft sage tint (#F0FAF5)
───────────────────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { icon: Building2, value: "1,000+", label: "Active Businesses" },
    { icon: RefreshCw, value: "15,000+", label: "Daily Transactions" },
    { icon: Target, value: "99.9%", label: "System Uptime" },
    { icon: Star, value: "4.8/5", label: "Customer Satisfaction" },
  ];

  return (
    <section className="py-14 bg-[#F0FAF5] border-y border-emerald-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-emerald-100 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0D9668] border border-emerald-200">
            TRUSTED BY BUSINESSES
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#072623] tracking-tight">
            Real results from real businesses
          </h2>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((item, idx) => (
            <div
              key={item.label}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl ${
                idx < 3 ? "lg:border-r border-emerald-200/60" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-white border border-emerald-100 shadow-xs flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-[#00D084]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-black text-[#072623] tracking-tight font-sans">
                  {item.value}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   05. OUR SOLUTIONS ("Everything you need to manage your business")
   Pure White Section + Smiling Ethiopian shopkeeper with tablet
───────────────────────────────────────────────────────────── */
function SolutionsSection() {
  const solutions = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock, set alerts, reduce losses.",
    },
    {
      icon: ShoppingCart,
      title: "Point of Sale (POS)",
      description: "Fast and simple checkout for your customers.",
    },
    {
      icon: FileText,
      title: "Sales & Invoices",
      description: "Create invoices, manage sales and refunds.",
    },
    {
      icon: CreditCard,
      title: "Expense Tracking",
      description: "Record and categorize business expenses.",
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Real-time insights into your business performance.",
    },
    {
      icon: Users,
      title: "Multi-User & Permissions",
      description: "Manage staff and control access levels.",
    },
  ];

  return (
    <section id="solutions" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Heading & 6 Cards */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#E8F7F1] px-3.5 py-1.5 rounded-full border border-[#C3ECD8]">
                OUR SOLUTIONS
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black text-[#072623] tracking-tight leading-tight">
                Everything you need to <br />
                manage your business
              </h2>
              <p className="mt-3 text-slate-600 text-base max-w-lg leading-relaxed">
                From sales to inventory, expenses to reports — BizFlow gives you the tools to run your business more efficiently and profitably.
              </p>
            </div>

            {/* 6 Solution Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {solutions.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-[#F0FAF5] transition-all duration-200 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] border border-[#C3ECD8] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <item.icon className="h-5 w-5 text-[#00D084]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#072623] group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Ethiopian Store Owner Photo with Tablet */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            {/* Cursive Handwriting Annotation with Curved Arrow */}
            <div className="self-end mb-2 mr-6 text-right">
              <span className="font-handwriting text-2xl sm:text-3xl text-[#072623] rotate-[-3deg] inline-block font-bold">
                More than software, <br />
                we&apos;re your business partner.
              </span>
              {/* Curved SVG arrow */}
              <div className="w-14 h-8 ml-auto -mt-1 text-[#00D084]">
                <svg viewBox="0 0 60 30" fill="none" className="w-full h-full stroke-current stroke-2">
                  <path d="M 10 5 Q 35 2 45 22" strokeLinecap="round" strokeDasharray="3 3" />
                  <polyline points="40,22 45,24 48,17" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Photo Container with Organic Emerald Backdrop */}
            <div className="relative w-full max-w-[380px]">
              {/* Vibrant Emerald Curved Shape Behind */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-[#00D084] to-[#059669] rounded-[3rem] rotate-2 opacity-95 -z-10 shadow-xl shadow-emerald-500/20" />

              {/* Photo Frame */}
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[3/4] bg-slate-900 border-4 border-white">
                <Image
                  src="/images/store_owner_tablet.jpg"
                  alt="Smiling Ethiopian business owner managing store with BizFlow on tablet"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 380px"
                  priority
                />
              </div>

              {/* Floating Pill Card: "Manage your store anytime, anywhere" */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] bg-white rounded-full py-2.5 px-4 shadow-xl border border-slate-100 flex items-center justify-center gap-2.5 z-20">
                <Cloud className="h-4 w-4 text-[#00D084]" />
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                  Manage your store anytime, anywhere
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   06. PRODUCT TOUR (Deep Forest Pine Section #072623)
   Interactive SaaS Workflow Showcase with zero blue clash
───────────────────────────────────────────────────────────── */
function ProductTourSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      icon: Package,
      title: "Add Products",
      badge: "Catalog Setup",
      description: "Create your product catalog, categories, barcodes, and purchase prices.",
      highlight: "Barcode scanning & low-stock alerts",
      preview: {
        title: "Product Catalog Management",
        subtitle: "Easily add items with prices in ETB, batch tracking, and categories.",
        stats: [
          { label: "Total Catalog Items", value: "1,420 items" },
          { label: "Low Stock Alert", value: "4 items" },
          { label: "Active Categories", value: "18 categories" },
        ],
        sampleItems: [
          { name: "Wheat Flour (50kg)", category: "Grains & Flour", price: "ETB 3,850", stock: "45 in stock", status: "In Stock" },
          { name: "Pure Sunflower Oil (5L)", category: "Cooking Oil", price: "ETB 1,250", stock: "12 in stock", status: "In Stock" },
          { name: "Ethiopian Coffee Beans (1kg)", category: "Beverages", price: "ETB 650", stock: "3 in stock", status: "Low Stock" },
        ],
      },
    },
    {
      num: "02",
      icon: ShoppingCart,
      title: "Record Sales",
      badge: "Point of Sale",
      description: "Use the fast POS register for quick checkout with Cash, Telebirr, or CBE Birr.",
      highlight: "Instant receipt printing & split payments",
      preview: {
        title: "Point of Sale (POS) Checkout",
        subtitle: "High-speed touchscreen register with barcode support and split payments.",
        stats: [
          { label: "Today's POS Sales", value: "ETB 24,850" },
          { label: "Transactions", value: "84 orders" },
          { label: "Telebirr Share", value: "68% cashless" },
        ],
        sampleItems: [
          { name: "Sale #BF-9041 (Customer: Abebe K.)", category: "Cash Payment", price: "ETB 1,250", stock: "Completed", status: "Paid" },
          { name: "Sale #BF-9042 (Customer: Mekdes T.)", category: "Telebirr (Ref: TB-8821)", price: "ETB 3,450", stock: "Completed", status: "Paid" },
          { name: "Sale #BF-9043 (Customer: Walk-in)", category: "CBE Birr", price: "ETB 890", stock: "Completed", status: "Paid" },
        ],
      },
    },
    {
      num: "03",
      icon: RefreshCw,
      title: "Update Stock",
      badge: "Real-time Sync",
      description: "Inventory auto-deducts instantly with every sale and tracks loss reasons.",
      highlight: "Automatic stock ledger & audit trail",
      preview: {
        title: "Automated Inventory & Ledger",
        subtitle: "Zero manual counting needed. Stock updates in real time with mandatory adjustment reasons.",
        stats: [
          { label: "Inventory Valuation", value: "ETB 348,200" },
          { label: "Stock Accuracy", value: "99.8%" },
          { label: "Reorder Triggered", value: "2 suppliers" },
        ],
        sampleItems: [
          { name: "Auto Deduct: Sale #BF-9042", category: "Automatic Sale Deduction", price: "-2 items", stock: "Ledger updated", status: "Auto" },
          { name: "Restock: Sugar (25kg x 20 bags)", category: "Purchase Order #PO-104", price: "+20 items", stock: "Ledger updated", status: "Restock" },
          { name: "Stock Adjustment (Flour damaged)", category: "Spillage / Damaged Stock", price: "-1 item", stock: "Audited", status: "Audited" },
        ],
      },
    },
    {
      num: "04",
      icon: BarChart3,
      title: "View Reports",
      badge: "Analytics & P&L",
      description: "Get real-time gross profit, daily sales summaries, and tax compliance data.",
      highlight: "Export to Excel, PDF & accounting ready",
      preview: {
        title: "Executive Reports & Profit Analytics",
        subtitle: "Know your exact profit margins, best-selling goods, and staff performance.",
        stats: [
          { label: "Net Gross Margin", value: "32.4%" },
          { label: "Top Selling Item", value: "Cooking Oil 5L" },
          { label: "Weekly Growth", value: "+18.5% YoY" },
        ],
        sampleItems: [
          { name: "Daily P&L Statement (Today)", category: "Sales ETB 24,850 · Cost ETB 16,400", price: "ETB 8,450 Net", stock: "Profit margin 34%", status: "Profitable" },
          { name: "Expense Breakdown (Rent & Staff)", category: "Operating overheads", price: "ETB 3,200", stock: "Categorized", status: "Expense" },
          { name: "Tax Summary Report (VAT / TOT)", category: "Monthly tax reconciliation", price: "Export Ready", stock: "PDF & Excel", status: "Ready" },
        ],
      },
    },
  ];

  const current = steps[activeStep];

  return (
    <section id="product-tour" className="py-20 lg:py-28 bg-[#072623] text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00D084]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00D084] bg-[#00D084]/10 px-3.5 py-1.5 rounded-full border border-[#00D084]/30 inline-block">
              PRODUCT TOUR
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              From product to profit <br />
              in just a few steps
            </h2>
            <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed">
              See how BizFlow helps you manage your daily operations seamlessly from start to finish.
            </p>
          </div>

          <div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[#051E1C] font-bold text-sm bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#00E591] hover:to-[#04885f] shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Explore Full Tour</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* 4 Stepped Workflow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => {
            const isActive = activeStep === index;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`relative text-left p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                  isActive
                    ? "bg-[#0A322E] border-2 border-[#00D084] shadow-xl shadow-emerald-500/15 -translate-y-1"
                    : "bg-[#06201E]/80 border border-[#0F3A36] hover:border-[#00D084]/40 hover:bg-[#0A322E]/60"
                }`}
              >
                <div>
                  {/* Top Row: Icon + Step Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-gradient-to-br from-[#00D084] to-[#059669] text-[#051E1C] shadow-lg shadow-emerald-500/30 scale-105"
                          : "bg-[#0D3833] text-[#00D084] group-hover:bg-[#0F423C]"
                      }`}
                    >
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                        isActive
                          ? "bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40"
                          : "bg-[#0D3833] text-emerald-200/60"
                      }`}
                    >
                      Step {step.num}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`text-lg font-bold transition-colors ${
                      isActive ? "text-[#00D084]" : "text-white group-hover:text-emerald-100"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs text-emerald-100/70 mt-2 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Highlight Tag */}
                <div className="pt-5 mt-5 border-t border-[#0F3A36] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#00D084]/90 truncate">
                    {step.badge}
                  </span>
                  <div
                    className={`h-2 w-2 rounded-full transition-all ${
                      isActive ? "bg-[#00D084] ring-4 ring-[#00D084]/20" : "bg-[#0D3833]"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Interactive Step Preview Screen */}
        <div className="mt-8 rounded-3xl bg-[#06201E] border border-[#0F3A36] p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          {/* Top Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#0F3A36]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#00D084] mb-1">
                <span className="h-2 w-2 rounded-full bg-[#00D084] animate-pulse" />
                <span>Step {current.num} Workflow Preview</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {current.preview.title}
              </h4>
              <p className="text-xs sm:text-sm text-emerald-100/70 mt-0.5">
                {current.preview.subtitle}
              </p>
            </div>

            {/* Quick action button for the step */}
            <div className="shrink-0 flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs font-medium text-emerald-200/60">
                Click any step above to explore
              </span>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00D084]/10 hover:bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30 text-xs font-bold transition"
              >
                <span>Try this feature</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 3 Metric Mini Cards for this Step */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            {current.preview.stats.map((st) => (
              <div key={st.label} className="bg-[#0A322E] border border-[#0F3A36] rounded-xl p-4">
                <span className="text-xs text-emerald-200/60 block font-medium">{st.label}</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-white block mt-1">
                  {st.value}
                </span>
              </div>
            ))}
          </div>

          {/* Sample Table / Workflow Rows */}
          <div className="mt-6 rounded-2xl bg-[#082825] border border-[#0F3A36] overflow-hidden">
            <div className="px-4 py-3 bg-[#0A322E] border-b border-[#0F3A36] flex items-center justify-between text-xs font-bold text-emerald-100/90">
              <span>Item / Activity Record</span>
              <span className="hidden sm:inline">Details / Method</span>
              <span>Amount / Stock</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-[#0F3A36] text-xs">
              {current.preview.sampleItems.map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between gap-3 text-slate-200">
                  <span className="font-semibold text-white flex-1 truncate">{item.name}</span>
                  <span className="hidden sm:inline text-emerald-200/60 flex-1 truncate">{item.category}</span>
                  <span className="font-mono text-[#00D084] font-bold">{item.price}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/25">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   07. TESTIMONIALS ("Trusted by business owners across Ethiopia")
   Pure White Section with 3 Customer Cards
───────────────────────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "BizFlow has made our store management so much easier. I can now track everything from my phone.",
      name: "Mekdes Tadesse",
      role: "Retail Shop Owner, Addis Ababa",
      image: "/images/avatar_mekdes.jpg",
    },
    {
      quote:
        "The reports help me make better decisions. Our sales have increased since we started using BizFlow.",
      name: "Getachew Alemu",
      role: "Wholesaler, Dire Dawa",
      image: "/images/avatar_getachew.jpg",
    },
    {
      quote:
        "Simple, fast and reliable. I highly recommend it to any business owner in Ethiopia.",
      name: "Selamawit Bekele",
      role: "Mini Mart Owner, Bahir Dar",
      image: "/images/avatar_selamawit.jpg",
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#E8F7F1] px-3.5 py-1.5 rounded-full border border-[#C3ECD8]">
            WHAT OUR CUSTOMERS SAY
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-[#072623] tracking-tight">
            Trusted by business owners across Ethiopia
          </h2>
        </div>

        {/* 3 Testimonials Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Quotation mark */}
                <Quote className="h-7 w-7 text-[#00D084]/40 mb-4 rotate-180" />
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3.5 mt-8 pt-5 border-t border-slate-100">
                <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-emerald-500/20 shrink-0">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   08. FINAL CTA BANNER
   Deep Forest Pine (#072623) & Vibrant Emerald Card
───────────────────────────────────────────────────────────── */
function FinalCTASection() {
  return (
    <section className="relative bg-gradient-to-b from-white via-[#F0FAF5] to-[#072623] pt-12 pb-14 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#062421] via-[#0A332C] to-[#062421] p-8 sm:p-12 lg:p-14 border border-[#00D084]/30 shadow-2xl shadow-emerald-950/40 text-white">
          {/* Ambient Corner Glows & Radial Gradients */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00D084]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(#00D084 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D084]/15 border border-[#00D084]/30 text-xs font-bold text-[#00D084] uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-[#00D084] animate-pulse" />
                READY TO GET STARTED?
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-white tracking-tight leading-[1.15]">
                Join thousands of Ethiopian <br className="hidden sm:inline" />
                businesses growing with BizFlow.
              </h2>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-emerald-100/80 max-w-xl font-normal leading-relaxed">
                Start your 30-day free trial today. No credit card required.
              </p>

              {/* Trust Checkmarks Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-emerald-100/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#00D084] stroke-[3]" /> Instant Setup
                </span>
                <span className="text-emerald-700 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#00D084] stroke-[3]" /> Telebirr &amp; CBE Ready
                </span>
                <span className="text-emerald-700 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#00D084] stroke-[3]" /> Cancel Anytime
                </span>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex flex-col items-center lg:items-end gap-3.5 shrink-0 w-full sm:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full text-[#051E1C] font-black text-base bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#00E591] hover:to-[#04885f] shadow-xl shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                <span>Start for Free</span>
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white transition py-1"
              >
                <Headphones className="h-4 w-4 text-[#00D084]" />
                <span>Need help? Contact us</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────── */
export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#072623] antialiased selection:bg-[#00D084] selection:text-[#051E1C] font-sans">
      <MarketingNavbar currentPath="/" />
      <HeroSection />
      <WhyChooseSection />
      <StatsSection />
      <SolutionsSection />
      <ProductTourSection />
      <TestimonialsSection />
      <FinalCTASection />
      <MarketingFooter />
    </div>
  );
}
