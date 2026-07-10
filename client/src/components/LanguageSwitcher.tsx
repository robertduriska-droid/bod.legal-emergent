import { useLocation } from "wouter";
import { useT } from "@/i18n";

export default function LanguageSwitcher() {
  const { locale, switchLocalePath } = useT();
  const [location, setLocation] = useLocation();

  const handleSwitch = () => {
    const newPath = switchLocalePath(location);
    setLocation(newPath);
  };

  return (
    <button
      onClick={handleSwitch}
      className="flex items-center gap-1 font-sans text-[12px] uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/50 hover:border-border"
      aria-label={locale === "sk" ? "Switch to English" : "Prepnúť na slovenčinu"}
    >
      <span className={locale === "sk" ? "font-bold text-foreground" : ""}>SK</span>
      <span className="text-border">|</span>
      <span className={locale === "en" ? "font-bold text-foreground" : ""}>EN</span>
    </button>
  );
}
