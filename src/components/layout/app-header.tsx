"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr-fetcher";
import {
  Bell,
  Search,
  ShoppingCart,
  Menu,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

interface NotificationItem {
  id: string;
  type: "STOCK_CRITICAL" | "STOCK_WARNING";
  title: string;
  message: string;
  unread: boolean;
}

import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "./language-switcher";
import { useInstallPrompt } from "@/components/pwa/install-context";
import { Download } from "lucide-react";

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchScope, setSearchScope] = useState<"products" | "sales" | "customers">("products");
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(
    () => new Set()
  );
  const { t } = useLanguage();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const {
    data: dashboardData,
    error: notificationError,
    mutate: refreshNotifications,
  } = useSWR("/api/dashboard/metrics?range=today", swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  const notifications: NotificationItem[] = (dashboardData?.lowStockItems || []).map(
    (item: { id: string; name: string; stock: number; reorderLevel: number; isOut: boolean }) => ({
      id: item.id,
      type: item.isOut ? "STOCK_CRITICAL" : "STOCK_WARNING",
      title: item.isOut ? "Out of stock" : "Low stock",
      message: `${item.name}: ${item.stock} remaining (reorder at ${item.reorderLevel}).`,
      unread: !dismissedNotificationIds.has(item.id),
    })
  );

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setDismissedNotificationIds((previous) => {
      const next = new Set(previous);
      notifications.forEach((notification) => next.add(notification.id));
      return next;
    });
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    router.push(`/${searchScope}?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {/* Mobile/Tablet Menu Button to open sidebar drawer */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Global Search */}
        <form onSubmit={submitSearch} className="relative hidden sm:flex w-72 lg:w-[30rem]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("header.searchPlaceholder", "Search products, invoices, customers...")}
            aria-label="Search dashboard records"
            className="min-w-0 flex-1 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0D9668] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0D9668] transition"
          />
          <select
            value={searchScope}
            onChange={(event) => {
              const scope = event.target.value;
              if (scope === "products" || scope === "sales" || scope === "customers") {
                setSearchScope(scope);
              }
            }}
            aria-label="Search category"
            className="border-y border-slate-200 bg-slate-50 px-2 text-xs text-slate-600 focus:outline-none"
          >
            <option value="products">Products</option>
            <option value="sales">Sales</option>
            <option value="customers">Customers</option>
          </select>
          <button
            type="submit"
            className="rounded-r-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Install Web App Button */}
        {isInstallable && (
          <button
            type="button"
            onClick={promptInstall}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#0D9668]/40 transition active:scale-95"
            title="Install BizFlow as Desktop/Mobile App"
          >
            <Download className="h-4 w-4 text-[#0D9668]" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Real Reactive Language Switcher */}
        <LanguageSwitcher />

        {/* Quick Launch POS Terminal */}
        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] px-3.5 py-2 text-xs font-bold text-white shadow-xs shadow-[#0D9668]/30 transition"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.newSale", "New Sale (POS)")}</span>
          <span className="sm:hidden">POS</span>
        </Link>

        {/* Notification Bell & Interactive Panel */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="View notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {/* Interactive Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{t("header.notifications", "Notifications")}</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-[#DCEFE7] text-[#0D9668] px-2 py-0.5 rounded-full">
                      {unreadCount} {t("header.unread", "new")}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-[#0D9668] hover:underline cursor-pointer"
                  >
                    {t("header.markAllRead", "Mark all read")}
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notificationError ? (
                  <div className="px-4 py-6 text-center text-xs text-red-700" role="alert">
                    <p>Unable to load current inventory alerts.</p>
                    <button
                      type="button"
                      onClick={() => void refreshNotifications()}
                      className="mt-2 font-semibold underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No current inventory alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 transition flex items-start gap-3 ${
                        n.unread ? "bg-slate-50/60" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.type === "STOCK_CRITICAL" && (
                          <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                        {n.type === "STOCK_WARNING" && (
                          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {n.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-4 border-t border-slate-100 text-center">
                <Link
                  href="/inventory"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-[#0D9668] inline-flex items-center gap-1"
                >
                  <span>Review inventory</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
