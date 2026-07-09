import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Shield, Brain, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-serif mb-6">O nás</h1>
          
          <div className="prose prose-sm font-sans max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              bod.legal je produkt advokátskej kancelárie KILIAN LEGAL s.r.o. Kombinujeme právnu expertízu s AI technológiou na kontrolu obchodných zmlúv.
            </p>

            <h2 className="text-2xl font-serif mt-12 mb-4">Čo robíme</h2>
            <p className="text-muted-foreground mb-8">
              Kontrolujeme obchodné zmluvy pre firmy a podnikateľov. AI analyzuje každú klauzulu, identifikuje riziká a doplní odkazy na konkrétne paragrafy slovenských a európskych právnych predpisov. Pri Štandardnej a Prémiovej kontrole advokát overí nálezy a podpíše report.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="flex gap-4">
                <Scale className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">Overenie advokátom</h3>
                  <p className="text-sm text-muted-foreground">Report pri Štandardnej a Prémiovej kontrole overuje advokát zapísaný v Slovenskej advokátskej komore.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Brain className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">AI analýza</h3>
                  <p className="text-sm text-muted-foreground">Jazykové modely analyzujú zmluvu klauzulu po klauzule s odkazmi na Slov-Lex a EUR-Lex.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">Bezpečnosť</h3>
                  <p className="text-sm text-muted-foreground">Šifrované úložisko, GDPR súlad a advokátska mlčanlivosť.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">Pre firmy</h3>
                  <p className="text-sm text-muted-foreground">Zameriavame sa na obchodné zmluvy: dodávateľské, rámcové, licenčné, SPA a podobne.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-serif mt-12 mb-4">KILIAN LEGAL s.r.o.</h2>
            <div className="bg-muted/30 rounded-lg p-6 border">
              <table className="text-sm font-sans w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium w-40">Obchodné meno</td>
                    <td className="py-2 text-muted-foreground">KILIAN LEGAL s.r.o.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">IČO</td>
                    <td className="py-2 text-muted-foreground">53 957 008</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Sídlo</td>
                    <td className="py-2 text-muted-foreground">Hrudky 1401/46A, Chorvátsky Grob 900 25</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Deň zápisu</td>
                    <td className="py-2 text-muted-foreground">20.07.2021</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Právna forma</td>
                    <td className="py-2 text-muted-foreground">Spoločnosť s ručením obmedzeným</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Konateľ</td>
                    <td className="py-2 text-muted-foreground">Michal Kilian</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Základné imanie</td>
                    <td className="py-2 text-muted-foreground">5 000 eur (splatené: 5 000 eur)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">E-mail</td>
                    <td className="py-2 text-muted-foreground"><a href="mailto:robert.duriska@bod.legal" className="text-primary hover:underline">robert.duriska@bod.legal</a></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Telefón</td>
                    <td className="py-2 text-muted-foreground"><a href="tel:+421917333692" className="text-primary hover:underline">+421 917 333 692</a></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Web</td>
                    <td className="py-2 text-muted-foreground"><a href="https://bod.legal" className="text-primary hover:underline">bod.legal</a></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-serif mt-12 mb-4">Právne zdroje</h2>
            <p className="text-muted-foreground mb-4">
              AI analýza odkazuje na oficiálne právne zdroje:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://www.slov-lex.sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Slov-Lex</a> - Právny a informačný portál Ministerstva spravodlivosti SR</li>
              <li><a href="https://eur-lex.europa.eu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EUR-Lex</a> - Právo Európskej únie</li>
              <li><a href="https://www.crz.gov.sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CRZ</a> - Centrálny register zmlúv</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
