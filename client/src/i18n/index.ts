import { createContext, useContext } from "react";
import type { Locale, Translations } from "./types";
import { sk } from "./sk";
import { en } from "./en";

export type { Locale, Translations };
export { sk, en };

const translations: Record<Locale, Translations> = { sk, en };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

// ─── Context ────────────────────────────────────────────────────────────────

export interface I18nContextValue {
  locale: Locale;
  t: Translations;
  /** Returns the path with locale prefix (e.g., /en/upload or /upload) */
  localePath: (path: string) => string;
  /** Returns the alternate locale path for language switching */
  switchLocalePath: (currentPath: string) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "sk",
  t: sk,
  localePath: (p) => p,
  switchLocalePath: (p) => `/en${p}`,
});

export function useT() {
  return useContext(I18nContext);
}

// ─── Locale detection from URL ──────────────────────────────────────────────

export function detectLocaleFromPath(path: string): Locale {
  if (path.startsWith("/en") && (path === "/en" || path.startsWith("/en/"))) {
    return "en";
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
  return path;
}
