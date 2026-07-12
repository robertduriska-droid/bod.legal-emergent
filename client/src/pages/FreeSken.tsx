import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams } from "wouter";
import { Link } from "wouter";
import { Loader2, AlertTriangle, AlertCircle, CheckCircle, Lock, ArrowRight, Shield } from "lucide-react";
import { PRICING_PLANS } from "@shared/types";
import { useT } from "@/i18n";

const RISK_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const TX = {
  sk: {
    riskLabels: { high: "Vysoké", medium: "Stredné", low: "Nízke" } as Record<string, string>,
    preparing: "Pripravujeme náhľad vašej analýzy...",
    notFound: "Zmluva nenájdená",
    uploadNew: "Nahrať novú zmluvu",
    analyzing: "Analyzujeme vašu zmluvu",
    analyzingDesc: "AI práve kontroluje každú klauzulu. Zvyčajne to trvá 1-3 minúty.",
    freePreview: "Bezplatný náhľad",
    resultsTitle: "Výsledky analýzy",
    highRisk: "Vysoké riziko",
    mediumRisk: "Stredné riziko",
    lowRisk: "Nízke riziko",
    top3: "Top 3 riziká vo vašej zmluve",
    moreFindings: (n: number) => `+ ${n} ďalších nálezov`,
    fullReportContains: "Plný report obsahuje všetky nálezy, právne základy, návrhové úpravy a odporúčania.",
    wantFull: "Chcete plný report?",
    wantFullDesc: (lawyer: boolean, redline: boolean) => `Získajte kompletnú analýzu s právnymi základmi, návrhmi úprav${lawyer ? ", overením advokátom" : ""}${redline ? " a redline dokumentom" : ""}.`,
    yourPlan: "Váš plán",
    continuePayment: "Pokračovať k platbe",
    guarantee: "Garancia: Ak report nedodáme v sľúbenej lehote, neplatíte nič.",
    whatsIncluded: "Čo obsahuje plný report?",
    included: [
      "Analýza každej klauzuly s rizikovou klasifikáciou",
      "Odkazy na Slov-Lex a EUR-Lex",
      "Konkrétne návrhy úprav problematických klauzúl",
      "PDF report na stiahnutie",
      "Overenie advokátom (Štandard a Premium)",
      "Redline dokument (Premium)",
    ],
    viewFull: "Zobraziť plný report",
  },
  en: {
    riskLabels: { high: "High", medium: "Medium", low: "Low" } as Record<string, string>,
    preparing: "Preparing your analysis preview...",
    notFound: "Contract not found",
    uploadNew: "Upload a new contract",
    analyzing: "Analyzing your contract",
    analyzingDesc: "AI is reviewing every clause. This usually takes 1-3 minutes.",
    freePreview: "Free preview",
    resultsTitle: "Analysis results",
    highRisk: "High risk",
    mediumRisk: "Medium risk",
    lowRisk: "Low risk",
    top3: "Top 3 risks in your contract",
    moreFindings: (n: number) => `+ ${n} more findings`,
    fullReportContains: "The full report includes all findings, legal grounds, suggested amendments, and recommendations.",
    wantFull: "Want the full report?",
    wantFullDesc: (lawyer: boolean, redline: boolean) => `Get the complete analysis with legal grounds, suggested amendments${lawyer ? ", lawyer verification" : ""}${redline ? " and a redline document" : ""}.`,
    yourPlan: "Your plan",
    continuePayment: "Continue to payment",
    guarantee: "Guarantee: If we don't deliver the report on time, you pay nothing.",
    whatsIncluded: "What does the full report include?",
    included: [
      "Analysis of every clause with risk classification",
      "References to Slov-Lex and EUR-Lex",
      "Specific amendment suggestions for problematic clauses",
      "Downloadable PDF report",
      "Lawyer verification (Standard and Premium)",
      "Redline document (Premium)",
    ],
    viewFull: "View full report",
  },
  cz: {
    riskLabels: { high: "Vysoké", medium: "Střední", low: "Nízké" } as Record<string, string>,
    preparing: "Připravujeme náhled vaší analýzy...",
    notFound: "Smlouva nenalezena",
    uploadNew: "Nahrát novou smlouvu",
    analyzing: "Analyzujeme vaši smlouvu",
    analyzingDesc: "AI právě kontroluje každou klauzuli. Obvykle to trvá 1-3 minuty.",
    freePreview: "Bezplatný náhled",
    resultsTitle: "Výsledky analýzy",
    highRisk: "Vysoké riziko",
    mediumRisk: "Střední riziko",
    lowRisk: "Nízké riziko",
    top3: "Top 3 rizika ve vaší smlouvě",
    moreFindings: (n: number) => `+ ${n} dalších nálezů`,
    fullReportContains: "Plný report obsahuje všechny nálezy, právní základy, návrhy úprav a doporučení.",
    wantFull: "Chcete plný report?",
    wantFullDesc: (lawyer: boolean, redline: boolean) => `Získejte kompletní analýzu s právními základy, návrhy úprav${lawyer ? ", ověřením advokátem" : ""}${redline ? " a redline dokumentem" : ""}.`,
    yourPlan: "Váš plán",
    continuePayment: "Pokračovat k platbě",
    guarantee: "Garance: Pokud report nedodáme ve slíbené lhůtě, neplatíte nic.",
    whatsIncluded: "Co obsahuje plný report?",
    included: [
      "Analýza každé klauzule s rizikovou klasifikací",
      "Odkazy na zakonyprolidi.cz a EUR-Lex",
      "Konkrétní návrhy úprav problematických klauzulí",
      "PDF report ke stažení",
      "Ověření advokátem (Standard a Premium)",
      "Redline dokument (Premium)",
    ],
    viewFull: "Zobrazit plný report",
  },
};

