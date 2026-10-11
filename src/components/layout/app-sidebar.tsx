"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Receipt,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  Building2,
  X,
  Store,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { key: "nav.dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.pos", name: "POS Checkout", href: "/sales/new", icon: ShoppingCart, highlight: true },
  { key: "nav.sales", name: "Sales History", href: "/sales", icon: Receipt },
  { key: "nav.products", name: "Products", href: "/products", icon: Package },
  { key: "nav.inventory", name: "Inventory", href: "/inventory", icon: Layers },
  { key: "nav.expenses", name: "Expenses", href: "/expenses", icon: CreditCard },
  { key: "nav.reports", name: "Reports & P&L", href: "/reports", icon: BarChart3 },
  { key: "nav.staff", name: "Staff & Roles", href: "/staff", icon: Users },
  { key: "nav.subscription", name: "Subscription", href: "/subscription", icon: ShieldCheck },
  { key: "nav.settings", name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand Header - Carefully styled with fixed heights and no clipping */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[#101827] flex items-center justify-center font-bold text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="text-[#0D9668] font-black text-lg leading-none">B</span>
            <span className="text-white font-black text-lg leading-none">F</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                BizFlow
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#DCEFE7] text-[#0D9668] border border-[#0D9668]/30">
                ET
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium -mt-0.5">Ethiopia SaaS</span>
          </div>
        </Link>

        {/* Close button for mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Business Tenant Selector Card */}
      <div className="p-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-2xs hover:bg-slate-100/60 transition cursor-pointer">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <Store className="h-3 w-3 text-[#0D9668]" /> {t("nav.activeShop", "Active Shop")}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">Addis Mini Mart</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
            <span className="truncate">Bole Branch • TIN-001928</span>
            <span className="inline-flex items-center gap-1 text-[#0D9668] font-sans font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0D9668]" /> {t("nav.live", "Live")}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-[#101827] text-white shadow-xs"
                  : item.highlight
                  ? "text-[#0D9668] bg-[#DCEFE7]/40 hover:bg-[#DCEFE7] hover:text-[#097852] font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  isActive
                    ? "text-[#0D9668]"
                    : item.highlight
                    ? "text-[#0D9668]"
                    : "text-slate-400 group-hover:text-slate-700"
                )}
              />
              <span className="truncate">{t(item.key, item.name)}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Role Footer */}
      <div className="border-t border-slate-200 p-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition group"
          title="View & Edit My Profile"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-[#101827] flex items-center justify-center font-bold text-white text-xs group-hover:scale-105 transition-transform">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-[#0D9668] transition-colors truncate">
              Abebe Kebede
            </p>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              <span className="font-semibold text-[#0D9668]">Owner</span> • My Profile
            </p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white min-h-screen sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
