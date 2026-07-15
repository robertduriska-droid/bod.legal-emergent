import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContractAssistant from "@/components/ContractAssistant";
import ContractAttachments from "@/components/ContractAttachments";
import { Link, useParams, useSearch } from "wouter";
import { FileText, ArrowLeft, Loader2, AlertTriangle, AlertCircle, CheckCircle, ExternalLink, CreditCard, Upload, Scale, FileCheck, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
    awaitingProcessing: "Spúšťame analýzu",
    aiAnalyzing: "AI analyzuje vašu zmluvu",
    analyzingDesc: "Kontrolujeme každú klauzulu a porovnávame s právnymi predpismi. Zvyčajne to trvá 1–3 minúty. Stránka sa aktualizuje automaticky.",
    retryAnalysis: "Spustiť analýzu znova",
    lawyerReview: "Advokát overuje report",
    lawyerReviewDesc: "AI analýza je hotová. Advokát teraz kontroluje nálezy, dopĺňa poznámky a pripravuje finálny report. Dostanete e-mail, keď bude hotový.",
    highRisk: "Vysoké riziko",
    mediumRisk: "Stredné riziko",
    lowRisk: "Nízke riziko",
    clauseAnalysis: "Analýza klauzúl",
    legalBasis: "Právny základ:",
    suggestedEdit: "Navrhovaná úprava:",
    lawyerNote: "Poznámka advokáta:",
    dateLocale: "sk-SK",
    countdownLabel: "Gar. dodanie do:",
    countdownExpired: "Report bude dodaný čo najskôr",
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
    awaitingProcessing: "Starting analysis",
    aiAnalyzing: "AI is analyzing your contract",
    analyzingDesc: "We're checking every clause against applicable legal provisions. This usually takes 1–3 minutes. The page refreshes automatically.",
    retryAnalysis: "Restart analysis",
    lawyerReview: "Lawyer is verifying the report",
    lawyerReviewDesc: "AI analysis is complete. A lawyer is now reviewing the findings, adding notes, and preparing the final report. You'll receive an email when it's ready.",
    highRisk: "High risk",
    mediumRisk: "Medium risk",
    lowRisk: "Low risk",
    clauseAnalysis: "Clause analysis",
    legalBasis: "Legal basis:",
    suggestedEdit: "Suggested amendment:",
    lawyerNote: "Lawyer's note:",
    dateLocale: "en-GB",
    countdownLabel: "Guaranteed by:",
    countdownExpired: "Report will be delivered ASAP",
  },
  cz: {
    riskLabels: { high: "Vysoké", medium: "Střední", low: "Nízké" } as Record<string, string>,
    redirecting: "Přesměrováváme na platbu...",
    paymentError: "Chyba při vytváření platby: ",
    notFound: "Smlouva nenalezena",
    backToDashboard: "Zpět na přehled",
    uploaded: "Nahráno",
    plan: "Plán",
    planNames: { basic: "Základní", standard: "Standardní", premium: "Prémiová" } as Record<string, string>,
    viewReport: "Zobrazit report",
    awaitingPayment: "Čeká na platbu",
    awaitingPaymentDesc: "Analýza se spustí automaticky po úspěšné platbě.",
    payAndStart: "Zaplatit a spustit analýzu",
    awaitingProcessing: "Spouštíme analýzu",
    aiAnalyzing: "AI analyzuje vaši smlouvu",
    analyzingDesc: "Kontrolujeme každou klauzuli a porovnáváme s právními předpisy. Obvykle to trvá 1–3 minuty. Stránka se aktualizuje automaticky.",
    retryAnalysis: "Spustit analýzu znovu",
    lawyerReview: "Advokát ověřuje report",
    lawyerReviewDesc: "AI analýza je hotová. Advokát nyní kontroluje nálezy, doplňuje poznámky a připravuje finální report. Dostanete e-mail, až bude hotový.",
    highRisk: "Vysoké riziko",
    mediumRisk: "Střední riziko",
    lowRisk: "Nízké riziko",
    clauseAnalysis: "Analýza klauzulí",
    legalBasis: "Právní základ:",
    suggestedEdit: "Navrhovaná úprava:",
    lawyerNote: "Poznámka advokáta:",
    dateLocale: "cs-CZ",
    countdownLabel: "Gar. dodání do:",
    countdownExpired: "Report bude dodán co nejdříve",
  },
};

