import { createContext, useContext } from "react";
import type { Locale, Translations } from "./types";
import { sk } from "./sk";
import { cz } from "./cz";
import { en } from "./en";
import { hu } from "./hu";

export type { Locale, Translations };
export { sk, cz, en, hu };

// ─── Enabled locales ────────────────────────────────────────────────────────
// Single source of truth for which language versions are live.
//
// Only Slovak and English are enabled: every report is reviewed and signed by
// one advokat registered with the Slovak Bar (SAK), so the whole chain from AI
// analysis to lawyer sign-off runs under Slovak law. The Czech and Hungarian
// translations stay in the repo, parked, ready to switch back on the day a
// lawyer admitted in that jurisdiction can sign those reports: add the locale
// back to this list and restore its routes in App.tsx.
export const ENABLED_LOCALES: Locale[] = ["sk", "en"];

export function isLocaleEnabled(locale: string): locale is Locale {
  return (ENABLED_LOCALES as string[]).includes(locale);
}

const translations: Record<Locale, Translations> = { sk, cz, en, hu };

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
  for (const locale of ENABLED_LOCALES) {
    if (locale === "sk") continue; // Slovak is the unprefixed default
    if (path === `/${locale}` || path.startsWith(`/${locale}/`)) {
      return locale;
    }
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
  if (path.startsWith("/hu/")) {
    return path.slice(3); // Remove "/hu" prefix, keep the "/"
  }
  if (path === "/hu") {
    return "/";
  }
  return path;
}
