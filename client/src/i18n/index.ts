import { createContext, useContext } from "react";
import type { Locale, Translations } from "./types";
import { sk } from "./sk";
import { cz } from "./cz";
import { en } from "./en";

export type { Locale, Translations };
export { sk, cz, en };

const translations: Record<Locale, Translations> = { sk, cz, en };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

// ─── Context ────────────────────────────────────────────────────────────────

export interface I18nContextValue {
  locale: Locale;
  t: Translations;
  /** Returns the path with locale prefix (e.g., /en/upload or /cz/upload or /upload) */
  localePath: (path: string) => string;
  /** Returns the alternate locale path for language switching */
  switchLocalePath: (currentPath: string, targetLocale: Locale) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "sk",
  t: sk,
  localePath: (p) => p,
  switchLocalePath: (p, targetLocale) => targetLocale === "sk" ? p : `/${targetLocale}${p}`,
});

export function useT() {
  return useContext(I18nContext);
}

// ─── Locale detection from URL ──────────────────────────────────────────────

export function detectLocaleFromPath(path: string): Locale {
  if (path.startsWith("/en") && (path === "/en" || path.startsWith("/en/"))) {
    return "en";
  }
  if (path.startsWith("/cz") && (path === "/cz" || path.startsWith("/cz/"))) {
    return "cz";
  }
  return "sk";
}

export function stripLocalePrefix(path: string): string {
  if (path.startsWith("/en/")) {
    return path.slice(3); // Remove "/en" prefix, keep the "/"
  }
  if (path === "/en") {
    return "/";
  }
  if (path.startsWith("/cz/")) {
    return path.slice(3); // Remove "/cz" prefix, keep the "/"
  }
  if (path === "/cz") {
    return "/";
  }
  return path;
}
