"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = "bizflow_pwa_install_dismissed";
const COOLDOWN_DAYS = 30;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Don't show if already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check dismissal cooldown (30 days)
    try {
      const dismissedTimestamp = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedTimestamp) {
        const timePassed = Date.now() - parseInt(dismissedTimestamp, 10);
        const daysPassed = timePassed / (1000 * 60 * 60 * 24);
        if (daysPassed < COOLDOWN_DAYS) {
          return;
        }
      }
    } catch {
      // Storage unavailable or blocked
    }

    // 3. Listen for the native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 3 seconds after page load before displaying to avoid abrupt popup
      setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {
        // Ignore
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsVisible(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn("[PWA] Install prompt error:", err);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // Ignore
    }
  };

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Install BizFlow application"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-40 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        {/* App Icon */}
        <div className="h-10 w-10 shrink-0 rounded-xl bg-[#0F172A] border border-[#0D9668]/40 flex items-center justify-center font-bold text-white shadow-xs">
          <span className="text-[#0D9668] font-black text-lg leading-none">B</span>
          <span className="text-white font-black text-lg leading-none">F</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
              {t("pwa.installTitle", "Install BizFlow Ethiopia")}
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-[#0D9668]">
              <Sparkles className="h-2.5 w-2.5" />
              App
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 leading-snug">
            {t("pwa.installDesc", "Install for faster launch, standalone experience, and reliable store management.")}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0D9668] hover:bg-[#0A7A54] text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs shadow-[#0D9668]/30 active:scale-95 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isInstalling ? "Installing…" : t("pwa.installBtn", "Install App")}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              {t("pwa.dismiss", "Dismiss")}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 -mt-1 -mr-1 rounded-lg hover:bg-slate-100 transition"
          aria-label="Close install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
