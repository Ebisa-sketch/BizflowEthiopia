"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr-fetcher";
import {
  Bell,
  Search,
  Menu,
  AlertTriangle,
  ExternalLink,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Building2,
  Shield,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { useTheme } from "@/lib/theme-context";
import { LanguageSwitcher } from "./language-switcher";

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

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(
    () => new Set()
  );
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: sessionData } = useSWR("/api/auth/me", swrFetcher);
  const user = sessionData?.user;
  const userName = user?.name || user?.email?.split("@")[0] || "Account";
  const userEmail = user?.email || "";
  const nameParts = userName.split(" ");
  const initials =
    nameParts
      .filter(Boolean)
      .map((n: string) => n[0].toUpperCase())
      .join("")
      .slice(0, 2) || userName.slice(0, 2).toUpperCase() || "AC";
  const businessName = user?.businessName || "My Business";
  const role = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Staff";

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

  // Global Ctrl + K listener
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
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
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#071924]/95 px-4 md:px-6 backdrop-blur transition-colors">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile/Tablet Menu Button to open sidebar drawer */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Global Search with Ctrl + K */}
        <form onSubmit={submitSearch} className="relative hidden sm:flex w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("header.searchPlaceholder", "Search products, invoices, customers...")}
            aria-label="Search dashboard records"
            className="w-full rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 pl-10 pr-20 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0D9668] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D9668] transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-sans text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700 rounded px-1.5 py-0.5 bg-white dark:bg-slate-800 shadow-2xs">
            Ctrl + K
          </kbd>
        </form>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Dark Mode Icon */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative rounded-xl p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
            aria-label="View notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-850 shadow-2xl border border-slate-200/90 dark:border-slate-700 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {t("header.notifications", "Notifications")}
                  </h3>
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
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
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
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-start gap-3 ${
                        n.unread ? "bg-slate-50/60 dark:bg-slate-800/30" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-4 border-t border-slate-100 dark:border-slate-700 text-center">
                <Link
                  href="/inventory"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0D9668] inline-flex items-center gap-1"
                >
                  <span>Review inventory</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Profile Dropdown ── */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-l border-slate-200 dark:border-slate-800 cursor-pointer"
            aria-label="Open account menu"
            aria-expanded={profileOpen}
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-[#101827] dark:bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            {/* Name + role — hidden on xs */}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[110px]">
                {userName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                {role} · {businessName}
              </p>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 hidden sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown panel */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">

              {/* User identity card */}
              <div className="px-4 py-4 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center font-black text-white text-base shrink-0 shadow-sm ring-2 ring-white/20">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                        <Shield className="h-2.5 w-2.5" />
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Business name row */}
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                  <Building2 className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium truncate">{businessName}</span>
                </div>
              </div>

              {/* Navigation links */}
              <div className="py-2">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">My Profile</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Edit name, password &amp; photo</p>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">Business Settings</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Store info, receipt &amp; preferences</p>
                  </div>
                </Link>
              </div>

              {/* Divider + logout */}
              <div className="border-t border-slate-100 dark:border-slate-700 p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-60 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs">
                      {loggingOut ? "Signing out…" : "Sign Out"}
                    </p>
                    <p className="text-[10px] text-red-400 dark:text-red-500">End your current session</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

