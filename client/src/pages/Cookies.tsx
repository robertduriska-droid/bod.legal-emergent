import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Cookies() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-2">Zásady používania cookies</h1>
          <p className="text-sm text-muted-foreground font-sans mb-8">Platné od 1. januára 2025</p>
          
          <div className="prose prose-sm font-sans max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-serif text-foreground">Čo sú cookies?</h2>
              <p>Cookies sú malé textové súbory, ktoré sa ukladajú vo vašom prehliadači pri návšteve webovej stránky. Pomáhajú nám zabezpečiť správne fungovanie stránky a zlepšovať vaše používateľské prostredie.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">Typy cookies, ktoré používame</h2>
              
              <h3 className="text-lg font-serif text-foreground mt-4">Nevyhnutné cookies</h3>
              <p>Tieto cookies sú potrebné pre základné fungovanie stránky. Zahŕňajú:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Autentifikačné cookies (prihlásenie používateľa)</li>
                <li>Bezpečnostné cookies (ochrana pred CSRF útokmi)</li>
                <li>Cookies relácie (session cookies)</li>
              </ul>

              <h3 className="text-lg font-serif text-foreground mt-4">Analytické cookies</h3>
              <p>Používame analytické nástroje na pochopenie, ako návštevníci používajú našu stránku. Tieto cookies zbierajú anonymizované údaje o:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Počte návštev stránky</li>
                <li>Zdrojoch návštevnosti</li>
                <li>Správaní na stránke (navštívené podstránky, čas strávený na stránke)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">Správa cookies</h2>
              <p>Väčšina webových prehliadačov umožňuje kontrolovať cookies prostredníctvom nastavení. Môžete:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Zobraziť a vymazať existujúce cookies</li>
                <li>Blokovať cookies od tretích strán</li>
                <li>Blokovať všetky cookies</li>
                <li>Vymazať všetky cookies pri zatvorení prehliadača</li>
              </ul>
              <p className="mt-2">Upozorňujeme, že blokovanie nevyhnutných cookies môže obmedziť funkčnosť stránky.</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">Právny základ</h2>
              <p>Nevyhnutné cookies používame na základe oprávneného záujmu (čl. 6 ods. 1 písm. f) GDPR). Analytické cookies používame na základe vášho súhlasu (čl. 6 ods. 1 písm. a) GDPR).</p>
            </section>

            <section>
              <h2 className="text-xl font-serif text-foreground">Kontakt</h2>
              <p>V prípade otázok týkajúcich sa cookies nás kontaktujte na info@bod.legal.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
