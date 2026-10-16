"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Layers, Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const items = [
  { key: "nav.dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.products", name: "Products", href: "/products", icon: Package },
  { key: "nav.pos", name: "POS", href: "/sales/new", icon: ShoppingCart, center: true },
  { key: "nav.stock", name: "Stock", href: "/inventory", icon: Layers },
  { key: "nav.salesShort", name: "Sales", href: "/sales", icon: Receipt },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Clear loading state when pathname actually changes
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleNavTap = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const isLoading = navigatingTo === item.href;
        const Icon = item.icon;

        if (item.center) {
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => handleNavTap(item.href)}
              className={cn(
                "flex flex-col items-center justify-center -mt-6 rounded-full h-14 w-14 shadow-lg border-4 border-white transition-all active:scale-90",
                isActive
                  ? "bg-[#0D9668] text-white shadow-[#0D9668]/40"
                  : "bg-[#0D9668] text-white shadow-[#0D9668]/40 hover:bg-emerald-600",
                isLoading && "animate-pulse"
              )}
              aria-label={t(item.key, item.name)}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
            </Link>
          );
        }
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => handleNavTap(item.href)}
            className={cn(
              "relative flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] min-w-[48px] text-xs font-semibold transition-all active:scale-90",
              isActive
                ? "text-[#0D9668]"
                : "text-slate-400 hover:text-slate-700",
              isLoading && "text-[#0D9668]"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mb-0.5 animate-spin" />
            ) : (
              <Icon className="h-5 w-5 mb-0.5" />
            )}
            <span className="truncate max-w-[64px] text-[11px]">
              {t(item.key, item.name)}
            </span>
            {/* Active indicator dot */}
            {isActive && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-[#0D9668]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
