import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VOP() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">Všeobecné obchodné podmienky</h1>
          <p className="text-sm text-muted-foreground font-sans mb-8">Platné od 1. januára 2025</p>
          
          <div className="prose prose-sm font-sans max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-serif text-foreground">1. Úvodné ustanovenia</h2>
              <p>Tieto Všeobecné obchodné podmienky (ďalej len „VOP") upravujú práva a povinnosti medzi poskytovateľom služby bod.legal — spoločnosťou Kilian Legal s.r.o., IČO: 56 153 406, so sídlom v Bratislave (ďalej len „Poskytovateľ") a používateľom služby (ďalej len „Klient").</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">2. Predmet služby</h2>
              <p>Poskytovateľ prostredníctvom platformy bod.legal poskytuje službu AI-podporovanej analýzy zmlúv, ktorá zahŕňa:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Automatizovanú analýzu klauzúl zmluvy pomocou umelej inteligencie</li>
                <li>Identifikáciu právnych rizík s odkazmi na slovenské a európske právne predpisy</li>
                <li>Overenie AI nálezov advokátom (pri vybraných plánoch)</li>
                <li>Vypracovanie štruktúrovaného reportu s odporúčaniami</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">3. Cenové plány</h2>
              <p>Služba je poskytovaná v nasledujúcich cenových plánoch:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Základná kontrola (149 €)</strong> — AI analýza bez advokátskeho overenia, do 20 strán</li>
                <li><strong>Štandardná kontrola (349 €)</strong> — AI analýza s overením advokátom, do 50 strán</li>
                <li><strong>Prémiová kontrola (749 €)</strong> — Plná právna analýza vrátane konzultácie, do 100 strán</li>
                <li><strong>Legal Audit</strong> — Individuálna cenová ponuka pre komplexné projekty</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">4. Dodacie lehoty</h2>
              <p>Poskytovateľ sa zaväzuje dodať analýzu v nasledujúcich lehotách od prijatia objednávky:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Základná kontrola: do 24 hodín</li>
                <li>Štandardná kontrola: do 48 hodín</li>
                <li>Prémiová kontrola: do 72 hodín</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">5. Zodpovednosť</h2>
              <p>Základná kontrola predstavuje informatívnu AI analýzu a nepredstavuje právne poradenstvo v zmysle zákona č. 586/2003 Z. z. o advokácii. Štandardná a Prémiová kontrola sú overené advokátom a predstavujú kvalifikované právne stanovisko.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">6. Ochrana dôverných informácií</h2>
              <p>Poskytovateľ sa zaväzuje zachovávať mlčanlivosť o všetkých skutočnostiach, o ktorých sa dozvedel v súvislosti s poskytovaním služby, v súlade s § 23 zákona o advokácii. Všetky dokumenty sú šifrované pri prenose aj uložení.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">7. Reklamácie</h2>
              <p>Klient má právo reklamovať poskytnutú službu do 14 dní od jej dodania. Reklamáciu je možné podať elektronicky na adrese info@bod.legal.</p>
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
