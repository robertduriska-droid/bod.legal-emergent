import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Clock, FileText, CheckCircle, ArrowRight, Upload, Brain, UserCheck, Lock, Eye, Server, Award, Zap } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PRICING_PLANS, EXPRESS_ADDON } from "@shared/types";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-hero-bg text-hero-text py-24 md:py-32 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-normal mb-6 leading-tight">
              Dostali ste zmluvu<br />
              <span className="text-hero-text/60">na podpis?</span>
            </h1>
            <p className="text-lg md:text-xl text-hero-text/70 mb-8 max-w-2xl mx-auto font-sans">
              Nahrajte ju a do 24 hodin dostanete report s identifikovanymi rizikami, odkazmi na pravne predpisy a navrhmi uprav. Kazdy report overuje advokat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload">
                <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8">
                  Nahrat zmluvu
                  <Upload className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-sans px-8">
                  Pozriet cennik
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-hero-bg/50" />
      </section>

      {/* Stats Bar - honest metrics only */}
      <section className="bg-white border-b py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-serif font-normal text-foreground">do 24h</p>
              <p className="text-xs text-muted-foreground font-sans mt-1 uppercase tracking-wider">Dodanie reportu</p>
            </div>
            <div>
              <p className="text-3xl font-serif font-normal text-foreground">od 149 eur</p>
              <p className="text-xs text-muted-foreground font-sans mt-1 uppercase tracking-wider">Za kontrolu zmluvy</p>
            </div>
            <div>
              <p className="text-3xl font-serif font-normal text-foreground">Slov-Lex</p>
              <p className="text-xs text-muted-foreground font-sans mt-1 uppercase tracking-wider">Citacie pravnych predpisov</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-warm-bg" id="how-it-works">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">Ako to funguje</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto font-sans">
            Tri kroky od nahratia zmluvy po hotovy report
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-sans text-xl font-semibold mb-2">1. Nahrajte zmluvu</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Nahrajte PDF alebo DOCX. Vyberte si plan podla rozsahu zmluvy a zapladte online.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-sans text-xl font-semibold mb-2">2. AI analyza</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  AI analyzuje kazdu klauzulu, identifikuje rizika a doplni odkazy na Slov-Lex a EUR-Lex.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-sans text-xl font-semibold mb-2">3. Overenie advokatom</h3>
                <p className="text-muted-foreground font-sans text-sm">
                  Pri Standardnej a Premiovej kontrole advokat overi nalezy, doplni poznamky a podpise report.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why not ChatGPT */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">Preco nie ChatGPT?</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto font-sans">
            Vseobecne AI nastroje nepoznaju slovensky pravny system. bod.legal je postaveny na slovenskych a europskych pravnych predpisoch.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-6">
              <FileText className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">Slov-Lex citacie</h4>
              <p className="text-sm text-muted-foreground font-sans">Kazdy nalez odkazuje na konkretny paragraf platneho zakona.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Shield className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">Overenie advokatom</h4>
              <p className="text-sm text-muted-foreground font-sans">Advokat kontroluje AI vystupy a zodpoveda za spravnost.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Lock className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">Advokatska mlcanlivost</h4>
              <p className="text-sm text-muted-foreground font-sans">Vase dokumenty su chranene zakonnou povinnostou mlcanlivosti.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-sans font-semibold mb-1">Strukturovany report</h4>
              <p className="text-sm text-muted-foreground font-sans">Prehladny PDF s farebnymi rizikami, nie chat konverzacia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-warm-bg">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">bod.legal vs. tradicny advokat</h2>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-4 font-semibold"></th>
                  <th className="py-4 px-4 font-semibold text-primary">bod.legal</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Tradicny advokat</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Cas dodania</td>
                  <td className="py-3 px-4 text-primary font-semibold">do 24 hodin</td>
                  <td className="py-3 px-4 text-muted-foreground">5 az 14 dni</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Cena za kontrolu</td>
                  <td className="py-3 px-4 text-primary font-semibold">od 149 eur</td>
                  <td className="py-3 px-4 text-muted-foreground">typicky od 500 eur</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Pravne zdroje v reporte</td>
                  <td className="py-3 px-4 text-primary font-semibold">Slov-Lex, EUR-Lex odkazy</td>
                  <td className="py-3 px-4 text-muted-foreground">Zavisi od advokata</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Format analyzy</td>
                  <td className="py-3 px-4 text-primary font-semibold">Klauzula po klauzule</td>
                  <td className="py-3 px-4 text-muted-foreground">Suhrnne stanovisko</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Overenie advokatom</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> Standardna a vyssie</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> Ano</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Navrhy uprav (redline)</td>
                  <td className="py-3 px-4"><CheckCircle className="h-4 w-4 text-primary inline" /> Premiova kontrola</td>
                  <td className="py-3 px-4 text-muted-foreground">Za priplatok</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white" id="pricing">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">Cennik</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto font-sans">
            Vyberte si plan podla rozsahu a zlozitosti vasej zmluvy
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING_PLANS.map((plan, index) => (
              <Card key={plan.id} className={`border shadow-sm hover:shadow-md transition-shadow relative ${index === 1 ? "border-2 border-primary shadow-md" : ""}`}>
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-sans font-semibold px-3 py-1 rounded-full">
                    Odporucany
                  </div>
                )}
                <CardContent className="pt-6 pb-6 px-6">
                  <h3 className="font-sans text-xl font-semibold mb-1">{plan.nameSk}</h3>
                  <p className="text-3xl font-serif font-normal mb-1">{plan.priceLabel}</p>
                  <p className="text-sm text-muted-foreground mb-4 font-sans">{plan.delivery}</p>
                  <ul className="space-y-2 text-sm font-sans mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/upload?plan=${plan.id}`}>
                    <Button className={`w-full font-sans ${index === 1 ? "" : ""}`} variant={index === 1 ? "default" : "outline"}>
                      Vybrat
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Express Add-on */}
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="border border-dashed border-primary/30 bg-primary/[0.02]">
              <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-sans font-semibold">Express dodanie</p>
                    <p className="text-sm text-muted-foreground font-sans">{EXPRESS_ADDON.delivery} namiesto 24</p>
                  </div>
                </div>
                <p className="font-serif text-xl">{EXPRESS_ADDON.priceLabel}</p>
              </CardContent>
            </Card>
          </div>

          {/* Guarantee */}
          <div className="max-w-4xl mx-auto mt-6 text-center">
            <p className="text-sm text-muted-foreground font-sans">
              <Clock className="h-4 w-4 inline mr-1" />
              Garancia: Ak report nedodame v slubenom case, neplatite nic.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-warm-bg" id="faq">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">Caste otazky</h2>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="q1" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Pre koho je sluzba urcena?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Primarne pre podnikatelov a firmy, ktore podpisuju obchodne zmluvy (dodavatelske, ramcove, licencne, SPA a podobne). Neriesia sa spotrebitelske zmluvy ani pracovne zmluvy.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Co dostanem v reporte?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Report obsahuje analyzu kazdej klauzuly s hodnotenim rizika (vysoke, stredne, nizke), konkretne navrhy uprav a odkazy na prislusne paragrafy slovenskych a europskych pravnych predpisov. Pri Standardnej a Premiovej kontrole je report overeny advokatom.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Ake formaty zmlúv akceptujete?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  PDF a DOCX. Odporucame textove PDF (nie skenovane obrazky) pre presnejsie vysledky.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Je analyza pravne zavazna?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Zakladna kontrola je informatívna AI analyza bez advokatskej zodpovednosti. Standardna a Premiova kontrola su overene advokatom zapisanym v Slovenskej advokatskej komore, ktory za report zodpoveda.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Ako je zabezpecena dovernost?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Sluzbu prevadzkuje advokatska kancelaria KILIAN LEGAL s.r.o. Vase dokumenty su chranene zakonnou advokatskou mlcanlivostou. Data su sifrovane pri prenose (TLS) aj ulozeni.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6" className="bg-white rounded-lg border px-4">
                <AccordionTrigger className="font-sans font-medium text-left">Kolko trva dodanie?</AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  Standardne do 24 hodin od nahratia a zaplatenia. S Express dodanim ({EXPRESS_ADDON.priceLabel}) do 4 hodin. Ak nestihneme, neplatite.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-hero-bg text-hero-text">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Mate zmluvu na stole?</h2>
          <p className="text-hero-text/70 font-sans mb-8 max-w-lg mx-auto">
            Nahrajte ju teraz a do 24 hodin budete vediet, ci ju mozete podpisat.
          </p>
          <Link href="/upload">
            <Button size="lg" className="bg-white text-hero-bg hover:bg-white/90 font-sans font-semibold px-8">
              Nahrat zmluvu
              <Upload className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
