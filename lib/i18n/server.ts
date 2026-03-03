import { cookies } from "next/headers";
import { Locale } from "@/lib/types/contracts";
import { dictionaries } from "./dictionaries";
import { defaultLocale, Translate } from "./types";

export const LOCALE_COOKIE = "lixi_locale";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  if (raw === "en" || raw === "vi") {
    return raw;
  }
  return defaultLocale;
}

export function getTranslator(locale: Locale): Translate {
  const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
  return (key) => dictionary[key];
}
