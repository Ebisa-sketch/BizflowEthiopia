"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center text-xs font-bold bg-slate-100 rounded-xl p-1 border border-slate-200 ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLanguage("EN")}
        className={`px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
          language === "EN"
            ? "bg-white text-[#101827] shadow-xs font-extrabold"
            : "text-slate-500 hover:text-slate-900"
        }`}
        aria-pressed={language === "EN"}
        title="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("AM")}
        className={`px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
          language === "AM"
            ? "bg-white text-[#101827] shadow-xs font-extrabold"
            : "text-slate-500 hover:text-slate-900"
        }`}
        aria-pressed={language === "AM"}
        title="ወደ አማርኛ ቀይር"
      >
        አማ
      </button>
      <button
        type="button"
        onClick={() => setLanguage("OR")}
        className={`px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
          language === "OR"
            ? "bg-white text-[#101827] shadow-xs font-extrabold"
            : "text-slate-500 hover:text-slate-900"
        }`}
        aria-pressed={language === "OR"}
        title="Gara Afaan Oromootti jijjiiri"
      >
        OR
      </button>
    </div>
  );
}
