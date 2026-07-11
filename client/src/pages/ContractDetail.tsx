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
import { useT } from "@/i18n";

const RISK_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const TX = {
  sk: {
    riskLabels: { high: "Vysoké", medium: "Stredné", low: "Nízke" } as Record<string, string>,
    redirecting: "Presmerovávame na platbu...",
    paymentError: "Chyba pri vytváraní platby: ",
    notFound: "Zmluva nenájdená",
    backToDashboard: "Späť na prehľad",
    uploaded: "Nahrané",
    plan: "Plán",
    planNames: { basic: "Základná", standard: "Štandardná", premium: "Prémiová" } as Record<string, string>,
    viewReport: "Zobraziť report",
    awaitingPayment: "Čaká na platbu",
    awaitingPaymentDesc: "Analýza sa spustí automaticky po úspešnej platbe.",
    payAndStart: "Zaplatiť a spustiť analýzu",
    awaitingProcessing: "Čaká na spracovanie",
    aiAnalyzing: "Prebieha AI analýza",
    analyzingDesc: "Analýza zmluvy zvyčajne trvá 1-3 minúty. Stránka sa automaticky aktualizuje.",
    retryAnalysis: "Spustiť analýzu znova",
    lawyerReview: "Kontrola advokátom",
    lawyerReviewDesc: "AI analýza je dokončená. Advokát práve kontroluje nálezy a pripravuje finálny report.",
    highRisk: "Vysoké riziko",
    mediumRisk: "Stredné riziko",
    lowRisk: "Nízke riziko",
    clauseAnalysis: "Analýza klauzúl",
    legalBasis: "Právny základ:",
    suggestedEdit: "Navrhovaná úprava:",
    lawyerNote: "Poznámka advokáta:",
    dateLocale: "sk-SK",
  },
  en: {
    riskLabels: { high: "High", medium: "Medium", low: "Low" } as Record<string, string>,
    redirecting: "Redirecting to payment...",
    paymentError: "Error creating payment: ",
    notFound: "Contract not found",
    backToDashboard: "Back to dashboard",
    uploaded: "Uploaded",
    plan: "Plan",
    planNames: { basic: "Basic", standard: "Standard", premium: "Premium" } as Record<string, string>,
    viewReport: "View report",
    awaitingPayment: "Awaiting payment",
    awaitingPaymentDesc: "The analysis starts automatically after successful payment.",
    payAndStart: "Pay and start analysis",
    awaitingProcessing: "Awaiting processing",
    aiAnalyzing: "AI analysis in progress",
    analyzingDesc: "Contract analysis usually takes 1-3 minutes. This page refreshes automatically.",
    retryAnalysis: "Restart analysis",
    lawyerReview: "Lawyer review",
    lawyerReviewDesc: "AI analysis is complete. A lawyer is reviewing the findings and preparing the final report.",
    highRisk: "High risk",
    mediumRisk: "Medium risk",
    lowRisk: "Low risk",
    clauseAnalysis: "Clause analysis",
    legalBasis: "Legal basis:",
    suggestedEdit: "Suggested amendment:",
    lawyerNote: "Lawyer's note:",
    dateLocale: "en-GB",
  },
};

export default function ContractDetail() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const { locale, localePath } = useT();
  const tx = TX[locale];
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
        toast.success(tx.redirecting);
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(tx.paymentError + error.message);
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
            <h2 className="font-serif text-xl mb-2">{tx.notFound}</h2>
            <Link href={localePath("/dashboard")}><Button variant="ghost" className="font-sans">{tx.backToDashboard}</Button></Link>
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
          <Link href={localePath("/dashboard")}>
            <Button variant="ghost" size="sm" className="font-sans mb-4">
              <ArrowLeft className="mr-1 h-4 w-4" /> {tx.backToDashboard}
            </Button>
          </Link>

          {/* Contract Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-serif mb-1">{contract.fileName}</h1>
              <p className="text-sm text-muted-foreground font-sans">
                {tx.uploaded} {new Date(contract.createdAt).toLocaleDateString(tx.dateLocale)} · {tx.plan}: {tx.planNames[contract.plan] || contract.plan}
              </p>
            </div>
            {contract.status === "completed" && (
              <Link href={localePath(`/report/${contract.id}`)}>
                <Button className="font-sans">{tx.viewReport}</Button>
              </Link>
            )}
          </div>

          {/* Payment Required */}
          {contract.status === "pending" && paymentStatus.data && !paymentStatus.data.paid && (
            <Card className="mb-8 border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-6 text-center">
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-sans text-lg font-semibold mb-1">{tx.awaitingPayment}</h3>
                <p className="text-sm text-muted-foreground font-sans mb-4">
                  {tx.awaitingPaymentDesc}
                </p>
                <Button
                  className="font-sans"
                  onClick={() => createCheckout.mutate({ contractId: contract.id })}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  {tx.payAndStart}
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
                  {contract.status === "pending" ? tx.awaitingProcessing : tx.aiAnalyzing}
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {tx.analyzingDesc}
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
                    {tx.retryAnalysis}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {contract.status === "in_review" && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <h3 className="font-sans text-lg font-semibold mb-1">{tx.lawyerReview}</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {tx.lawyerReviewDesc}
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
                  <p className="text-xs text-red-600 font-sans">{tx.highRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-amber-800">{(report.riskSummary as any)?.medium || 0}</p>
                  <p className="text-xs text-amber-600 font-sans">{tx.mediumRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-green-800">{(report.riskSummary as any)?.low || 0}</p>
                  <p className="text-xs text-green-600 font-sans">{tx.lowRisk}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clauses */}
          {clauses && clauses.length > 0 && (
            <div>
              <h2 className="text-xl font-serif mb-4">{tx.clauseAnalysis} ({clauses.length})</h2>
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
                            {tx.riskLabels[effectiveRisk]}
                          </Badge>
                        </div>
                        {clause.excerpt && (
                          <p className="text-sm text-muted-foreground font-sans mb-2 italic line-clamp-2">"{clause.excerpt}"</p>
                        )}
                        <p className="text-sm font-sans mb-2">{clause.finding}</p>
                        {(clause as any).legalBasis && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-sans text-muted-foreground">{tx.legalBasis}</span>
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
                            <p className="text-xs font-sans font-medium text-primary mb-1">{tx.suggestedEdit}</p>
                            <p className="text-sm font-sans">{clause.suggestedEdit}</p>
                          </div>
                        )}
                        {clause.lawyerAnnotation && (
                          <div className="bg-amber-50 rounded p-3 mt-2 border border-amber-200">
                            <p className="text-xs font-sans font-medium text-amber-800 mb-1">{tx.lawyerNote}</p>
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
