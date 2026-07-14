import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/i18n";
import { Info } from "lucide-react";

export default function GDPR() {
  const { locale } = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">{locale === "en" ? "Privacy Policy" : locale === "cz" ? "Ochrana osobních údajů" : "Ochrana osobných údajov"}</h1>
          <p className="text-sm text-muted-foreground font-sans mb-4">{locale === "en" ? "In accordance with Regulation (EU) 2016/679 (GDPR)" : locale === "cz" ? "V souladu s nařízením (EU) 2016/679 (GDPR)" : "V súlade s nariadením (EÚ) 2016/679 (GDPR)"}</p>

          {locale === "en" && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 mb-6">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-muted-foreground">
                This legal document is available in Slovak only. The Slovak version below is the legally binding text. For questions in English, contact us at robert.duriska@bod.legal.
              </p>
            </div>
          )}
          {locale === "cz" && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 mb-6">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-muted-foreground">
                Tento právní dokument je dostupný pouze ve slovenštině. Níže uvedená slovenská verze je právně závazným textem. V případě otázek v češtině nás kontaktujte na robert.duriska@bod.legal.
              </p>
            </div>
          )}


          
          <div className="prose prose-sm font-sans max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-serif text-foreground">1. Prevádzkovateľ</h2>
              <p>Prevádzkovateľom osobných údajov je KILIAN LEGAL s.r.o., IČO: 53 957 008, so sídlom Hrudky 1401/46A, Chorvátsky Grob 900 25, Slovenská republika (ďalej len „Prevádzkovateľ").</p>
              <p>Kontakt: robert.duriska@bod.legal | Tel: +421 917 333 692</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">2. Účel spracúvania</h2>
              <p>Osobné údaje spracúvame na nasledujúce účely:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Poskytovanie služby analýzy zmlúv (právny základ: plnenie zmluvy, čl. 6 ods. 1 písm. b) GDPR)</li>
                <li>Komunikácia s klientom (právny základ: oprávnený záujem, čl. 6 ods. 1 písm. f) GDPR)</li>
                <li>Plnenie zákonných povinností (právny základ: zákonná povinnosť, čl. 6 ods. 1 písm. c) GDPR)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">3. Rozsah spracúvaných údajov</h2>
              <p>Spracúvame nasledujúce kategórie osobných údajov:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Identifikačné údaje (meno, priezvisko)</li>
                <li>Kontaktné údaje (e-mailová adresa)</li>
                <li>Údaje o využívaní služby (nahrané dokumenty, história objednávok)</li>
                <li>Technické údaje (IP adresa, cookies)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">4. Doba uchovávania</h2>
              <p>Osobné údaje uchovávame po dobu nevyhnutnú na dosiahnutie účelu spracúvania:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Údaje súvisiace s poskytnutím služby: 5 rokov od ukončenia poskytovania služby</li>
                <li>Účtovné doklady: 10 rokov v súlade so zákonom o účtovníctve</li>
                <li>Nahrané dokumenty: 1 rok od dokončenia analýzy, pokiaľ klient nepožiada o skoršie vymazanie</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">5. Práva dotknutej osoby</h2>
              <p>Ako dotknutá osoba máte právo na:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Prístup k osobným údajom (čl. 15 GDPR)</li>
                <li>Opravu nesprávnych údajov (čl. 16 GDPR)</li>
                <li>Vymazanie údajov (čl. 17 GDPR)</li>
                <li>Obmedzenie spracúvania (čl. 18 GDPR)</li>
                <li>Prenosnosť údajov (čl. 20 GDPR)</li>
                <li>Namietanie proti spracúvaniu (čl. 21 GDPR)</li>
                <li>Podanie sťažnosti dozornému orgánu (Úrad na ochranu osobných údajov SR)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">6. Bezpečnosť údajov</h2>
              <p>Prevádzkovateľ prijal primerané technické a organizačné opatrenia na ochranu osobných údajov, vrátane:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Šifrovanie údajov pri prenose (TLS 1.3)</li>
                <li>Šifrovanie údajov pri uložení (AES-256)</li>
                <li>Obmedzenie prístupu na oprávnené osoby</li>
                <li>Pravidelné bezpečnostné audity</li>
                <li>Spracovanie údajov výhradne v rámci EÚ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">7. Sprostredkovatelia</h2>
              <p>Na spracúvanie osobných údajov využívame nasledujúcich sprostredkovateľov:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Poskytovatelia cloudových služieb (úložisko dokumentov) - EÚ región</li>
                <li>Poskytovatelia AI modelov - spracúvanie v súlade s čl. 28 GDPR</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
