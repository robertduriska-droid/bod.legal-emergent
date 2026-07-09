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

const RISK_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const RISK_LABELS: Record<string, string> = { high: "Vysoke", medium: "Stredne", low: "Nizke" };

export default function FreeSken() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
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
            <p className="text-sm text-muted-foreground font-sans">Pripravujeme preview vasej analyzy...</p>
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
            <h2 className="font-serif text-xl mb-2">Zmluva nenajdena</h2>
            <Link href="/upload"><Button variant="ghost" className="font-sans">Nahrat novu zmluvu</Button></Link>
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
            <h2 className="font-serif text-xl mb-2">Analyzujeme vasu zmluvu</h2>
            <p className="text-sm text-muted-foreground font-sans">
              AI prave kontroluje kazdu klauzulu. Zvycajne to trva 1-3 minuty.
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
              <Badge variant="outline" className="font-sans text-xs">Bezplatny nahled</Badge>
            </div>
            <h1 className="text-3xl font-serif mb-2">Vysledky analyzy</h1>
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
                  <p className="text-xs text-red-600 font-sans">Vysoke riziko</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-amber-800">{riskSummary.medium}</p>
                  <p className="text-xs text-amber-600 font-sans">Stredne riziko</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-green-800">{riskSummary.low}</p>
                  <p className="text-xs text-green-600 font-sans">Nizke riziko</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top 3 Risks Preview */}
          {previewClauses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-serif mb-4">Top 3 rizika vo vasej zmluve</h2>
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
                            {RISK_LABELS[effectiveRisk]}
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
                  + {hiddenCount} dalsich nalezov
                </p>
                <p className="text-sm text-muted-foreground font-sans">
                  Plny report obsahuje vsetky nalezy, pravne zaklady, navrhove upravy a odporucania.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bridge CTA - Upgrade to Full Report */}
          <div className="bg-foreground text-background rounded-2xl p-8 mb-8">
            <div className="text-center mb-6">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-80" />
              <h2 className="text-2xl font-serif mb-2">Chcete plny report?</h2>
              <p className="text-sm opacity-80 font-sans max-w-md mx-auto">
                Ziskajte kompletnu analyzu s pravnymi zakladmi, navrhmi uprav
                {contract.plan !== "basic" ? ", overenim advokatom" : ""}
                {contract.plan === "premium" ? " a redline dokumentom" : ""}.
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
                    <p className="font-sans text-xs opacity-70 mb-1">{plan.nameSk}</p>
                    <p className="text-xl font-serif">{plan.priceLabel}</p>
                    <p className="text-xs opacity-60 font-sans">{plan.delivery}</p>
                    {plan.id === contract.plan && (
                      <Badge className="mt-2 bg-background/20 text-background text-xs font-sans">Vas plan</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link href={`/contract/${contract.id}`}>
                <Button size="lg" variant="secondary" className="font-sans">
                  Pokracovat k platbe <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs opacity-60 font-sans mt-3">
                Garancia: Ak report nedodame v slubenej lehote, neplatite nic.
              </p>
            </div>
          </div>

          {/* What's included in full report */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-serif text-lg mb-4">Co obsahuje plny report?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-sans">Analyza kazdej klauzuly s rizikovou klasifikaciou</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-sans">Odkazy na Slov-Lex a EUR-Lex</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-sans">Konkretne navrhy uprav problematickych klauzul</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-sans">PDF report na stiahnutie</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-sans">Overenie advokatom (Standard a Premium)</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-sans">Redline dokument (Premium)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Already paid? Go to full report */}
          {contract.status === "completed" && (
            <div className="text-center">
              <Link href={`/report/${contract.id}`}>
                <Button className="font-sans">
                  Zobrazit plny report <ArrowRight className="ml-2 h-4 w-4" />
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
