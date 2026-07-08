import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AIAct() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">Informácie o využívaní AI</h1>
          <p className="text-sm text-muted-foreground font-sans mb-8">V súlade s nariadením (EÚ) 2024/1689 (AI Act)</p>
          
          <div className="prose prose-sm font-sans max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-serif text-foreground">1. Transparentnosť využívania AI</h2>
              <p>V súlade s nariadením Európskeho parlamentu a Rady (EÚ) 2024/1689 o harmonizovaných pravidlách pre umelú inteligenciu (AI Act) vás informujeme, že služba bod.legal využíva systémy umelej inteligencie na analýzu zmluvných dokumentov.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">2. Klasifikácia rizika</h2>
              <p>Podľa AI Act klasifikujeme náš systém ako systém AI s <strong>obmedzeným rizikom</strong> (limited risk), keďže:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Generuje obsah (právnu analýzu), ktorý je vždy overený ľudským odborníkom</li>
                <li>Neprijíma autonómne rozhodnutia s právnymi účinkami</li>
                <li>Slúži ako podporný nástroj pre advokáta, nie ako jeho náhrada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">3. Ako AI funguje v bod.legal</h2>
              <p>Náš AI systém vykonáva nasledujúce úlohy:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Extrakcia textu</strong> — rozpoznanie a štruktúrovanie textu z nahraného dokumentu</li>
                <li><strong>Identifikácia klauzúl</strong> — rozdelenie zmluvy na jednotlivé klauzuly</li>
                <li><strong>Analýza rizík</strong> — posúdenie každej klauzuly z hľadiska právnych rizík</li>
                <li><strong>Citácia právnych zdrojov</strong> — priradenie relevantných právnych predpisov zo Slov-Lex a EUR-Lex</li>
                <li><strong>Návrhy úprav</strong> — generovanie návrhov na zlepšenie problematických klauzúl</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">4. Ľudský dohľad</h2>
              <p>V súlade s princípom human-in-the-loop:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Každý AI-generovaný report je pred doručením klientovi skontrolovaný advokátom</li>
                <li>Advokát môže upraviť, doplniť alebo odmietnuť AI nálezy</li>
                <li>Finálny report je podpísaný advokátom, ktorý preberá zodpovednosť za jeho obsah</li>
                <li>AI systém nikdy neprijíma autonómne právne rozhodnutia</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">5. Obmedzenia AI systému</h2>
              <p>Upozorňujeme na nasledujúce obmedzenia:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI môže nesprávne interpretovať neštandardné alebo nejasné formulácie</li>
                <li>Systém pracuje s právnym stavom k dátumu poslednej aktualizácie databázy</li>
                <li>AI analýza nepredstavuje právne poradenstvo bez overenia advokátom</li>
                <li>Výsledky závisia od kvality nahraného dokumentu (čitateľnosť, formát)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">6. Vaše práva</h2>
              <p>V súvislosti s využívaním AI máte právo:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Byť informovaný o tom, že interagujete s AI systémom</li>
                <li>Požiadať o vysvetlenie AI rozhodnutí</li>
                <li>Požiadať o výlučne ľudské posúdenie vašej zmluvy (za príplatok)</li>
                <li>Podať sťažnosť na fungovanie AI systému</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">7. Kontakt</h2>
              <p>V prípade otázok týkajúcich sa využívania AI v službe bod.legal nás kontaktujte na info@bod.legal.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
