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
              bod.legal je produkt advokátskej kancelárie Kilian Legal s.r.o. Kombinujeme právnu expertízu s najmodernejšou AI technológiou, aby sme sprístupnili kvalitnú právnu kontrolu zmlúv každému.
            </p>

            <h2 className="text-2xl font-serif mt-12 mb-4">Naša misia</h2>
            <p className="text-muted-foreground mb-8">
              Veríme, že každá zmluva si zaslúži dôkladnú kontrolu. Tradičné právne služby sú často drahé a pomalé. bod.legal tento problém rieši kombináciou AI analýzy a advokátskeho overenia — rýchlo, presne a za zlomok tradičnej ceny.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="flex gap-4">
                <Scale className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">Právna istota</h3>
                  <p className="text-sm text-muted-foreground">Každý report je overený advokátom zapísaným v Slovenskej advokátskej komore.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Brain className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-sans font-semibold mb-1">AI technológia</h3>
                  <p className="text-sm text-muted-foreground">Využívame najnovšie jazykové modely na analýzu klauzula po klauzule.</p>
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
                  <h3 className="font-sans font-semibold mb-1">Dostupnosť</h3>
                  <p className="text-sm text-muted-foreground">Kvalitná právna kontrola za cenu dostupnú pre každého podnikateľa.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-serif mt-12 mb-4">KILIAN LEGAL s.r.o.</h2>
            <div className="bg-muted/30 rounded-lg p-6 border">
              <p className="text-sm text-muted-foreground mb-4">
                KILIAN LEGAL s.r.o. je advokátska kancelária zapísaná v Obchodnom registri Mestského súdu Bratislava III, oddiel Sro, vložka číslo 154082/B.
              </p>
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
                    <td className="py-2 font-medium">Predmet podnikania</td>
                    <td className="py-2 text-muted-foreground">Poskytovanie právnych služieb</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Konateľ</td>
                    <td className="py-2 text-muted-foreground">Michal Kilian</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Základné imanie</td>
                    <td className="py-2 text-muted-foreground">5 000 EUR (splatené: 5 000 EUR)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">E-mail</td>
                    <td className="py-2 text-muted-foreground"><a href="mailto:robert.duriska@bod.legal" className="text-primary hover:underline">robert.duriska@bod.legal</a></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Telefón</td>
                    <td className="py-2 text-muted-foreground"><a href="tel:+421917333692" className="text-primary hover:underline">+421 917 333 692</a></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">WhatsApp</td>
                    <td className="py-2 text-muted-foreground"><a href="https://wa.me/421905329200" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">+421 905 329 200</a></td>
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
              Naša AI analýza je podložená odkazmi na oficiálne právne zdroje:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://www.slov-lex.sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Slov-Lex</a> — Právny a informačný portál Ministerstva spravodlivosti SR</li>
              <li><a href="https://eur-lex.europa.eu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EUR-Lex</a> — Právo Európskej únie</li>
              <li><a href="https://www.crz.gov.sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CRZ</a> — Centrálny register zmlúv</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
