import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle, AlertCircle, CheckCircle, ExternalLink, Shield, FileText } from "lucide-react";
import { useT } from "@/i18n";

const SAMPLE_CLAUSES = [
  {
    id: 1,
    number: "4.2",
    title: "Obmedzenie zodpovednosti dodávateľa",
    risk: "high" as const,
    excerpt: "Dodávateľ nezodpovedá za žiadne nepriame, následné ani špeciálne škody, vrátane ušlého zisku, bez ohľadu na to, či bol na možnosť takýchto škôd upozornený.",
    finding: "Klauzula úplne vylučuje zodpovednosť za nepriame škody vrátane ušlého zisku. Podľa § 379 Obchodného zákonníka má poškodená strana právo na náhradu ušlého zisku. Takéto úplné vylúčenie je v rozpore s kogentnou úpravou a môže byť neplatné.",
    legalBasis: "§ 379 Obchodného zákonníka (513/1991 Zb.)",
    legalSourceUrl: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/1991/513/",
    suggestedEdit: "Nahradiť úplné vylúčenie zodpovednosti limitáciou: \"Celková zodpovednosť dodávateľa za nepriame škody neprekročí sumu rovnajúcu sa 12-mesačnému plneniu podľa tejto zmluvy.\"",
  },
  {
    id: 2,
    number: "7.1",
    title: "Automatické predĺženie zmluvy",
    risk: "medium" as const,
    excerpt: "Zmluva sa automaticky predlžuje o ďalšie obdobie 24 mesiacov, pokiaľ jedna zo strán nedoručí písomné oznámenie o nepredĺžení najneskôr 90 dní pred uplynutím aktuálneho obdobia.",
    finding: "Výpovedná lehota 90 dní pri automatickom predĺžení na 24 mesiacov je neprimerane dlhá. Štandardná trhová prax je 30-60 dní. Hrozí riziko neúmyselného viazania na ďalšie 2 roky.",
    legalBasis: "§ 273 Obchodného zákonníka",
    legalSourceUrl: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/1991/513/",
    suggestedEdit: "Skrátiť výpovednú lehotu na 30 dní a predĺženie na 12 mesiacov: \"...najneskôr 30 dní pred uplynutím...predlžuje o ďalších 12 mesiacov.\"",
  },
  {
    id: 3,
    number: "9.3",
    title: "Voľba rozhodného práva a jurisdikcie",
    risk: "medium" as const,
    excerpt: "Táto zmluva sa riadi právom štátu Delaware, USA. Všetky spory budú riešené výlučne súdmi v Wilmington, Delaware.",
    finding: "Pre slovenského objednávateľa je jurisdikcia v Delaware nevýhodná - vysoké náklady na vedenie sporu v zahraničí, neznáme procesné pravidlá. Podľa nariadenia Brusel I bis (1215/2012) je možné dohodnúť jurisdikciu, ale slovenská strana by mala vyjednať aspoň arbitráž v Európe.",
    legalBasis: "Nariadenie (EÚ) č. 1215/2012 (Brusel I bis)",
    legalSourceUrl: "https://eur-lex.europa.eu/legal-content/SK/TXT/?uri=CELEX:32012R1215",
    suggestedEdit: "Navrhnúť alternatívu: \"Zmluva sa riadi slovenským právom. Spory budú riešené rozhodcovským konaním pri Rozhodcovskom súde Slovenskej obchodnej a priemyselnej komory v Bratislave.\"",
  },
  {
    id: 4,
    number: "3.5",
    title: "Platobné podmienky",
    risk: "low" as const,
    excerpt: "Objednávateľ uhradí faktúru do 30 dní od jej doručenia. V prípade omeškania sa účtuje úrok z omeškania vo výške 0,05% denne.",
    finding: "Platobné podmienky sú štandardné a v súlade s § 340 Obchodného zákonníka. Úrok z omeškania 0,05% denne (18,25% ročne) je v rámci bežného rozpätia. Splatnosť 30 dní je trhový štandard.",
    legalBasis: "§ 340 a § 369 Obchodného zákonníka",
    legalSourceUrl: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/1991/513/",
    suggestedEdit: null,
  },
  {
    id: 5,
    number: "11.2",
    title: "Vlastníctvo duševného vlastníctva",
    risk: "high" as const,
    excerpt: "Všetky výstupy, diela a materiály vytvorené dodávateľom v rámci plnenia tejto zmluvy zostávajú výlučným vlastníctvom dodávateľa. Objednávateľ získava nevýhradnú licenciu na ich používanie.",
    finding: "Ak objednávateľ platí za vytvorenie diela, štandardne by mal získať výhradnú licenciu alebo vlastnícke práva k výstupom. Nevýhradná licencia znamená, že dodávateľ môže rovnaké výstupy poskytnúť konkurencii. Toto je závažné riziko pri custom vývoji.",
    legalBasis: "§ 91 Autorského zákona (185/2015 Z. z.)",
    legalSourceUrl: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2015/185/",
    suggestedEdit: "Zmeniť na: \"Všetky výstupy vytvorené dodávateľom v rámci plnenia tejto zmluvy prechádzajú do výlučného vlastníctva objednávateľa momentom úhrady príslušnej faktúry. Dodávateľ si ponecháva práva len k svojim predexistujúcim nástrojom a knižniciam.\"",
  },
];

const RISK_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const RISK_ICONS = { high: AlertCircle, medium: AlertTriangle, low: CheckCircle };