function DeliveryCountdown({ createdAt, expressAddon, tx }: { createdAt: string | Date; expressAddon: number; tx: typeof TX.sk }) {
  const deadline = useMemo(() => {
    const start = new Date(createdAt).getTime();
    const hours = expressAddon ? 4 : 24;
    return start + hours * 60 * 60 * 1000;
  }, [createdAt, expressAddon]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = deadline - now;
  if (remaining <= 0) {
    return (
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground font-sans">
        <Clock className="h-4 w-4" />
        <span>{tx.countdownExpired}</span>
      </div>
    );
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Clock className="h-4 w-4 text-primary" />
      <span className="text-sm font-sans text-muted-foreground">{tx.countdownLabel}</span>
      <div className="flex gap-1">
        {[{ val: hours, label: 'h' }, { val: minutes, label: 'm' }, { val: seconds, label: 's' }].map((unit, i) => (
          <span key={i} className="inline-flex items-center gap-0.5">
            <span className="bg-primary/10 text-primary font-mono font-semibold text-sm px-1.5 py-0.5 rounded">
              {String(unit.val).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground">{unit.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ContractDetail() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const { locale, localePath } = useT();
  const tx = TX[locale];
  const params = useParams<{ id: string }>();
  const contractId = parseInt(params.id || "0");
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const paymentResult = searchParams.get('payment');

  // Show toast on payment result (once via useEffect)
  useEffect(() => {
    if (paymentResult === 'success') {
      toast.success(locale === 'sk' ? 'Platba úspešná! Analýza sa začína.' : 'Payment successful! Analysis starting.');
    } else if (paymentResult === 'cancelled') {
      toast.error(locale === 'sk' ? 'Platba bola zrušená.' : 'Payment was cancelled.');
    }
  }, [paymentResult, locale]);

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
              <CardContent className="p-6">
                <div className="text-center mb-5">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <h3 className="font-sans text-lg font-semibold mb-1">
                    {contract.status === "pending" ? tx.awaitingProcessing : tx.aiAnalyzing}
                  </h3>
                  <p className="text-sm text-muted-foreground font-sans">
                    {tx.analyzingDesc}
                  </p>
                </div>
                {/* Delivery Countdown */}
                <DeliveryCountdown createdAt={contract.createdAt} expressAddon={contract.expressAddon} tx={tx} />
                {/* Progress steps */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {[
                    { icon: Upload, done: true },
                    { icon: CreditCard, done: true },
                    { icon: Loader2, done: false, current: true },
                    { icon: Scale, done: false },
                    { icon: FileCheck, done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        step.done ? 'bg-primary text-primary-foreground' : step.current ? 'bg-primary/20 text-primary ring-2 ring-primary/40' : 'bg-muted text-muted-foreground'
                      }`}>
                        <step.icon className={`h-3.5 w-3.5 ${step.current ? 'animate-spin' : ''}`} />
                      </div>
                      {i < 4 && <div className={`w-6 h-0.5 mx-1 rounded-full ${step.done ? 'bg-primary' : 'bg-muted'}`} />}
                    </div>
                  ))}
                </div>
                {contract.status === "pending" && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-sans"
                      onClick={() => retryMutation.mutate({ contractId: contract.id })}
                      disabled={retryMutation.isPending}
                    >
                      {retryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {tx.retryAnalysis}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {contract.status === "in_review" && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <Scale className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-sans text-lg font-semibold mb-1">{tx.lawyerReview}</h3>
                  <p className="text-sm text-muted-foreground font-sans">
                    {tx.lawyerReviewDesc}
                  </p>
                </div>
                {/* Progress steps */}
                <div className="flex items-center justify-center gap-2 mt-5">
                  {[
                    { icon: Upload, done: true },
                    { icon: CreditCard, done: true },
                    { icon: Loader2, done: true },
                    { icon: Scale, done: false, current: true },
                    { icon: FileCheck, done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        step.done ? 'bg-primary text-primary-foreground' : step.current ? 'bg-amber-200 text-amber-700 ring-2 ring-amber-300' : 'bg-muted text-muted-foreground'
                      }`}>
                        <step.icon className={`h-3.5 w-3.5`} />
                      </div>
                      {i < 4 && <div className={`w-6 h-0.5 mx-1 rounded-full ${step.done ? 'bg-primary' : 'bg-muted'}`} />}
                    </div>
                  ))}
                </div>
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

          {(contract.status === "in_review" || contract.status === "completed") && (
            <div className="mt-8">
              <ContractAssistant contractId={contract.id} language={contract.language} />
              <ContractAttachments contractId={contract.id} language={contract.language} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
