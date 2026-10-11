"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SupportedLanguage, translations } from "./translations";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "EN",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const STORAGE_KEY = "bizflow_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("EN");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read stored language preference from localStorage or cookie
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && (saved === "EN" || saved === "AM" || saved === "OR")) {
        setLanguageState(saved);
      }
    } catch {
      // Ignore localStorage access issues
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.EN;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English
    if (translations.EN && translations.EN[key]) {
      return translations.EN[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
