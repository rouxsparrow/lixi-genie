"use client";

import { useEffect, useState } from "react";
import { Locale } from "@/lib/types/contracts";
import { getClientLocale, setClientLocale } from "@/lib/i18n/client";

interface LanguageToggleProps {
  onChange?: (locale: Locale) => void;
}

export function LanguageToggle({ onChange }: LanguageToggleProps) {
  const [locale, setLocale] = useState<Locale>("vi");

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const change = (next: Locale) => {
    setLocale(next);
    setClientLocale(next);
    onChange?.(next);
  };

  return (
    <div className="inline-flex items-center rounded-full bg-white/70 border border-lixi-gold/30 p-1 shadow-sm">
      <button
        onClick={() => change("vi")}
        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
          locale === "vi" ? "bg-lixi-red text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
        aria-label="Switch language to Vietnamese"
      >
        VI
      </button>
      <button
        onClick={() => change("en")}
        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
          locale === "en" ? "bg-lixi-red text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
        aria-label="Switch language to English"
      >
        EN
      </button>
    </div>
  );
}