const TX = {
  sk: {
    riskLabels: { high: "Vysoké", medium: "Stredné", low: "Nízke" } as Record<string, string>,
    bannerTitle: "Toto je vzorový report",
    bannerDesc: "Ukážka toho, čo dostanete po nahratí zmluvy. Údaje sú ilustratívne.",
    title: "Analýza zmluvy: Rámcová zmluva o poskytovaní IT služieb",
    date: "Dátum: 9. júla 2025",
    plan: "Plán: Štandardná kontrola",
    pages: "Strán: 12",
    highRisk: "Vysoké riziko",
    mediumRisk: "Stredné riziko",
    lowRisk: "Nízke riziko",
    summary: "Zhrnutie",
    clauseAnalysis: (n: number) => `Analýza klauzúl (${n})`,
    legalBasis: "Právny základ:",
    suggestedEdit: "Navrhovaná úprava:",
    ctaTitle: "Chcete takýto report pre vašu zmluvu?",
    ctaDesc: "Nahrajte zmluvu a do 24 hodín dostanete kompletný report s odkazmi na právne predpisy.",
    ctaUpload: "Nahrať zmluvu",
    ctaPricing: "Pozrieť cenník",
  },
  en: {
    riskLabels: { high: "High", medium: "Medium", low: "Low" } as Record<string, string>,
    bannerTitle: "This is a sample report",
    bannerDesc: "An example of what you receive after uploading a contract. The data is illustrative (findings shown in Slovak).",
    title: "Contract analysis: Framework agreement for IT services",
    date: "Date: July 9, 2025",
    plan: "Plan: Standard review",
    pages: "Pages: 12",
    highRisk: "High risk",
    mediumRisk: "Medium risk",
    lowRisk: "Low risk",
    summary: "Summary",
    clauseAnalysis: (n: number) => `Clause analysis (${n})`,
    legalBasis: "Legal basis:",
    suggestedEdit: "Suggested amendment:",
    ctaTitle: "Want a report like this for your contract?",
    ctaDesc: "Upload your contract and receive a complete report with legal references within 24 hours.",
    ctaUpload: "Upload contract",
    ctaPricing: "View pricing",
  },
};

export default function SampleReport() {
  const { locale, localePath } = useT();
  const tx = TX[locale];
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-sans text-sm font-medium">{tx.bannerTitle}</p>
              <p className="font-sans text-xs text-muted-foreground">{tx.bannerDesc}</p>
            </div>
          </div>

          {/* Report Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif mb-2">{tx.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-sans">
              <span>{tx.date}</span>
              <span>{tx.plan}</span>
              <span>{tx.pages}</span>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-serif text-red-800">2</p>
                <p className="text-xs text-red-600 font-sans">{tx.highRisk}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-serif text-amber-800">2</p>
                <p className="text-xs text-amber-600 font-sans">{tx.mediumRisk}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-serif text-green-800">1</p>
                <p className="text-xs text-green-600 font-sans">{tx.lowRisk}</p>
              </CardContent>
            </Card>
          </div>

          {/* Executive Summary */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="font-serif text-xl mb-3">{tx.summary}</h2>
              <p className="font-sans text-muted-foreground leading-relaxed">
                Zmluva obsahuje 2 klauzuly s vysokým rizikom, ktoré vyžadujú okamžitú pozornosť pred podpisom. 
                Najzávažnejšie je úplné vylúčenie zodpovednosti dodávateľa za nepriame škody (klauzula 4.2) a 
                nevýhodná úprava vlastníctva duševného vlastníctva (klauzula 11.2). Odporúčame vyjednať limitáciu 
                zodpovednosti namiesto úplného vylúčenia a zabezpečiť prevod IP práv na objednávateľa. 
                Jurisdikcia v Delaware je pre slovenského objednávateľa nevýhodná a mala by byť nahradená 
                arbitrážou v SR alebo EÚ.
              </p>
            </CardContent>
          </Card>

          {/* Clauses */}
          <h2 className="text-xl font-serif mb-4">{tx.clauseAnalysis(SAMPLE_CLAUSES.length)}</h2>
          <div className="space-y-4 mb-12">
            {SAMPLE_CLAUSES.map((clause) => {
              const Icon = RISK_ICONS[clause.risk];
              return (
                <Card key={clause.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${clause.risk === "high" ? "text-red-600" : clause.risk === "medium" ? "text-amber-600" : "text-green-600"}`} />
                        <span className="text-xs text-muted-foreground font-sans">§ {clause.number}</span>
                        <h4 className="font-sans font-medium">{clause.title}</h4>
                      </div>
                      <Badge className={`${RISK_COLORS[clause.risk]} text-xs font-sans shrink-0`}>
                        {tx.riskLabels[clause.risk]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-sans mb-3 italic border-l-2 border-muted pl-3">
                      "{clause.excerpt}"
                    </p>
                    <p className="text-sm font-sans mb-3">{clause.finding}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-sans text-muted-foreground">{tx.legalBasis}</span>
                      <a href={clause.legalSourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-primary hover:underline inline-flex items-center gap-1">
                        {clause.legalBasis} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {clause.suggestedEdit && (
                      <div className="bg-primary/5 rounded p-3 mt-3">
                        <p className="text-xs font-sans font-medium text-primary mb-1">{tx.suggestedEdit}</p>
                        <p className="text-sm font-sans">{clause.suggestedEdit}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          <Card className="bg-foreground text-background">
            <CardContent className="p-8 text-center">
              <h3 className="font-serif text-2xl mb-2">{tx.ctaTitle}</h3>
              <p className="font-sans text-background/70 mb-6">{tx.ctaDesc}</p>
              <div className="flex justify-center gap-4">
                <Link href={localePath("/upload")}>
                  <Button variant="secondary" size="lg" className="font-sans">{tx.ctaUpload}</Button>
                </Link>
                <a href={localePath("/") + "#pricing"}>
                  <Button variant="outline" size="lg" className="font-sans border-background/30 text-background hover:bg-background/10">{tx.ctaPricing}</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
