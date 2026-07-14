import { useMemo } from "react";
import { useLocation } from "wouter";
import { I18nContext, detectLocaleFromPath, stripLocalePrefix, getTranslations } from "./index";
import type { Locale } from "./types";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const locale: Locale = detectLocaleFromPath(location);
  const t = getTranslations(locale);

  const value = useMemo(
    () => ({
      locale,
      t,
      localePath: (path: string) => {
        if (locale === "sk") return path;
        return path === "/" ? `/${locale}` : `/${locale}${path}`;
      },
      switchLocalePath: (currentPath: string, targetLocale: Locale) => {
        const stripped = stripLocalePrefix(currentPath);
        if (targetLocale === "sk") return stripped;
        return stripped === "/" ? `/${targetLocale}` : `/${targetLocale}${stripped}`;
      },
    }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
