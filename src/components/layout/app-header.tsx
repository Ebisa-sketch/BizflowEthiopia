"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  ShoppingCart,
  Menu,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  X,
  ExternalLink,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

interface NotificationItem {
  id: string;
  type: "STOCK_CRITICAL" | "STOCK_WARNING" | "PAYMENT_RECEIVED";
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "N-1",
    type: "STOCK_CRITICAL",
    title: "Critical Low Stock",
    message: "Dano Milk Powder 400g has only 4 units remaining (Reorder at 10).",
    time: "10 mins ago",
    unread: true,
  },
  {
    id: "N-2",
    type: "PAYMENT_RECEIVED",
    title: "Telebirr Payment Confirmed",
    message: "Invoice #BF-948210: ETB 850.00 manually confirmed (Ref: TL-893021).",
    time: "25 mins ago",
    unread: true,
  },
  {
    id: "N-3",
    type: "STOCK_WARNING",
    title: "Reorder Threshold Reached",
    message: "Sunflower Cooking Oil 3L is at 8 units (Threshold: 15).",
    time: "1 hour ago",
    unread: false,
  },
];

import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "./language-switcher";

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const { t } = useLanguage();
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

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
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
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
        <div className="relative hidden sm:block w-72 lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t("header.searchPlaceholder", "Search products, invoices, customers...")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0D9668] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0D9668] transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
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
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {t("header.noNotifications", "No new notifications")}
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
                        {n.type === "PAYMENT_RECEIVED" && (
                          <div className="h-8 w-8 rounded-lg bg-[#DCEFE7] text-[#0D9668] flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
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
                  <span>Review all inventory alerts</span>
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
