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
        if (locale === "en") {
          return path === "/" ? "/en" : `/en${path}`;
        }
        return path;
      },
      switchLocalePath: (currentPath: string) => {
        const stripped = stripLocalePrefix(currentPath);
        if (locale === "sk") {
          // Currently SK → switch to EN
          return stripped === "/" ? "/en" : `/en${stripped}`;
        }
        // Currently EN → switch to SK
        return stripped;
      },
    }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
