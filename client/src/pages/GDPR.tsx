import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function GDPR() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">Ochrana osobných údajov</h1>
          <p className="text-sm text-muted-foreground font-sans mb-4">V sulade s nariadenim (EU) 2016/679 (GDPR)</p>

          {/* Disclaimer Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm font-sans text-amber-800">
              <strong>[NA SCHVALENIE ADVOKATOM]</strong> - Tento dokument je pracovny navrh. Finalna verzia bude zverejnena po pravnom audite.
            </p>
          </div>
          
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
                <li>Poskytovatelia cloudovych sluzieb (ulozisko dokumentov) - EU region</li>
                <li>Poskytovatelia AI modelov - spracuvanie v sulade s cl. 28 GDPR</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
