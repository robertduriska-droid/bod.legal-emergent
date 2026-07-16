import { useLocation } from "wouter";
import { useT, ENABLED_LOCALES, type Locale } from "@/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  sk: "SK",
  cz: "CZ",
  en: "EN",
  hu: "HU",
};

// Only the locales we can actually deliver end to end (see ENABLED_LOCALES).
const LOCALES: { code: Locale; label: string }[] = ENABLED_LOCALES.map(code => ({
  code,
  label: LOCALE_LABELS[code],
}));

export default function LanguageSwitcher() {
  const { locale, switchLocalePath } = useT();
  const [location, setLocation] = useLocation();

  const handleSwitch = (targetLocale: Locale) => {
    if (targetLocale === locale) return;
    const newPath = switchLocalePath(location, targetLocale);
    setLocation(newPath);
  };

  return (
    <div
      className="flex items-center gap-1 font-sans text-[12px] uppercase tracking-wide text-muted-foreground px-2 py-1 rounded border border-border/50"
      role="group"
      aria-label="Language selector"
    >
      {LOCALES.map((l, i) => (
        <span key={l.code} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">|</span>}
          <button
            onClick={() => handleSwitch(l.code)}
            className={`hover:text-foreground transition-colors ${
              locale === l.code ? "font-bold text-foreground" : ""
            }`}
          >
            {l.label}
          </button>
        </span>
      ))}
    </div>
  );
}
