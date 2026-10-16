"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Download, Monitor, Smartphone, Apple, CheckCircle2, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<void>;
  openGuide: () => void;
  closeGuide: () => void;
}

const InstallContext = createContext<InstallContextType>({
  isInstallable: false,
  isStandalone: false,
  promptInstall: async () => {},
  openGuide: () => {},
  closeGuide: () => {},
});

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if already installed & running as standalone app
    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      } catch (err) {
        console.warn("[PWA] Install prompt failed:", err);
        setShowGuide(true);
      }
    } else {
      // If native prompt is not available, show the interactive guide
      setShowGuide(true);
    }
  };

  return (
    <InstallContext.Provider
      value={{
        isInstallable: !isStandalone,
        isStandalone,
        promptInstall,
        openGuide: () => setShowGuide(true),
        closeGuide: () => setShowGuide(false),
      }}
    >
      {children}

      {/* Interactive Install Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-[#0F172A] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#1E293B] border border-[#0D9668] flex items-center justify-center font-bold text-white shadow-xs">
                  <span className="text-[#0D9668] font-black text-lg">B</span>
                  <span className="text-white font-black text-lg">F</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Install BizFlow App</h3>
                  <p className="text-xs text-slate-400">Desktop & Mobile Progressive Web App</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-slate-700 text-xs sm:text-sm">
              {deferredPrompt ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-[#0D9668] shrink-0" />
                    <span>Your browser is ready to install BizFlow!</span>
                  </div>
                  <button
                    type="button"
                    onClick={promptInstall}
                    className="shrink-0 bg-[#0D9668] hover:bg-[#0B7A54] text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs"
                  >
                    Install Now
                  </button>
                </div>
              ) : null}

              <div className="space-y-3">
                {/* Desktop Chrome / Edge */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Monitor className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900">Desktop (Chrome / Edge / Brave)</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Look at the right side of your browser address bar and click the <strong>Install</strong> or <strong>App available (⊕)</strong> icon.
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Or click Menu (⋮) → <em>Cast, save and share</em> → <em>Install BizFlow Ethiopia</em>.
                    </p>
                  </div>
                </div>

                {/* Android */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Smartphone className="h-5 w-5 text-[#0D9668] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900">Android (Chrome / Samsung)</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Tap the browser menu <strong>(⋮)</strong> and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </p>
                  </div>
                </div>

                {/* iOS */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Apple className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900">iPhone & iPad (Safari)</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Tap the <strong>Share</strong> button at the bottom of Safari, then choose <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </InstallContext.Provider>
  );
}

export function useInstallPrompt() {
  return useContext(InstallContext);
}
