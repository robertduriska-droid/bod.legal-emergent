import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Clock, FileText, Scale, CheckCircle, ArrowRight, Upload, Brain, UserCheck, Lock, Eye, Server, Award } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-hero-bg text-hero-text py-24 md:py-32 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
              AI kontrola zmlúv<br />
              <span className="text-muted-foreground/70">overená advokátom</span>
            </h1>
            <p className="text-lg md:text-xl text-hero-text/70 mb-8 max-w-2xl mx-auto font-sans">
              Nahrajte zmluvu a do 24 hodín dostanete kompletnú analýzu rizík s odkazmi na slovenské a európske právne predpisy. Každý report overí advokát.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/upload">
                  <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8">
                    Nahrať zmluvu
                    <Upload className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8" onClick={() => startLogin()}>
                  Začať kontrolu
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <a href="#pricing">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-sans px-8">
                  Pozrieť cenník
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-hero-bg/50" />
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-serif text-foreground">24h</p>
              <p className="text-muted-foreground font-sans mt-1">Dodanie analýzy</p>
            </div>
            <div>
              <p className="text-3xl font-serif text-foreground">10 000+</p>
              <p className="text-muted-foreground font-sans mt-1">Analyzovaných klauzúl</p>
            </div>
            <div>
              <p className="text-3xl font-serif text-foreground">od 149 €</p>
              <p className="text-muted-foreground font-sans mt-1">Za kompletnú kontrolu</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-warm-bg" id="how-it-works">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">Ako to funguje</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto font-sans">
            Tri jednoduché kroky k bezpečnej zmluve
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">1. Nahrajte zmluvu</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Nahrajte PDF alebo DOCX súbor a vyberte si cenový plán podľa rozsahu zmluvy.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">2. AI analýza</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Naša AI analyzuje každú klauzulu a identifikuje riziká s odkazmi na Slov-Lex a EUR-Lex.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">3. Overenie advokátom</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Advokát skontroluje AI nálezy, doplní anotácie a podpíše finálny report.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Trust Signals */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">Bezpečnosť a dôvera</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-6">
              <Lock className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">Šifrované úložisko</h4>
              <p className="text-sm text-muted-foreground font-sans">Všetky dokumenty sú šifrované pri prenose aj uložení.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Eye className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">GDPR súlad</h4>
              <p className="text-sm text-muted-foreground font-sans">Spracovanie údajov v súlade s nariadením (EÚ) 2016/679.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Server className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">EU infraštruktúra</h4>
              <p className="text-sm text-muted-foreground font-sans">Dáta spracované výhradne v rámci EÚ.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">Advokátska kancelária</h4>
              <p className="text-sm text-muted-foreground font-sans">Prevádzkované Kilian Legal s.r.o., zapísanou advokátskou kanceláriou.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-warm-bg">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">bod.legal vs. tradičný advokát</h2>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-4 font-semibold"></th>
                  <th className="py-4 px-4 font-semibold text-primary">bod.legal</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Tradičný advokát</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Čas dodania</td>
                  <td className="py-3 px-4 text-primary font-semibold">24 hodín</td>
                  <td className="py-3 px-4 text-muted-foreground">5–14 dní</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Cena</td>
                  <td className="py-3 px-4 text-primary font-semibold">od 149 €</td>
                  <td className="py-3 px-4 text-muted-foreground">od 500 €</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Právne zdroje</td>
                  <td className="py-3 px-4 text-primary font-semibold">Slov-Lex, EUR-Lex citácie</td>
                  <td className="py-3 px-4 text-muted-foreground">Závisí od advokáta</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Analýza klauzúl</td>
                  <td className="py-3 px-4 text-primary font-semibold">Každá klauzula jednotlivo</td>
                  <td className="py-3 px-4 text-muted-foreground">Súhrnné stanovisko</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Riziková mapa</td>
                  <td className="py-3 px-4 text-primary font-semibold">Interaktívna, farebná</td>
                  <td className="py-3 px-4 text-muted-foreground">Textový dokument</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Overenie advokátom</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> Áno</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> Áno</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Návrhy redline úprav</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> Automaticky</td>
                  <td className="py-3 px-4 text-muted-foreground">Za príplatok</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white" id="pricing">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">Cenník</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto font-sans">
            Vyberte si plán podľa rozsahu a zložitosti vašej zmluvy
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Basic */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-6 px-6">
                <h3 className="font-serif text-xl mb-1">Základná kontrola</h3>
                <p className="text-3xl font-serif mb-4">149 €</p>
                <p className="text-sm text-muted-foreground mb-4 font-sans">Dodanie do 24h</p>
                <ul className="space-y-2 text-sm font-sans mb-6">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> AI analýza rizík</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Kontrola klauzula po klauzule</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Report rizík</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Do 20 strán</li>
                </ul>
                <Button className="w-full font-sans" variant="outline" onClick={() => isAuthenticated ? window.location.href = '/upload?plan=basic' : startLogin()}>
                  Vybrať
                </Button>
              </CardContent>
            </Card>

            {/* Standard */}
            <Card className="border-2 border-primary shadow-md hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-sans font-semibold px-3 py-1 rounded-full">
                Najpopulárnejší
              </div>
              <CardContent className="pt-6 pb-6 px-6">
                <h3 className="font-serif text-xl mb-1">Štandardná kontrola</h3>
                <p className="text-3xl font-serif mb-4">349 €</p>
                <p className="text-sm text-muted-foreground mb-4 font-sans">Dodanie do 48h</p>
                <ul className="space-y-2 text-sm font-sans mb-6">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Všetko zo Základnej</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Kontrola advokátom</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Návrhy úprav</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Do 50 strán</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Prioritná podpora</li>
                </ul>
                <Button className="w-full font-sans" onClick={() => isAuthenticated ? window.location.href = '/upload?plan=standard' : startLogin()}>
                  Vybrať
                </Button>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-6 px-6">
                <h3 className="font-serif text-xl mb-1">Prémiová kontrola</h3>
                <p className="text-3xl font-serif mb-4">749 €</p>
                <p className="text-sm text-muted-foreground mb-4 font-sans">Dodanie do 72h</p>
                <ul className="space-y-2 text-sm font-sans mb-6">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Všetko zo Štandardnej</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Plná právna analýza</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> 30min konzultácia</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Do 100 strán</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Redline dokument</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Dedikovaný advokát</li>
                </ul>
                <Button className="w-full font-sans" variant="outline" onClick={() => isAuthenticated ? window.location.href = '/upload?plan=premium' : startLogin()}>
                  Vybrať
                </Button>
              </CardContent>
            </Card>

            {/* Legal Audit */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow bg-primary/[0.02]">
              <CardContent className="pt-6 pb-6 px-6">
                <h3 className="font-serif text-xl mb-1">Legal Audit</h3>
                <p className="text-3xl font-serif mb-4">Na mieru</p>
                <p className="text-sm text-muted-foreground mb-4 font-sans">Individuálne</p>
                <ul className="space-y-2 text-sm font-sans mb-6">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Všetky zmluvy skontrolované</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Riziková matica</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Compliance kontrola</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Priradený tím advokátov</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> 60min strategický call</li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Priebežná podpora</li>
                </ul>
                <Button className="w-full font-sans" variant="outline" onClick={() => isAuthenticated ? window.location.href = '/upload?plan=audit' : startLogin()}>
                  Kontaktovať
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-warm-bg" id="faq">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">Časté otázky</h2>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="q1" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Ako funguje AI analýza zmlúv?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Naša AI analyzuje každú klauzulu zmluvy individuálne. Identifikuje právne riziká, chýbajúce ustanovenia a navrhuje konkrétne úpravy. Každý nález je podložený odkazom na konkrétny paragraf slovenského alebo európskeho právneho predpisu zo Slov-Lex alebo EUR-Lex.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Je analýza právne záväzná?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Áno, pri plánoch Štandardná a vyššie je každý report overený a podpísaný advokátom zapísaným v Slovenskej advokátskej komore. Základná kontrola poskytuje AI analýzu bez advokátskeho overenia.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Aké formáty zmlúv akceptujete?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Akceptujeme zmluvy vo formáte PDF a DOCX. Odporúčame nahrať textové PDF (nie skenované obrázky) pre najlepšie výsledky analýzy.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Ako je zabezpečená dôvernosť mojich dokumentov?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Všetky dokumenty sú šifrované pri prenose (TLS) aj pri uložení (AES-256). Prístup k dokumentom má iba priradený advokát. Službu prevádzkuje Kilian Legal s.r.o., ktorá podlieha advokátskej mlčanlivosti podľa zákona o advokácii.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Čo je Slov-Lex a prečo ho používate?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Slov-Lex je oficiálny právny informačný portál Slovenskej republiky. Obsahuje konsolidované znenia zákonov, vyhlášok a nariadení. Naša AI cituje priamo z tohto zdroja, aby boli všetky nálezy overiteľné oproti aktuálnemu zneniu právnych predpisov.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Koľko trvá dodanie analýzy?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  AI analýza prebieha okamžite po nahratí zmluvy. Pri Základnej kontrole dostanete výsledky do 24 hodín. Pri Štandardnej do 48 hodín a pri Prémiovej do 72 hodín, vrátane overenia advokátom.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-hero-bg text-hero-text">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Začnite s kontrolou zmluvy</h2>
          <p className="text-hero-text/70 font-sans mb-8 max-w-lg mx-auto">
            Nahrajte zmluvu a zistite riziká skôr, než podpíšete. Rýchlo, presne a s právnou istotou.
          </p>
          {isAuthenticated ? (
            <Link href="/upload">
              <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8">
                Nahrať zmluvu
                <Upload className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8" onClick={() => startLogin()}>
              Vytvoriť účet zadarmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
