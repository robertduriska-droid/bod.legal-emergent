import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams } from "wouter";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle, Lock, ArrowRight, Shield, Mail } from "lucide-react";
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
  hu: {
    riskLabels: { high: "Magas", medium: "Közepes", low: "Alacsony" } as Record<string, string>,
    preparing: "Elemzése előnézetének előkészítése...",
    notFound: "A szerződés nem található",
    uploadNew: "Új szerződés feltöltése",
    analyzing: "Szerződését elemezzük",
    analyzingDesc: "Az AI éppen minden klauzulát ellenőriz. Ez általában 1-3 percet vesz igénybe.",
    freePreview: "Ingyenes előnézet",
    resultsTitle: "Elemzés eredményei",
    highRisk: "Magas kockázat",
    mediumRisk: "Közepes kockázat",
    lowRisk: "Alacsony kockázat",
    top3: "A 3 legnagyobb kockázat a szerződésében",
    moreFindings: (n: number) => `+ ${n} további megállapítás`,
    fullReportContains: "A teljes jelentés minden megállapítást, jogalapot, módosítási javaslatot és ajánlást tartalmaz.",
    wantFull: "Szeretné a teljes jelentést?",
    wantFullDesc: (lawyer: boolean, redline: boolean) => `Kérje a teljes elemzést jogalapokkal, módosítási javaslatokkal${lawyer ? ", ügyvédi ellenőrzéssel" : ""}${redline ? " és redline dokumentummal" : ""}.`,
    yourPlan: "Az Ön csomagja",
    continuePayment: "Tovább a fizetéshez",
    guarantee: "Garancia: Ha a jelentést nem szállítjuk a vállalt határidőn belül, nem kell fizetnie.",
    whatsIncluded: "Mit tartalmaz a teljes jelentés?",
    included: [
      "Minden klauzula elemzése kockázati besorolással",
      "Hivatkozások az njt.hu-ra és az EUR-Lexre",
      "Konkrét módosítási javaslatok a problémás klauzulákhoz",
      "Letölthető PDF-jelentés",
      "Ügyvédi ellenőrzés (Standard és Prémium)",
      "Redline dokumentum (Prémium)",
    ],
    viewFull: "Teljes jelentés megtekintése",
  },
};

export default function FreeSken() {
  // Anonymous free-scan visitors are welcome here: access is enforced
  // server-side (owner session or claim-token cookie), so no login redirect.
  const { isAuthenticated } = useAuth();
  const { t, locale, localePath } = useT();
  const planNames = [t.pricing.basicTitle, t.pricing.standardTitle, t.pricing.premiumTitle];
  const planPrices = [t.pricing.basicPrice, t.pricing.standardPrice, t.pricing.premiumPrice];
  const planTimes = [t.pricing.basicTime, t.pricing.standardTime, t.pricing.premiumTime];
  const tx = TX[locale];
  const params = useParams<{ id: string }>();
  const contractId = parseInt(params.id || "0");

  const [leadEmail, setLeadEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  const attachEmailMutation = trpc.contracts.attachEmail.useMutation({
    onSuccess: () => {
      setEmailSaved(true);
      toast.success(t.wp1.freeScanEmailSaved);
    },
    onError: () => {
      toast.error(t.wp1.freeScanEmailInvalid);
    },
  });

  const handleAttachEmail = () => {
    const email = leadEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t.wp1.freeScanEmailInvalid);
      return;
    }
    attachEmailMutation.mutate({ contractId, email });
  };

  const { data, isLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: contractId > 0, refetchInterval: 5000 }
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
              {PRICING_PLANS.map((plan, index) => (
                <Card
                  key={plan.id}
                  className={`bg-background/10 border-background/20 text-background ${
                    plan.id === contract.plan ? "ring-2 ring-background/60" : ""
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <p className="font-sans text-xs opacity-70 mb-1">{planNames[index]}</p>
                    <p className="text-xl font-serif">{planPrices[index]}</p>
                    <p className="text-xs opacity-60 font-sans">{planTimes[index]}</p>
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

            {/* Anonymous lead capture: attach an e-mail to the free scan */}
            {!isAuthenticated && (
              <div className="mt-6 border-t border-background/15 pt-6" data-testid="freescan-email-block">
                <div className="max-w-md mx-auto text-center">
                  <p className="font-sans font-semibold mb-1 flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" aria-hidden="true" /> {t.wp1.freeScanEmailTitle}
                  </p>
                  <p className="text-xs opacity-70 font-sans mb-3">{t.wp1.freeScanEmailDesc}</p>
                  {emailSaved ? (
                    <p className="text-sm font-sans flex items-center justify-center gap-2" data-testid="freescan-email-saved">
                      <CheckCircle className="h-4 w-4" aria-hidden="true" /> {t.wp1.freeScanEmailSaved}
                    </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAttachEmail(); }}
                        placeholder="vas@email.sk"
                        className="rounded-md border border-background/30 bg-background/10 px-3 py-2 text-sm font-sans text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-background/40 w-full sm:w-64"
                        data-testid="freescan-email-input"
                      />
                      <Button
                        variant="secondary"
                        className="font-sans"
                        disabled={attachEmailMutation.isPending || !leadEmail.trim()}
                        onClick={handleAttachEmail}
                        data-testid="freescan-email-submit"
                      >
                        {attachEmailMutation.isPending
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : t.wp1.freeScanEmailButton}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
