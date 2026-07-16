import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { useT } from "@/i18n";
import { CONTACT, whatsappUrl } from "@/lib/contact";

const TX = {
  sk: {
    whatsappPrefill: "Dobrý deň, mám otázku ohľadom bod.legal",
    availability: "po až pia, 9:00 až 17:00",
    openLabel: "Kontaktovať nás",
    closeLabel: "Zavrieť kontakt",
  },
  cz: {
    whatsappPrefill: "Dobrý den, mám dotaz ohledně bod.legal",
    availability: "po až pá, 9:00 až 17:00",
    openLabel: "Kontaktovat nás",
    closeLabel: "Zavřít kontakt",
  },
  en: {
    whatsappPrefill: "Hello, I have a question about bod.legal",
    availability: "Mon to Fri, 9:00 to 17:00",
    openLabel: "Contact us",
    closeLabel: "Close contact",
  },
  hu: {
    whatsappPrefill: "Jó napot kívánok, kérdésem van a bod.legal kapcsán",
    availability: "hétfőtől péntekig, 9:00 és 17:00 között",
    openLabel: "Kapcsolatfelvétel",
    closeLabel: "Kapcsolat bezárása",
  },
};

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const { locale } = useT();
  const tx = TX[locale] ?? TX.sk;

  const waUrl = whatsappUrl(tx.whatsappPrefill);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-xs font-sans text-muted-foreground bg-white/90 backdrop-blur rounded-full px-3 py-1 border shadow-sm self-end">
            {tx.availability}
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-green-700 transition-colors text-sm font-sans font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href={`tel:${CONTACT.phoneNumber}`}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-full shadow-lg hover:bg-foreground/90 transition-colors text-sm font-sans font-medium"
          >
            <Phone className="h-4 w-4" />
            {CONTACT.phoneDisplay}
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
        aria-label={open ? tx.closeLabel : tx.openLabel}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
