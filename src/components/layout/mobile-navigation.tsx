"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Layers, Receipt } from "lucide-react";
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.center) {
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-6 bg-blue-600 text-white rounded-full h-13 w-13 shadow-lg shadow-blue-500/40 border-4 border-white transition active:scale-95"
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 text-xs font-medium transition",
              isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span>{t(item.key, item.name)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
