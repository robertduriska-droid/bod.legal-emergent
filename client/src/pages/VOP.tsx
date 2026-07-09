import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VOP() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">Všeobecné obchodné podmienky</h1>
          <p className="text-sm text-muted-foreground font-sans mb-4">Platné od 1. júla 2025</p>

          {/* Disclaimer Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm font-sans text-amber-800">
              <strong>[NA SCHVÁLENIE ADVOKÁTOM]</strong> - Tieto VOP sú pracovný návrh a nadobudnú účinnosť až po schválení advokátom a zverejnení finálnej verzie.
            </p>
          </div>
          
          <div className="prose prose-sm font-sans max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-serif text-foreground">1. Úvodné ustanovenia</h2>
              <p>Tieto Všeobecné obchodné podmienky (ďalej len "VOP") upravujú práva a povinnosti medzi poskytovateľom služby bod.legal - spoločnosťou KILIAN LEGAL s.r.o., IČO: 53 957 008, so sídlom Hrudky 1401/46A, Chorvátsky Grob 900 25 (ďalej len "Poskytovateľ") a používateľom služby (ďalej len "Klient").</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">2. Predmet služby</h2>
              <p>Poskytovateľ prostredníctvom platformy bod.legal poskytuje službu AI-podporovanej analýzy zmlúv, ktorá zahŕňa:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Automatizovanú analýzu klauzúl zmluvy pomocou umelej inteligencie</li>
                <li>Identifikáciu právnych rizík s odkazmi na slovenské a európske právne predpisy (Slov-Lex, EUR-Lex)</li>
                <li>Overenie AI nálezov advokátom (pri Štandardnej a Prémiovej kontrole)</li>
                <li>Vypracovanie štruktúrovaného reportu s odporúčaniami</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">3. Cenové plány</h2>
              <p>Služba je poskytovaná v nasledujúcich cenových plánoch:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Základná kontrola (149 eur)</strong> - AI analýza bez advokátskeho overenia, do 30 strán</li>
                <li><strong>Štandardná kontrola (249 eur)</strong> - AI analýza s overením advokátom, do 50 strán</li>
                <li><strong>Prémiová kontrola (399 eur)</strong> - AI analýza, overenie advokátom a redline dokument, do 100 strán</li>
                <li><strong>Express dodanie (+99 eur)</strong> - Prioritné spracovanie do 4 hodín (doplnok k ľubovoľnému plánu)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">4. Dodacie lehoty</h2>
              <p>Poskytovateľ sa zaväzuje dodať analýzu v nasledujúcich lehotách od prijatia objednávky a platby:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Štandardné dodanie: do 24 hodín</li>
                <li>Express dodanie: do 4 hodín</li>
              </ul>
              <p>Ak Poskytovateľ nedodá report v sľúbenej lehote, Klient nemá povinnosť platiť (garancia dodania).</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">5. Zodpovednosť</h2>
              <p>Základná kontrola predstavuje informatívnu AI analýzu a nepredstavuje právne poradenstvo v zmysle zákona č. 586/2003 Z. z. o advokácii. Štandardná a Prémiová kontrola sú overené advokátom zapísaným v Slovenskej advokátskej komore.</p>
              <p>Poskytovateľ nezodpovedá za obchodné rozhodnutia Klienta učinené na základe reportu. Report slúži ako podklad pre rozhodovanie, nie ako garancia právneho výsledku.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">6. Ochrana dôverných informácií</h2>
              <p>Poskytovateľ sa zaväzuje zachovávať mlčanlivosť o všetkých skutočnostiach, o ktorých sa dozvedel v súvislosti s poskytovaním služby, v súlade s § 23 zákona o advokácii. Všetky dokumenty sú šifrované pri prenose (TLS) aj uložení.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">7. Reklamácie</h2>
              <p>Klient má právo reklamovať poskytnutú službu do 14 dní od jej dodania. Reklamáciu je možné podať elektronicky na adrese robert.duriska@bod.legal.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">8. Záverečné ustanovenia</h2>
              <p>Tieto VOP sa riadia právnym poriadkom Slovenskej republiky. Vzťahy neupravené týmito VOP sa riadia príslušnými ustanoveniami Obchodného zákonníka a ďalších právnych predpisov SR.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
