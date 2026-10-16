"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await fetch("/", { method: "HEAD", cache: "no-store" });
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    } catch {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOffline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 inset-x-0 z-50 bg-[#0D9668] text-white px-4 py-2.5 shadow-md flex items-center justify-center gap-2 text-xs md:text-sm font-semibold transition-all duration-300 animate-in slide-in-from-top"
      >
        <Wifi className="h-4 w-4 shrink-0" />
        <span>Connection restored. Live synchronization is active.</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 shadow-lg border-b border-amber-600 flex items-center justify-between gap-3 text-xs md:text-sm font-medium transition-all duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1 rounded-md bg-amber-600/20 text-slate-950 shrink-0">
          <WifiOff className="h-4 w-4" />
        </div>
        <div className="truncate">
          <span className="font-bold mr-1.5">{t("pwa.offlineTitle", "You are currently offline")}:</span>
          <span className="hidden sm:inline text-slate-900">
            {t("pwa.offlineDesc", "Live sales, POS transactions, and inventory changes require an internet connection.")}
          </span>
          <span className="sm:hidden text-slate-900">
            Server sync unavailable.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleManualCheck}
        disabled={isChecking}
        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
        <span>{isChecking ? "Checking…" : "Retry"}</span>
      </button>
    </div>
  );
}
