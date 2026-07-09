import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useParams } from "wouter";
import { ArrowLeft, Loader2, CheckCircle, Download, ExternalLink, Shield } from "lucide-react";
import { LEGAL_SOURCES } from "@shared/types";

const RISK_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};
const RISK_LABELS = { high: "Vysoké riziko", medium: "Stredné riziko", low: "Nízke riziko" };

export default function Report() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ id: string }>();
  const contractId = parseInt(params.id || "0");

  const { data, isLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: isAuthenticated && contractId > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!data || !data.report) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground font-sans mb-4">Report ešte nie je k dispozícii.</p>
            <Link href="/dashboard"><Button variant="ghost" className="font-sans">Späť na prehľad</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const { contract, clauses, report, isLimited } = data;
  const riskSummary = report.riskSummary as { high: number; medium: number; low: number } | null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="font-sans mb-4">
              <ArrowLeft className="mr-1 h-4 w-4" /> Späť na prehľad
            </Button>
          </Link>

          {/* Report Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-serif mb-2">Analýza zmluvy</h1>
                <p className="text-muted-foreground font-sans">{contract.fileName}</p>
              </div>
              {report.isSigned === 1 && (
                <Badge className="bg-green-100 text-green-800 border-green-200 font-sans">
                  <Shield className="mr-1 h-3 w-3" /> Overené advokátom
                </Badge>
              )}
            </div>
            {report.isSigned === 1 && report.lawyerName && (
              <p className="text-sm text-muted-foreground font-sans mt-2">
                Podpísané: {report.lawyerName} · {report.signedAt ? new Date(report.signedAt).toLocaleDateString("sk-SK") : ""}
              </p>
            )}
          </div>

          {/* Risk Summary Cards */}
          {riskSummary && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-red-800">{riskSummary.high}</p>
                  <p className="text-xs text-red-600 font-sans">Vysoké riziko</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-amber-800">{riskSummary.medium}</p>
                  <p className="text-xs text-amber-600 font-sans">Stredné riziko</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-green-800">{riskSummary.low}</p>
                  <p className="text-xs text-green-600 font-sans">Nízke riziko</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary - hidden for basic plan */}
          {!isLimited && report.summary && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-3">Zhrnutie</h2>
                <p className="font-sans text-sm leading-relaxed">{report.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommendation - hidden for basic plan */}
          {!isLimited && report.recommendation && (
            <Card className="mb-8 border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-3">Odporúčanie</h2>
                <p className="font-sans text-sm leading-relaxed">{report.recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Clause Findings */}
          {clauses && clauses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-serif mb-4">Detailné nálezy ({clauses.length} klauzúl)</h2>
              <div className="space-y-3">
                {clauses.map((clause) => {
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
                        <p className="text-sm font-sans mb-2">{clause.finding}</p>
                        {(clause as any).legalBasis && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-sans text-muted-foreground">Právny základ:</span>
                            {(clause as any).legalSourceUrl ? (
                              <a href={(clause as any).legalSourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-primary hover:underline inline-flex items-center gap-1">
                                {(clause as any).legalBasis} <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs font-sans">{(clause as any).legalBasis}</span>
                            )}
                          </div>
                        )}
                        {clause.suggestedEdit && (
                          <div className="bg-primary/5 rounded p-3 mt-2">
                            <p className="text-xs font-sans font-medium text-primary mb-1">Navrhovaná úprava:</p>
                            <p className="text-sm font-sans">{clause.suggestedEdit}</p>
                          </div>
                        )}
                        {clause.lawyerAnnotation && (
                          <div className="bg-amber-50 rounded p-3 mt-2 border border-amber-200">
                            <p className="text-xs font-sans font-medium text-amber-800 mb-1">Poznámka advokáta:</p>
                            <p className="text-sm font-sans">{clause.lawyerAnnotation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upgrade CTA for basic plan */}
          {isLimited && (
            <Card className="mb-8 border-primary/30 bg-primary/[0.03]">
              <CardContent className="p-6 text-center">
                <h3 className="font-serif text-lg mb-2">Toto je bezplatný náhľad</h3>
                <p className="text-sm text-muted-foreground font-sans mb-4">
                  Vidíte iba 3 najzávažnejšie riziká. Plný report obsahuje analýzu všetkých klauzúl,
                  právne základy, navrhované úpravy a overenie advokátom.
                </p>
                <Link href="/upload">
                  <Button className="font-sans">Objednať plný report od 249 eur</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Legal Sources */}
          {!isLimited && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-4">Použité právne zdroje</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LEGAL_SOURCES.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded border hover:border-primary/30 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-medium truncate">{source.name}</p>
                        <p className="text-xs text-muted-foreground font-sans">{source.instrument}</p>
                      </div>
                      <Badge variant="outline" className="text-xs font-sans shrink-0">{source.source}</Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download - only for paid plans */}
          {!isLimited && (
            <div className="text-center mb-8">
              <Button className="font-sans" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" /> Stiahnuť report (PDF)
              </Button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-center text-xs text-muted-foreground font-sans p-4 border rounded bg-muted/30">
            <p>Tento report bol vygenerovaný systémom bod.legal s využitím AI a overený advokátom.</p>
            <p className="mt-1">Prevádzkované KILIAN LEGAL s.r.o. · IČO: 53 957 008</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