export default function FreeSken() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const { locale, localePath } = useT();
  const tx = TX[locale];
  const params = useParams<{ id: string }>();
  const contractId = parseInt(params.id || "0");

  const { data, isLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: isAuthenticated && contractId > 0, refetchInterval: 5000 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-sans">{tx.preparing}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-xl mb-2">{tx.notFound}</h2>
            <Link href={localePath("/upload")}><Button variant="ghost" className="font-sans">{tx.uploadNew}</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const { contract, clauses, report } = data;

  // If analysis is still running, show loading
  if (contract.status === "analyzing" || (contract.status === "pending" && !report)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h2 className="font-serif text-xl mb-2">{tx.analyzing}</h2>
            <p className="text-sm text-muted-foreground font-sans">
              {tx.analyzingDesc}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Get risk summary
  const riskSummary = report?.riskSummary as { high: number; medium: number; low: number } | null;
  const totalRisks = riskSummary ? riskSummary.high + riskSummary.medium + riskSummary.low : 0;

  // Show only top 3 highest-risk clauses
  const sortedClauses = [...(clauses || [])].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    const aRisk = (a.overriddenRiskLevel || a.riskLevel) as keyof typeof riskOrder;
    const bRisk = (b.overriddenRiskLevel || b.riskLevel) as keyof typeof riskOrder;
    return (riskOrder[aRisk] ?? 2) - (riskOrder[bRisk] ?? 2);
  });
  const previewClauses = sortedClauses.slice(0, 3);
  const hiddenCount = Math.max(0, sortedClauses.length - 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-sans text-xs">{tx.freePreview}</Badge>
            </div>
            <h1 className="text-3xl font-serif mb-2">{tx.resultsTitle}</h1>
            <p className="text-muted-foreground font-sans">
              {contract.fileName}
            </p>
          </div>

          {/* Risk Summary Cards */}
          {riskSummary && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-red-800">{riskSummary.high}</p>
                  <p className="text-xs text-red-600 font-sans">{tx.highRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-amber-800">{riskSummary.medium}</p>
                  <p className="text-xs text-amber-600 font-sans">{tx.mediumRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-green-800">{riskSummary.low}</p>
                  <p className="text-xs text-green-600 font-sans">{tx.lowRisk}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top 3 Risks Preview */}
          {previewClauses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-serif mb-4">{tx.top3}</h2>
              <div className="space-y-3">
                {previewClauses.map((clause) => {
                  const effectiveRisk = clause.overriddenRiskLevel || clause.riskLevel;
                  return (
                    <Card key={clause.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-sans">#{clause.clauseNumber}</span>
                            <h4 className="font-sans font-medium">{clause.title}</h4>
                          </div>
                          <Badge className={`${RISK_COLORS[effectiveRisk]} text-xs font-sans`}>
                            {tx.riskLabels[effectiveRisk]}
                          </Badge>
                        </div>
                        {clause.excerpt && (
                          <p className="text-sm text-muted-foreground font-sans mb-2 italic">"{clause.excerpt}"</p>
                        )}
                        <p className="text-sm font-sans">{clause.finding}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Blurred/locked remaining clauses indicator */}
          {hiddenCount > 0 && (
            <Card className="mb-8 border-dashed border-2 bg-muted/30">
              <CardContent className="p-6 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-sans font-medium mb-1">
                  {tx.moreFindings(hiddenCount)}
                </p>
                <p className="text-sm text-muted-foreground font-sans">
                  {tx.fullReportContains}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bridge CTA - Upgrade to Full Report */}
          <div className="bg-foreground text-background rounded-2xl p-8 mb-8">
            <div className="text-center mb-6">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-80" />
              <h2 className="text-2xl font-serif mb-2">{tx.wantFull}</h2>
              <p className="text-sm opacity-80 font-sans max-w-md mx-auto">
                {tx.wantFullDesc(contract.plan !== "basic", contract.plan === "premium")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {PRICING_PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={`bg-background/10 border-background/20 text-background ${
                    plan.id === contract.plan ? "ring-2 ring-background/60" : ""
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <p className="font-sans text-xs opacity-70 mb-1">{locale === "en" ? plan.name : plan.nameSk}</p>
                    <p className="text-xl font-serif">{plan.priceLabel}</p>
                    <p className="text-xs opacity-60 font-sans">{plan.delivery}</p>
                    {plan.id === contract.plan && (
                      <Badge className="mt-2 bg-background/20 text-background text-xs font-sans">{tx.yourPlan}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link href={localePath(`/contract/${contract.id}`)}>
                <Button size="lg" variant="secondary" className="font-sans">
                  {tx.continuePayment} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs opacity-60 font-sans mt-3">
                {tx.guarantee}
              </p>
            </div>
          </div>

          {/* What's included in full report */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg mb-4">{tx.whatsIncluded}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tx.included.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-sans">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Already paid? Go to full report */}
          {contract.status === "completed" && (
            <div className="text-center">
              <Link href={localePath(`/report/${contract.id}`)}>
                <Button className="font-sans">
                  {tx.viewFull} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
