"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  X,
  Store,
  LogOut,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import useSWR, { preload } from "swr";
import { swrFetcher } from "@/lib/swr-fetcher";
import { useInstallPrompt } from "@/components/pwa/install-context";

const endpointMap: Record<string, string> = {
  "/dashboard": "/api/dashboard/metrics?range=today",
  "/products": "/api/products",
  "/inventory": "/api/inventory",
  "/sales": "/api/sales?page=1&limit=20",
  "/customers": "/api/customers",
  "/expenses": "/api/expenses",
  "/reports": "/api/reports?period=month",
  "/staff": "/api/staff",
};

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  key: string;
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { key: "nav.dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "nav.pos", name: "POS Checkout", href: "/sales/new", icon: ShoppingCart, badge: "POS" },
    ],
  },
  {
    label: "Store Operations",
    items: [
      { key: "nav.sales", name: "Sales History", href: "/sales", icon: Receipt },
      { key: "nav.customers", name: "Customers & Debt", href: "/customers", icon: Users, badge: "Idda" },
      { key: "nav.products", name: "Products", href: "/products", icon: Package },
      { key: "nav.inventory", name: "Inventory", href: "/inventory", icon: Layers },
      { key: "nav.expenses", name: "Expenses", href: "/expenses", icon: CreditCard },
    ],
  },
  {
    label: "Analytics & Settings",
    items: [
      { key: "nav.reports", name: "Reports & P&L", href: "/reports", icon: BarChart3 },
      { key: "nav.staff", name: "Staff & Roles", href: "/staff", icon: Users },
      { key: "nav.subscription", name: "Subscription", href: "/subscription", icon: ShieldCheck },
      { key: "nav.settings", name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const [showPosInfo, setShowPosInfo] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const { data: sessionData } = useSWR("/api/auth/me", swrFetcher);
  const user = sessionData?.user;
  const userName = user?.name || '';
  const nameParts = userName.split(' ');
  const initials = nameParts.filter(Boolean).map((n: string) => n[0].toUpperCase()).join('').slice(0, 2);
  const displayName = userName || 'User';

  const handleLogout = async () => {
    if (isLoggingOut || !window.confirm("Are you sure you want to log out of BizFlow?")) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to log out. Please try again.");
      }

      onClose?.();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

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
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <Store className="h-3 w-3 text-[#0D9668]" /> Current Business
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            {user?.businessName || (sessionData ? "Business unavailable" : "Loading business…")}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
            <span>{user?.currency || "Currency unavailable"}</span>
            <span className="inline-flex items-center gap-1 text-[#0D9668] font-sans font-bold">
              {user ? user.role : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isPosCheckout = item.href === "/sales/new";
              const isSalesHistory = item.href === "/sales";

              const isActive = isPosCheckout
                ? pathname === "/sales/new"
                : isSalesHistory
                ? pathname === "/sales" || (Boolean(pathname?.startsWith("/sales/")) && pathname !== "/sales/new")
                : pathname === item.href || (item.href !== "/dashboard" && Boolean(pathname?.startsWith(`${item.href}/`)));

              const Icon = item.icon;

              const handlePrefetch = () => {
                const apiEndpoint = endpointMap[item.href];
                if (apiEndpoint) {
                  try {
                    preload(apiEndpoint, swrFetcher);
                  } catch {
                    // Ignore prefetch errors
                  }
                }
              };

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onMouseEnter={handlePrefetch}
                  onTouchStart={handlePrefetch}
                  onClick={() => {
                    onClose?.();
                    if (isPosCheckout) {
                      setShowPosInfo((prev) => !prev);
                    }
                  }}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150",
                    isActive
                      ? "bg-[#101827] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-[#0D9668]"
                        : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <span className="truncate">{t(item.key, item.name)}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider",
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-emerald-50 text-[#0D9668] border border-emerald-200/50 group-hover:bg-[#DCEFE7]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>





      {/* Install App Button */}
      {isInstallable && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={promptInstall}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 text-xs font-bold transition shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-[#0D9668] group-hover:scale-110 transition-transform" />
              <span>Install BizFlow App</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0D9668] text-white">
              PWA
            </span>
          </button>
        </div>
      )}

      {/* User & Role Footer */}
      <div className="border-t border-slate-200 p-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition group"
          title="View & Edit My Profile"
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-[#101827] flex items-center justify-center font-bold text-white text-xs group-hover:scale-105 transition-transform">
            {initials || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-[#0D9668] transition-colors truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              <span className="font-semibold text-[#0D9668]">{user?.role || 'User'}</span> • My Profile
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-2 flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-100 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
        </button>
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
