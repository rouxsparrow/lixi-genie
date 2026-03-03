import { Locale } from "@/lib/types/contracts";
import { dictionaries } from "./dictionaries";
import { defaultLocale } from "./types";

export const LOCALE_STORAGE_KEY = "lixi_locale";

export function getClientLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (raw === "en") {
    return raw;
  }
  return defaultLocale;
}

export function setClientLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `lixi_locale=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function t(locale: Locale, key: keyof (typeof dictionaries)["vi"]) {
  return dictionaries[locale][key];
}
