"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { SupportedLanguage } from "@/lib/i18n/translations";
import { ChevronDown, Check } from "lucide-react";

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "EN", label: "English", nativeName: "English" },
  { code: "AM", label: "Amharic", nativeName: "አማርኛ" },
  { code: "OR", label: "Afaan Oromoo", nativeName: "Oromoo" },
];

export function LanguageSwitcher({ className = "" }: { className?: string; compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select language"
        className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <span>{currentOption.code}</span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 group-hover:text-slate-600 dark:text-slate-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 origin-top-right rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60 mb-1">
            Language / ቋንቋ
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer text-left ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[11px] w-5 text-slate-500 dark:text-slate-400">
                    {lang.code}
                  </span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
