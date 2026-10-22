"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import useSWR, { preload } from "swr";
import { swrFetcher } from "@/lib/swr-fetcher";
import { BusinessRole } from "@/lib/permissions";
import {
  SIDEBAR_NAV_GROUPS,
  filterNavGroupsByRole,
  isRouteActive,
} from "@/lib/navigation";

const endpointMap: Record<string, string> = {
  "/dashboard": "/api/dashboard/metrics?range=7d",
  "/products": "/api/products",
  "/inventory": "/api/inventory",
  "/sales": "/api/sales?page=1&limit=20",
  "/customers": "/api/customers",
  "/expenses": "/api/expenses",
  "/reports": "/api/reports?period=month",
  "/staff": "/api/staff",
  "/settings": "/api/businesses/current",
  "/subscription": "/api/businesses/current",
  "/admin": "/api/admin/tenants",
};

const additionalEndpoints = [
  "/api/auth/me",
  "/api/businesses/current",
  "/api/dashboard/metrics?range=today",
];

const COLLAPSED_STORAGE_KEY = "bizflow_sidebar_collapsed";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Restore persisted collapsed state after hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === "true");
        return;
      }
      const match = document.cookie.match(new RegExp(`(^|;\\s*)${COLLAPSED_STORAGE_KEY}=([^;]*)`));
      if (match) {
        setIsCollapsed(match[2] === "true");
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<string>("");

  const pathname = usePathname() || "";
  const { t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const collapsedDropdownRef = useRef<HTMLDivElement>(null);

  // Sync search params safely on mount & path changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentSearch(window.location.search || "");
    }
  }, [pathname]);

  // Pre-warm endpoints on initial mount
  useEffect(() => {
    const allEndpoints = [
      ...Object.values(endpointMap),
      ...additionalEndpoints,
    ];
    allEndpoints.forEach((endpoint, index) => {
      setTimeout(() => {
        try {
          preload(endpoint, swrFetcher);
        } catch {
          // Ignore prefetch error
        }
      }, index * 100);
    });
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close business switcher dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      const inCollapsedDropdown = collapsedDropdownRef.current && collapsedDropdownRef.current.contains(target);
      if (!inDropdown && !inCollapsedDropdown) {
        setBusinessDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation: Escape key closes dropdown and mobile drawer; Ctrl+B toggles sidebar
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (businessDropdownOpen) {
          event.preventDefault();
          setBusinessDropdownOpen(false);
        } else if (isOpen && onClose) {
          event.preventDefault();
          onClose();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [businessDropdownOpen, isOpen, onClose]);

  // Fetch session, active business settings, and live low-stock metrics
  const { data: sessionData, mutate: mutateSession } = useSWR("/api/auth/me", swrFetcher);
  const { data: businessData, mutate: mutateBusiness } = useSWR("/api/businesses/current", swrFetcher);
  const { data: dashboardData } = useSWR("/api/dashboard/metrics?range=today", swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const user = sessionData?.user;
  const currentBusinessId = user?.businessId;
  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Account");
  const nameParts = userName.split(" ");
  const initials =
    nameParts
      .filter(Boolean)
      .map((n: string) => n[0].toUpperCase())
      .join("")
      .slice(0, 2) || userName.slice(0, 2).toUpperCase() || "BF";

  const businessName = user?.businessName || businessData?.settings?.businessName || "BizFlow Store";
  const currency = user?.currency || businessData?.settings?.currency || "ETB";
  const rawRole = (user?.role as BusinessRole) || "CASHIER";
  const roleDisplay = rawRole
    ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
    : "Member";

  const branchLocation = businessData?.settings?.subcity
    ? `${businessData.settings.subcity}, ${businessData.settings.city || "Addis Ababa"}`
    : businessData?.settings?.city || "Addis Ababa";
  const taxNumber = businessData?.settings?.tin || businessData?.settings?.taxNumber;
  const businessStatus = businessData?.settings?.status || "ACTIVE";

  const availableBusinesses: Array<{ id: string; name: string; role: string }> =
    user?.availableBusinesses || [];
  const hasMultipleBusinesses = availableBusinesses.length > 1;

  // Real data inventory alerts count (0 means no badge)
  const lowStockCount = dashboardData?.lowStockItems?.length || 0;

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
        document.cookie = `${COLLAPSED_STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleSwitchBusiness = async (businessId: string) => {
    if (isSwitching || businessId === currentBusinessId) {
      setBusinessDropdownOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      const response = await fetch("/api/auth/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to switch active business");
      }

      setBusinessDropdownOpen(false);
      await Promise.all([mutateSession(), mutateBusiness()]);
      // Force full tenant reload to reset all tenant caches & server components
      window.location.href = "/dashboard";
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to switch business.");
      setIsSwitching(false);
    }
  };

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
      window.location.href = "/login";
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  // Filter groups strictly based on real RBAC permissions
  const filteredNavGroups = filterNavGroupsByRole(
    SIDEBAR_NAV_GROUPS,
    rawRole,
    user?.globalRole === "SUPERADMIN"
  );

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-[#071924] text-white select-none relative overflow-hidden">
      {/* 1. Brand Logo Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between border-b border-[#122B38] transition-all",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        <Link
          href="/dashboard"
          onClick={() => onClose?.()}
          className={cn(
            "flex items-center gap-2.5 group rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]",
            collapsed && "justify-center"
          )}
          title="BizFlow Ethiopia Dashboard"
          aria-label="BizFlow Ethiopia Home"
        >
          {/* Green Square Logo with BF */}
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[#00B074] flex items-center justify-center font-black text-white text-sm shadow-sm group-hover:scale-105 transition-transform">
            BF
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  BizFlow
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#0D382E] text-[#00D287] border border-[#0D9668]/40">
                  ET
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5 truncate">
                Ethiopia SaaS
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse / Expand Toggle Button */}
        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]"
            title={collapsed ? "Expand sidebar (Ctrl + B)" : "Collapse sidebar (Ctrl + B)"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 2. Compact Business Switcher with Tenant Isolation */}
      <div className={cn("shrink-0 py-2.5", collapsed ? "px-2" : "px-3")} ref={dropdownRef}>
        {collapsed ? (
          <div className="flex justify-center relative group" ref={collapsedDropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (hasMultipleBusinesses) setBusinessDropdownOpen((prev) => !prev);
              }}
              className="h-10 w-10 rounded-xl bg-[#0e2736] border border-[#184257] hover:border-[#0D9668] flex items-center justify-center text-[#00D287] font-bold text-xs shadow-xs transition relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]"
              title={`${businessName} (${roleDisplay}) • ${currency}`}
              aria-label={`Active store: ${businessName}`}
              aria-haspopup={hasMultipleBusinesses ? "listbox" : undefined}
              aria-expanded={hasMultipleBusinesses ? businessDropdownOpen : undefined}
            >
              <Store className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#00D287] ring-2 ring-[#071924]" />
            </button>

            {/* Accessible tooltip for collapsed store icon */}
            <div
              role="tooltip"
              className="pointer-events-none fixed left-[80px] z-50 hidden group-hover:flex group-focus-visible:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#06161F] text-white text-xs font-semibold border border-slate-700 shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
            >
              <span>{businessName}</span>
              <span className="text-[10px] text-[#00D287]">({roleDisplay})</span>
            </div>

            {/* Collapsed Mode Popover Dropdown for Multi-Tenant Switcher */}
            {businessDropdownOpen && hasMultipleBusinesses && (
              <div
                role="listbox"
                aria-label="Select active business"
                className="fixed left-[76px] top-14 w-60 z-50 rounded-xl bg-[#0e2736] border border-[#184257] shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Business
                </div>
                {availableBusinesses.map((b) => {
                  const isActive = b.id === currentBusinessId;
                  return (
                    <button
                      key={b.id}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      disabled={isSwitching}
                      onClick={() => handleSwitchBusiness(b.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D287]",
                        isActive
                          ? "bg-[#073228] text-white border border-[#0D9668]/50"
                          : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.role}</p>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-[#00D287] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (hasMultipleBusinesses) setBusinessDropdownOpen((prev) => !prev);
              }}
              className={cn(
                "w-full text-left rounded-xl border border-[#184257] bg-[#0e2736] p-2.5 shadow-xs transition-all flex flex-col gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]",
                hasMultipleBusinesses
                  ? "hover:border-[#0D9668] hover:bg-[#113144] cursor-pointer"
                  : "cursor-default"
              )}
              title={
                hasMultipleBusinesses
                  ? "Click to switch active store"
                  : `${businessName} (${roleDisplay})`
              }
              aria-haspopup={hasMultipleBusinesses ? "listbox" : undefined}
              aria-expanded={hasMultipleBusinesses ? businessDropdownOpen : undefined}
            >
              {/* Header Label + Status & Role Badge */}
              <div className="flex items-center justify-between text-[10px] w-full">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00D287] animate-pulse" />
                  <span>CURRENT BUSINESS</span>
                </div>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#0D382E] text-[#00D287] border border-[#0D9668]/40 shrink-0">
                  {roleDisplay}
                </span>
              </div>

              {/* Main Store Line */}
              <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-[#073228] border border-[#0D9668]/40 flex items-center justify-center text-[#00D287] font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Store className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-xs truncate max-w-[140px]">
                      {businessName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                      <span className="text-slate-300 font-semibold">{currency}</span>
                      {taxNumber ? ` • ${taxNumber}` : ` • ${branchLocation}`}
                    </p>
                  </div>
                </div>
                {hasMultipleBusinesses && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-400 group-hover:text-white transition-transform shrink-0",
                      businessDropdownOpen && "rotate-180"
                    )}
                  />
                )}
              </div>
            </button>

            {/* Multi-Tenant Business Switcher Dropdown */}
            {businessDropdownOpen && hasMultipleBusinesses && (
              <div
                role="listbox"
                aria-label="Select active business"
                className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-[#09222C] border border-[#14484A] shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Business
                </div>
                {availableBusinesses.map((b) => {
                  const isActive = b.id === currentBusinessId;
                  return (
                    <button
                      key={b.id}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      disabled={isSwitching}
                      onClick={() => handleSwitchBusiness(b.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D287]",
                        isActive
                          ? "bg-[#073228] text-white border border-[#0D9668]/50"
                          : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.role}</p>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-[#00D287] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Grouped Navigation Links (Independently scrollable with min-h-0) */}
      <nav
        role="navigation"
        aria-label="Main Navigation"
        className="flex-1 min-h-0 space-y-3.5 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {filteredNavGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.label}
              </div>
            )}

            {group.items.map((item) => {
              const active = isRouteActive(item.href, pathname, currentSearch);
              const Icon = item.icon;

              // Attach real-time alert count on inventory
              const itemBadge =
                item.key === "nav.inventory"
                  ? lowStockCount > 0
                    ? lowStockCount > 9
                      ? "9+"
                      : String(lowStockCount)
                    : undefined
                  : item.badge;

              const isAlertBadge = item.key === "nav.inventory" && lowStockCount > 0;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => onClose?.()}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center rounded-xl transition-all duration-150 border-l-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]",
                    collapsed
                      ? "justify-center p-2.5 mx-auto w-10 h-10"
                      : "justify-between px-3 py-2 text-xs font-semibold",
                    active
                      ? "bg-[#073228] text-white border-[#00D287] shadow-sm shadow-[#0D9668]/20"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white border-transparent"
                  )}
                  title={collapsed ? `${item.name}${itemBadge ? ` (${itemBadge})` : ""}` : undefined}
                >
                  <div className={cn("flex items-center gap-2.5 min-w-0", collapsed && "justify-center")}>
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-[#00D287]" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    {!collapsed && <span className="truncate">{t(item.key, item.name)}</span>}
                  </div>

                  {/* Badges in expanded mode */}
                  {!collapsed && itemBadge && (
                    <span
                      className={cn(
                        "ml-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0",
                        isAlertBadge
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : active
                          ? "bg-[#0D9668] text-white"
                          : "bg-[#0D9668]/20 text-[#00D287] border border-[#0D9668]/30 group-hover:bg-[#0D9668]/30"
                      )}
                    >
                      {itemBadge}
                    </span>
                  )}

                  {/* Indicator dot in collapsed mode */}
                  {collapsed && itemBadge && (
                    <span
                      className={cn(
                        "absolute top-1 right-1 h-2 w-2 rounded-full",
                        isAlertBadge ? "bg-red-500 animate-pulse" : "bg-[#00D287]"
                      )}
                    />
                  )}

                  {/* Accessible hover and keyboard focus tooltip in collapsed mode */}
                  {collapsed && (
                    <div
                      role="tooltip"
                      className="pointer-events-none fixed left-[80px] z-50 hidden group-hover:flex group-focus-visible:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#06161F] text-white text-xs font-semibold border border-slate-700 shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                    >
                      <span>{t(item.key, item.name)}</span>
                      {itemBadge && (
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded uppercase",
                            isAlertBadge ? "bg-red-600 text-white" : "bg-[#0D9668] text-white"
                          )}
                        >
                          {itemBadge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 4. Bottom Anchored Profile & Utility Section (shrink-0) */}
      <div
        className={cn(
          "shrink-0 border-t border-[#122B38] bg-[#071924]/95 backdrop-blur",
          collapsed ? "p-2" : "p-3"
        )}
      >
        {/* User Account / Profile Section */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/profile"
              onClick={() => onClose?.()}
              className="h-9 w-9 rounded-full bg-[#0E2736] border border-[#0D9668] flex items-center justify-center font-extrabold text-white text-xs hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]"
              title={`${userName} (${roleDisplay}) • View Profile`}
              aria-label="View Profile"
            >
              {initials}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/[0.04] transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Link
              href="/profile"
              onClick={() => onClose?.()}
              className="flex items-center justify-between rounded-xl p-2 bg-[#0A1F2C]/60 hover:bg-[#0E2736] border border-[#122B38] transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D287]"
              title="View & Edit My Profile"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#071924] border border-[#00D287]/50 flex items-center justify-center font-bold text-white text-xs group-hover:border-[#00D287] transition-colors">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white group-hover:text-[#00D287] transition-colors truncate">
                    {userName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                    <span className="text-[#00D287] font-bold uppercase tracking-wider">{roleDisplay}</span>
                    <span className="text-slate-600">·</span>
                    <span>My Profile</span>
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/[0.04] transition disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent, Collapsible) */}
      <aside
        suppressHydrationWarning
        className={cn(
          "hidden md:flex shrink-0 flex-col border-r border-[#122B38] bg-[#071924] min-h-screen sticky top-0 h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer (Always expanded, overlay with backdrop) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Main Navigation Drawer"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
