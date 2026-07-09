import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useParams } from "wouter";
import { FileText, ArrowLeft, Loader2, AlertTriangle, AlertCircle, CheckCircle, ExternalLink, CreditCard } from "lucide-react";
import { toast } from "sonner";

const RISK_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const RISK_LABELS = { high: "Vysoké", medium: "Stredné", low: "Nízke" };

export default function ContractDetail() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ id: string }>();
  const contractId = parseInt(params.id || "0");

  const { data, isLoading, refetch } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: isAuthenticated && contractId > 0, refetchInterval: 5000 }
  );

  const retryMutation = trpc.contracts.retryAnalysis.useMutation({
    onSuccess: () => refetch(),
  });

  const paymentStatus = trpc.payments.getStatus.useQuery(
    { contractId },
    { enabled: isAuthenticated && contractId > 0 }
  );

  const createCheckout = trpc.payments.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Presmerovávame na platbu...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error("Chyba pri vytváraní platby: " + error.message);
    },
  });

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

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-xl mb-2">Zmluva nenájdená</h2>
            <Link href="/dashboard"><Button variant="ghost" className="font-sans">Späť na prehľad</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const { contract, clauses, report } = data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* Back nav */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="font-sans mb-4">
              <ArrowLeft className="mr-1 h-4 w-4" /> Späť na prehľad
            </Button>
          </Link>

          {/* Contract Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-serif mb-1">{contract.fileName}</h1>
              <p className="text-sm text-muted-foreground font-sans">
                Nahrané {new Date(contract.createdAt).toLocaleDateString("sk-SK")} · Plán: {contract.plan === "basic" ? "Základná" : contract.plan === "standard" ? "Štandardná" : contract.plan === "premium" ? "Prémiová" : "Legal Audit"}
              </p>
            </div>
            {contract.status === "completed" && (
              <Link href={`/report/${contract.id}`}>
                <Button className="font-sans">Zobraziť report</Button>
              </Link>
            )}
          </div>

          {/* Payment Required */}
          {contract.status === "pending" && paymentStatus.data && !paymentStatus.data.paid && !paymentStatus.data?.isAudit && (
            <Card className="mb-8 border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-6 text-center">
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-sans text-lg font-semibold mb-1">Čaká na platbu</h3>
                <p className="text-sm text-muted-foreground font-sans mb-4">
                  Analýza sa spustí automaticky po úspešnej platbe.
                </p>
                <Button
                  className="font-sans"
                  onClick={() => createCheckout.mutate({ contractId: contract.id })}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Zaplatiť a spustiť analýzu
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status - analyzing or paid pending */}
          {(contract.status === "analyzing" || (contract.status === "pending" && paymentStatus.data?.paid)) && (
            <Card className="mb-8 border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <h3 className="font-sans text-lg font-semibold mb-1">
                  {contract.status === "pending" ? "Čaká na spracovanie" : "Prebieha AI analýza"}
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Analýza zmluvy zvyčajne trvá 1–3 minúty. Stránka sa automaticky aktualizuje.
                </p>
                {contract.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 font-sans"
                    onClick={() => retryMutation.mutate({ contractId: contract.id })}
                    disabled={retryMutation.isPending}
                  >
                    {retryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Spustiť analýzu znova
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {contract.status === "in_review" && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <h3 className="font-sans text-lg font-semibold mb-1">Kontrola advokátom</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  AI analýza je dokončená. Advokát práve kontroluje nálezy a pripravuje finálny report.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Risk Summary */}
          {report && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-red-800">{(report.riskSummary as any)?.high || 0}</p>
                  <p className="text-xs text-red-600 font-sans">Vysoké riziko</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-amber-800">{(report.riskSummary as any)?.medium || 0}</p>
                  <p className="text-xs text-amber-600 font-sans">Stredné riziko</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-green-800">{(report.riskSummary as any)?.low || 0}</p>
                  <p className="text-xs text-green-600 font-sans">Nízke riziko</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clauses */}
          {clauses && clauses.length > 0 && (
            <div>
              <h2 className="text-xl font-serif mb-4">Analýza klauzúl ({clauses.length})</h2>
              <div className="space-y-3">
                {clauses.map((clause) => {
                  const effectiveRisk = clause.overriddenRiskLevel || clause.riskLevel;
                  return (
                    <Card key={clause.id} className="overflow-hidden">
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
                          <p className="text-sm text-muted-foreground font-sans mb-2 italic line-clamp-2">"{clause.excerpt}"</p>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
