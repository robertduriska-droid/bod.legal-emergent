import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Shield, Brain, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-6">O nas</h1>
          
          <div className="prose prose-sm font-sans max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              bod.legal je produkt advokatskej kancelarie KILIAN LEGAL s.r.o. Kombinujeme pravnu expertizu s AI technologiou na kontrolu obchodnych zmlúv.
            </p>

            <h2 className="text-2xl font-serif mt-12 mb-4">Co robime</h2>
            <p className="text-muted-foreground mb-8">
              Kontrolujeme obchodne zmluvy pre firmy a podnikatelov. AI analyzuje kazdu klauzulu, identifikuje rizika a doplni odkazy na konkretne paragrafy slovenskych a europskych pravnych predpisov. Pri Standardnej a Premiovej kontrole advokat overi nalezy a podpise report.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="flex gap-4">
                <Scale className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">Overenie advokatom</h3>
                  <p className="text-sm text-muted-foreground">Report pri Standardnej a Premiovej kontrole overuje advokat zapisany v Slovenskej advokatskej komore.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Brain className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">AI analyza</h3>
                  <p className="text-sm text-muted-foreground">Jazykove modely analyzuju zmluvu klauzulu po klauzule s odkazmi na Slov-Lex a EUR-Lex.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">Bezpecnost</h3>
                  <p className="text-sm text-muted-foreground">Sifrovane ulozisko, GDPR sulad a advokatska mlcanlivost.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">Pre firmy</h3>
                  <p className="text-sm text-muted-foreground">Zameravame sa na obchodne zmluvy: dodavatelske, ramcove, licencne, SPA a podobne.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-serif mt-12 mb-4">KILIAN LEGAL s.r.o.</h2>
            <div className="bg-muted/30 rounded-lg p-6 border">
              <table className="text-sm font-sans w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium w-40">Obchodne meno</td>
                    <td className="py-2 text-muted-foreground">KILIAN LEGAL s.r.o.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">ICO</td>
                    <td className="py-2 text-muted-foreground">53 957 008</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Sidlo</td>
                    <td className="py-2 text-muted-foreground">Hrudky 1401/46A, Chorvatsky Grob 900 25</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Den zapisu</td>
                    <td className="py-2 text-muted-foreground">20.07.2021</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Pravna forma</td>
                    <td className="py-2 text-muted-foreground">Spolocnost s rucenim obmedzenym</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Konatel</td>
                    <td className="py-2 text-muted-foreground">Michal Kilian</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Zakladne imanie</td>
                    <td className="py-2 text-muted-foreground">5 000 eur (splatene: 5 000 eur)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">E-mail</td>
                    <td className="py-2 text-muted-foreground"><a href="mailto:robert.duriska@bod.legal" className="text-primary hover:underline">robert.duriska@bod.legal</a></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Telefon</td>
                    <td className="py-2 text-muted-foreground"><a href="tel:+421917333692" className="text-primary hover:underline">+421 917 333 692</a></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Web</td>
                    <td className="py-2 text-muted-foreground"><a href="https://bod.legal" className="text-primary hover:underline">bod.legal</a></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-serif mt-12 mb-4">Pravne zdroje</h2>
            <p className="text-muted-foreground mb-4">
              AI analyza odkazuje na oficialne pravne zdroje:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://www.slov-lex.sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Slov-Lex</a> - Pravny a informacny portal Ministerstva spravodlivosti SR</li>
              <li><a href="https://eur-lex.europa.eu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EUR-Lex</a> - Pravo Europskej unie</li>
              <li><a href="https://www.crz.gov.sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CRZ</a> - Centralny register zmluv</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
