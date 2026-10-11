"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Target,
  Heart,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  MapPin,
  Star,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const VALUES = [
  {
    icon: Target,
    title: "Ethiopian-First Design",
    description: "Every feature is crafted for Ethiopian business workflows — Birr currency, Telebirr, CBE Birr, and local market terminology by default.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description: "Your financial data is never shared. Full audit trails, immutable stock ledgers, and clear estimated profit calculations — no hidden formulas.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: Zap,
    title: "Simplicity Over Complexity",
    description: "From first sign-up to first sale in under 5 minutes. No training manuals needed — if you can use a phone, you can run BizFlow.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: Heart,
    title: "Built for Growth",
    description: "Start with a single kiosk counter. Scale to multi-branch operations. Your data grows with you — no migration, no loss.",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
];

const TEAM = [
  {
    name: "Abebe Getachew",
    role: "Co-Founder & CEO",
    bio: "Former fintech product lead at Ethio Telecom. Passionate about digitizing Ethiopian small businesses.",
    initials: "AG",
    color: "bg-blue-600",
  },
  {
    name: "Meron Tadesse",
    role: "Co-Founder & CTO",
    bio: "Full-stack engineer with 8 years of experience. Previously built banking systems for Commercial Bank of Ethiopia.",
    initials: "MT",
    color: "bg-emerald-600",
  },
  {
    name: "Hana Bekele",
    role: "Head of Product",
    bio: "UX researcher who spent 2 years studying how Ethiopian shop owners track sales — pen, paper, and memory.",
    initials: "HB",
    color: "bg-purple-600",
  },
  {
    name: "Dawit Mekonnen",
    role: "Head of Operations",
    bio: "Operations specialist managing merchant onboarding and local support across Addis Ababa and regional cities.",
    initials: "DM",
    color: "bg-amber-600",
  },
];

const MILESTONES = [
  { year: "2024", event: "Idea validated with 50 shop owners in Merkato" },
  { year: "2025", event: "MVP launched, first 100 businesses onboarded" },
  { year: "2026", event: "BizFlow Business Plan launched with full P&L reporting" },
  { year: "2027", event: "Target: 5,000 active businesses across Ethiopia" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#101827] flex items-center justify-center font-bold text-white shadow-xs">
              <span className="text-[#0D9668] font-black text-lg leading-none">B</span>
              <span className="text-white font-black text-lg leading-none">F</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              BizFlow <span className="text-[#0D9668]">Ethiopia</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition">Home</Link>
            <Link href="/about" className="text-[#0D9668]">About</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
            <Link href="/contact" className="hover:text-slate-900 transition">Contact</Link>
          </nav>
          <Link
            href="/login"
            className="rounded-xl bg-[#0D9668] hover:bg-[#097852] px-5 py-2 text-sm font-bold text-white shadow-sm transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#101827] via-[#1e293b] to-[#0f172a] py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#0D9668]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#0D9668]/10 border border-[#0D9668]/20 px-4 py-1.5 rounded-full mb-6">
            Our Story
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Empowering Ethiopian{" "}
            <span className="bg-gradient-to-r from-[#0D9668] to-[#10b981] bg-clip-text text-transparent">
              Small Businesses
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            BizFlow Ethiopia was born from a simple observation: millions of Ethiopian shop owners
            still track their businesses with pen, paper, and memory. We&apos;re building the operating system
            they deserve — affordable, accessible, and 100% Ethiopian.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#0D9668] py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 text-center text-white">
          {[
            { value: "500+", label: "Active Businesses" },
            { value: "12,000+", label: "Monthly Transactions" },
            { value: "ETB 45M+", label: "Revenue Tracked" },
            { value: "8", label: "Ethiopian Cities" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl sm:text-3xl font-black">{stat.value}</p>
              <p className="text-xs font-semibold text-white/80 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20 max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Our Mission
          </h2>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
            We believe every Ethiopian business, from a neighborhood kiosk to a multi-branch
            wholesale operation, deserves modern tools to track what they sell, know what they earn,
            and make confident decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`inline-flex p-3 rounded-xl border ${value.color} mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-10">
            Our Journey
          </h2>
          <div className="relative border-l-2 border-[#0D9668]/30 pl-8 space-y-8">
            {MILESTONES.map((m, idx) => (
              <div key={m.year} className="relative">
                <div className="absolute -left-[2.6rem] top-0.5 h-5 w-5 rounded-full bg-[#0D9668] border-4 border-white shadow" />
                <span className="text-xs font-bold text-[#0D9668] uppercase tracking-wider">{m.year}</span>
                <p className="text-sm text-slate-800 font-semibold mt-0.5">{m.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-20 max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meet the Team</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
            A small team of builders, operators, and designers based in Addis Ababa,
            united by the mission to modernize Ethiopian commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="text-center p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div
                className={`h-16 w-16 mx-auto rounded-full ${member.color} flex items-center justify-center text-white font-black text-xl shadow-lg`}
              >
                {member.initials}
              </div>
              <h3 className="font-bold text-slate-900 mt-4 text-sm">{member.name}</h3>
              <p className="text-xs font-semibold text-[#0D9668] mt-0.5">{member.role}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#101827] to-[#1e293b]">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Ready to modernize your business?
          </h2>
          <p className="text-slate-300 mt-3 text-sm">
            Join hundreds of Ethiopian business owners who use BizFlow to manage inventory,
            track sales, and grow their profits.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0D9668]/30 transition"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>© 2026 BizFlow Ethiopia Ltd. All rights reserved.</p>
          <p className="mt-1">Addis Ababa, Ethiopia 🇪🇹</p>
        </div>
      </footer>
    </div>
  );
}
