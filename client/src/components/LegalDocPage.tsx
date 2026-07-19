import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/i18n";
import { Info } from "lucide-react";
import { LEGAL_DOCS, LEGAL_EFFECTIVE_DATE, type LegalDocKey } from "@/generated/legal-docs";

// One shell for all four legal pages. The body text is NOT written here: it is
// rendered from client/src/generated/legal-docs.ts, which is generated from
// marketing/docs.json (the lawyer-verified, adversarially-reviewed source) by
// marketing/build_docs.py. So app.bod.legal and bod.legal always show the same
// text and cannot drift apart. To change a legal document, edit docs.json and
// re-run build_docs.py — never edit the text in the app.

const TITLES: Record<LegalDocKey, { sk: string; cz: string; en: string; hu: string }> = {
  vop: { sk: "Všeobecné obchodné podmienky", cz: "Všeobecné obchodní podmínky", en: "Terms and Conditions", hu: "Általános szerződési feltételek" },
  gdpr: { sk: "Ochrana osobných údajov", cz: "Ochrana osobních údajů", en: "Privacy Policy", hu: "Adatvédelmi tájékoztató" },
  cookies: { sk: "Zásady používania cookies", cz: "Zásady používání cookies", en: "Cookie Policy", hu: "Cookie-szabályzat" },
  ai: { sk: "Transparentnosť používania umelej inteligencie", cz: "Transparentnost používání umělé inteligence", en: "AI Transparency", hu: "Az MI használatának átláthatósága" },
};

// The binding text is Slovak only; non-Slovak visitors get a short notice.
const SLOVAK_ONLY: Record<"en" | "cz" | "hu", string> = {
  en: "This legal document is available in Slovak only. The Slovak version below is the legally binding text. For questions in English, contact us at info@bod.legal.",
  cz: "Tento právní dokument je dostupný pouze ve slovenštině. Níže uvedená slovenská verze je právně závazným textem. V případě otázek v češtině nás kontaktujte na info@bod.legal.",
  hu: "Ez a jogi dokumentum csak szlovák nyelven érhető el. Az alábbi szlovák változat a jogilag kötelező érvényű szöveg. Magyar nyelvű kérdésekkel forduljon hozzánk: info@bod.legal.",
};

function effectiveLabel(locale: string): string {
  if (locale === "en") return `Effective from ${LEGAL_EFFECTIVE_DATE}`;
  if (locale === "hu") return `Hatályos: ${LEGAL_EFFECTIVE_DATE}`;
  return `Účinné od ${LEGAL_EFFECTIVE_DATE}`;
}

export default function LegalDocPage({ docKey }: { docKey: LegalDocKey }) {
  const { locale } = useT();
  const doc = LEGAL_DOCS[docKey];
  const titleByLocale = TITLES[docKey];
  const title = locale === "en" ? titleByLocale.en : locale === "cz" ? titleByLocale.cz : locale === "hu" ? titleByLocale.hu : titleByLocale.sk;
  const notice = locale === "en" || locale === "cz" || locale === "hu" ? SLOVAK_ONLY[locale] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground font-sans mb-4">{effectiveLabel(locale)} · KILIAN LEGAL s. r. o.</p>

          {notice && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 mb-6">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm font-sans text-muted-foreground">{notice}</p>
            </div>
          )}

          <div
            className="prose prose-sm sm:prose-base max-w-none font-sans prose-headings:font-serif prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
