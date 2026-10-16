"use client";

import React from "react";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="bg-[#072623] text-emerald-100/70 pt-16 pb-12 border-t border-[#0F3A36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Footer Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#0F3A36]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00D084] to-[#059669] flex items-center justify-center font-bold text-[#051E1C] text-sm shrink-0">
              BF
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-white tracking-tight leading-tight">
                BizFlow <span className="text-[#00D084]">Ethiopia</span>
              </span>
              <span className="text-[9px] text-emerald-300/70 font-bold tracking-widest uppercase">
                BUSINESS MANAGEMENT SAAS
              </span>
            </div>
          </Link>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {[
              { icon: "f", href: "#", label: "Facebook" },
              { icon: "𝕏", href: "#", label: "X / Twitter" },
              { icon: "▶", href: "#", label: "YouTube" },
              { icon: "in", href: "https://www.linkedin.com/in/ebisa-abulu/", label: "LinkedIn" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="h-8 w-8 rounded-full bg-[#0A322E] border border-[#0F3A36] flex items-center justify-center text-xs font-bold text-emerald-200/80 hover:text-[#00D084] hover:border-[#00D084]/50 transition"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/60">
          {/* Nav Links */}
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/#why-choose" className="hover:text-white transition">Features</Link>
            <Link href="/#solutions" className="hover:text-white transition">Solutions</Link>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </nav>

          {/* Copyright */}
          <p className="text-[11px] text-emerald-200/50">
            © 2026 BizFlow Ethiopia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
