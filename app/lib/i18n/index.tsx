"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import en from "./en.json";
import ru from "./ru.json";
import kk from "./kk.json";

export type Locale = "en" | "ru" | "kk";

const messages: Record<Locale, Record<string, string>> = { en, ru, kk };

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "sandyq-locale";

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ru" || stored === "kk") return stored;
  }
  return "ru";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = messages[locale]?.[key] ?? messages.en?.[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}

const localeLabels: Record<Locale, string> = {
  en: "EN",
  ru: "РУ",
  kk: "ҚЗ",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
      {(Object.keys(localeLabels) as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            locale === l
              ? "bg-gold/20 text-gold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {localeLabels[l]}
        </button>
      ))}
    </div>
  );
}
