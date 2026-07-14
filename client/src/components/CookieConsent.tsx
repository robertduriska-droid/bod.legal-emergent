import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useT } from "@/i18n";

const COOKIE_KEY = "bod_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t, localePath } = useT();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  const cookiesPath = localePath("/cookies");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-300">
      <div className="container max-w-3xl">
        <div className="bg-white border shadow-lg rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-sm font-sans text-muted-foreground flex-1">
            {t.cookieConsent.message}{" "}
            <Link href={cookiesPath} className="text-primary underline">{t.cookieConsent.moreInfo}</Link>
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="font-sans text-xs" onClick={decline}>
              {t.cookieConsent.reject}
            </Button>
            <Button size="sm" className="font-sans text-xs" onClick={accept}>
              {t.cookieConsent.accept}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
