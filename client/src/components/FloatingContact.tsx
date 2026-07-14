import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { useT } from "@/i18n";

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const { locale } = useT();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <a
            href="https://wa.me/421917333692?text=Dobr%C3%BD%20de%C5%88%2C%20m%C3%A1m%20ot%C3%A1zku%20oh%C4%BEadom%20bod.legal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-green-700 transition-colors text-sm font-sans font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href="tel:+421917333692"
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-full shadow-lg hover:bg-foreground/90 transition-colors text-sm font-sans font-medium"
          >
            <Phone className="h-4 w-4" />
            +421 917 333 692
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
        aria-label={
          open
            ? locale === "en" ? "Close contact" : locale === "cz" ? "Zavřít kontakt" : "Zavrieť kontakt"
            : locale === "en" ? "Contact us" : locale === "cz" ? "Kontaktovat nás" : "Kontaktovať nás"
        }
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
