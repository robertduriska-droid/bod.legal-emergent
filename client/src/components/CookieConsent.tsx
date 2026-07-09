import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const COOKIE_KEY = "bod_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // Delay showing to avoid layout shift on first paint
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-300">
      <div className="container max-w-3xl">
        <div className="bg-white border shadow-lg rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-sm font-sans text-muted-foreground flex-1">
            Táto stránka používa cookies na zabezpečenie funkčnosti a analytiku návštevnosti.{" "}
            <Link href="/cookies" className="text-primary underline">Viac informácií</Link>
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="font-sans text-xs" onClick={decline}>
              Odmietnuť
            </Button>
            <Button size="sm" className="font-sans text-xs" onClick={accept}>
              Súhlasím
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
