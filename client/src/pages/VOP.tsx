import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VOP() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">Vseobecne obchodne podmienky</h1>
          <p className="text-sm text-muted-foreground font-sans mb-4">Platne od 1. julá 2025</p>

          {/* Disclaimer Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm font-sans text-amber-800">
              <strong>[NA SCHVALENIE ADVOKATOM]</strong> - Tieto VOP su pracovny navrh a nadobudnu ucinnost az po schvaleni advokatom a zverejneni finalnej verzie.
            </p>
          </div>
          
          <div className="prose prose-sm font-sans max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-serif text-foreground">1. Uvodne ustanovenia</h2>
              <p>Tieto Vseobecne obchodne podmienky (dalej len "VOP") upravuju prava a povinnosti medzi poskytovatelom sluzby bod.legal - spolocnostou KILIAN LEGAL s.r.o., ICO: 53 957 008, so sidlom Hrudky 1401/46A, Chorvatsky Grob 900 25 (dalej len "Poskytovatel") a pouzivatelom sluzby (dalej len "Klient").</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">2. Predmet sluzby</h2>
              <p>Poskytovatel prostrednictvom platformy bod.legal poskytuje sluzbu AI-podporovanej analyzy zmlúv, ktora zahrna:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Automatizovanu analyzu klauzúl zmluvy pomocou umelej inteligencie</li>
                <li>Identifikaciu pravnych rizik s odkazmi na slovenske a europske pravne predpisy (Slov-Lex, EUR-Lex)</li>
                <li>Overenie AI nalezov advokatom (pri Standardnej a Premiovej kontrole)</li>
                <li>Vypracovanie strukturovaneho reportu s odporucaniami</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">3. Cenove plany</h2>
              <p>Sluzba je poskytovana v nasledujucich cenovych planoch:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Zakladna kontrola (149 eur)</strong> - AI analyza bez advokatskeho overenia, do 30 stran</li>
                <li><strong>Standardna kontrola (249 eur)</strong> - AI analyza s overenim advokatom, do 50 stran</li>
                <li><strong>Premiova kontrola (399 eur)</strong> - AI analyza, overenie advokatom a redline dokument, do 100 stran</li>
                <li><strong>Express dodanie (+99 eur)</strong> - Prioritne spracovanie do 4 hodin (doplnok k lubovolnemu planu)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">4. Dodacie lehoty</h2>
              <p>Poskytovatel sa zavazuje dodat analyzu v nasledujucich lehotach od prijatia objednavky a platby:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Standardne dodanie: do 24 hodin</li>
                <li>Express dodanie: do 4 hodin</li>
              </ul>
              <p>Ak Poskytovatel nedoda report v slubenej lehote, Klient nema povinnost platit (garancia dodania).</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">5. Zodpovednost</h2>
              <p>Zakladna kontrola predstavuje informativnu AI analyzu a nepredstavuje pravne poradenstvo v zmysle zakona c. 586/2003 Z. z. o advokacii. Standardna a Premiova kontrola su overene advokatom zapisanym v Slovenskej advokatskej komore.</p>
              <p>Poskytovatel nezodpoveda za obchodne rozhodnutia Klienta ucinene na zaklade reportu. Report sluzi ako podklad pre rozhodovanie, nie ako garancia pravneho vysledku.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">6. Ochrana dovernych informacii</h2>
              <p>Poskytovatel sa zavazuje zachovavat mlcanlivost o vsetkych skutocnostiach, o ktorych sa dozvedel v suvislosti s poskytovanim sluzby, v sulade s § 23 zakona o advokacii. Vsetky dokumenty su sifrovane pri prenose (TLS) aj ulozeni.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">7. Reklamacie</h2>
              <p>Klient ma pravo reklamovat poskytnutu sluzbu do 14 dni od jej dodania. Reklamaciu je mozne podat elektronicky na adrese robert.duriska@bod.legal.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">8. Zaverecne ustanovenia</h2>
              <p>Tieto VOP sa riadia pravnym poriadkom Slovenskej republiky. Vztahy neupravene tymito VOP sa riadia prislusnymi ustanoveniami Obchodneho zakonnika a dalsich pravnych predpisov SR.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
