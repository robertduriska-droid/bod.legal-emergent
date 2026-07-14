import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useT } from "@/i18n";
import { Info } from "lucide-react";

export default function VOP() {
  const { locale } = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">{locale === "en" ? "Terms and Conditions" : locale === "cz" ? "Všeobecné obchodní podmínky" : "Všeobecné obchodné podmienky"}</h1>
          <p className="text-sm text-muted-foreground font-sans mb-4">{locale === "en" ? "Effective from July 1, 2025" : locale === "cz" ? "Platné od 1. července 2025" : "Platné od 1. júla 2025"}</p>

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
                <li><strong>Základná kontrola (197 eur)</strong> - AI analýza bez advokátskeho overenia, do 30 strán</li>
                <li><strong>Štandardná kontrola (297 eur)</strong> - AI analýza s overením advokátom, do 50 strán</li>
                <li><strong>Prémiová kontrola (497 eur)</strong> - AI analýza, overenie advokátom a redline dokument, do 100 strán</li>
                <li><strong>Express dodanie (+127 eur)</strong> - Prioritné spracovanie do 4 hodín (doplnok k ľubovolnému plánu)</li>
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
