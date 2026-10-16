"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Download } from "lucide-react";
import { useInstallPrompt } from "@/components/pwa/install-context";

interface MarketingNavbarProps {
  currentPath?: string;
}

export function MarketingNavbar({ currentPath = "/" }: MarketingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, promptInstall } = useInstallPrompt();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#why-choose" },
    { label: "Solutions", href: "/#solutions" },
    { label: "Product Tour", href: "/#product-tour" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#072623]/95 backdrop-blur-md border-b border-[#0F3A36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00D084] to-[#059669] flex items-center justify-center font-black text-[#051E1C] text-base shadow-lg shadow-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
            BF
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-white tracking-tight leading-tight">
              BizFlow <span className="text-[#00D084]">Ethiopia</span>
            </span>
            <span className="text-[10px] text-emerald-300/80 font-bold tracking-widest uppercase -mt-0.5">
              BUSINESS MANAGEMENT SAAS
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href === "/" && currentPath === "/") ||
              (item.href !== "/" && currentPath.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "text-[#00D084] font-bold bg-[#00D084]/10"
                    : "text-emerald-100/80 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isInstallable && (
            <button
              type="button"
              onClick={promptInstall}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/60 px-3.5 py-1.5 text-xs font-bold text-emerald-300 transition shadow-xs active:scale-95"
              title="Install BizFlow as Desktop/Mobile App"
            >
              <Download className="h-3.5 w-3.5 text-[#00D084]" />
              <span>Install App</span>
            </button>
          )}

          <Link
            href="/login"
            className="text-sm font-semibold text-emerald-100/90 hover:text-white transition px-2 py-1"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-[#051E1C] bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#00E591] hover:to-[#04885f] shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-emerald-100 hover:bg-white/10 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#0F3A36] bg-[#072623] px-5 pt-3 pb-6 space-y-1">
          {navLinks.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href === "/" && currentPath === "/") ||
              (item.href !== "/" && currentPath.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-3 text-base font-semibold rounded-lg transition ${
                  isActive
                    ? "text-[#00D084] font-bold bg-[#00D084]/10"
                    : "text-emerald-100 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 mt-2 border-t border-[#0F3A36] flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full text-center py-2.5 text-sm font-bold text-white border border-[#0F3A36] rounded-xl hover:bg-white/5 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full text-center py-2.5 text-sm font-bold text-[#051E1C] rounded-full bg-gradient-to-r from-[#00D084] to-[#059669]"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
