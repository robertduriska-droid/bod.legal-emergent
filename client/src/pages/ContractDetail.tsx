import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
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
    paymentSuccess: "Platba úspešná! Analýza sa začína.",
    paymentCancelled: "Platba bola zrušená.",
    checkoutFallback: "Ak sa platba neotvorila, kliknite sem.",
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
    analyzingDesc: "Kontrolujeme každú klauzulu a porovnávame s právnymi predpismi. Zvyčajne to trvá 1 až 3 minúty. Stránka sa aktualizuje automaticky.",
    retryAnalysis: "Spustiť analýzu znova",
    failedTitle: "Analýzu sa nepodarilo dokončiť.",
    failedDesc: "Skúsime to znova, alebo nám napíšte.",
    lawyerReview: "Advokát overuje report",
    lawyerReviewLine: "Advokát zapísaný v SAK overuje nálezy.",
    lawyerEta: "Overenie zvyčajne trvá do 24 hodín od platby, expresne do 4 hodín.",
    aiDone: "AI hotovo",
    lawyerVerifying: "Advokát overuje",
    stepUploaded: "Nahranie",
    stepPayment: "Platba",
    stepAnalysis: "AI analýza",
    stepReview: "Overenie advokátom",
    stepDone: "Hotovo",
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
    upgradeTitle: "Chcete overenie advokátskou kanceláriou alebo advokátom?",
    upgradeDesc: "Bezplatný sken ukazuje top 3 riziká. Advokát overí a podpíše kompletný report pri Štandardnej alebo Prémiovej kontrole.",
    upgradeStandard: "Štandardná kontrola, 249 eur",
    upgradeStandardDesc: "Kompletný report, overenie a podpis advokáta.",
    upgradePremium: "Prémiová kontrola, 490 eur",
    upgradePremiumDesc: "Navyše redline dokument s návrhmi úprav na priame prevzatie.",
    upgradeLogin: "Na dokončenie objednávky sa najprv prihláste.",
  },
  en: {
    riskLabels: { high: "High", medium: "Medium", low: "Low" } as Record<string, string>,
    redirecting: "Redirecting to payment...",
    paymentError: "Error creating payment: ",
    paymentSuccess: "Payment successful! Analysis starting.",
    paymentCancelled: "Payment was cancelled.",
    checkoutFallback: "If the payment page did not open, click here.",
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
    analyzingDesc: "We're checking every clause against applicable legal provisions. This usually takes 1 to 3 minutes. The page refreshes automatically.",
    retryAnalysis: "Restart analysis",
    failedTitle: "The analysis could not be completed.",
    failedDesc: "We will try again, or write to us.",
    lawyerReview: "Lawyer is verifying the report",
    lawyerReviewLine: "A lawyer registered with the Slovak Bar Association is verifying the findings.",
    lawyerEta: "Verification usually takes up to 24 hours from payment, express up to 4 hours.",
    aiDone: "AI done",
    lawyerVerifying: "Lawyer verifying",
    stepUploaded: "Upload",
    stepPayment: "Payment",
    stepAnalysis: "AI analysis",
    stepReview: "Lawyer review",
    stepDone: "Done",
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
    upgradeTitle: "Want a lawyer to verify it?",
    upgradeDesc: "The free scan shows the top 3 risks. With the Standard or Premium review a lawyer verifies and signs the complete report.",
    upgradeStandard: "Standard review, 249 eur",
    upgradeStandardDesc: "Complete report, verified and signed by a lawyer.",
    upgradePremium: "Premium review, 490 eur",
    upgradePremiumDesc: "Plus a redline document with ready-to-use amendments.",
    upgradeLogin: "Please sign in first to complete your order.",
  },
  cz: {
    riskLabels: { high: "Vysoké", medium: "Střední", low: "Nízké" } as Record<string, string>,
    redirecting: "Přesměrováváme na platbu...",
    paymentError: "Chyba při vytváření platby: ",
    paymentSuccess: "Platba úspěšná! Analýza začíná.",
    paymentCancelled: "Platba byla zrušena.",
    checkoutFallback: "Pokud se platba neotevřela, klikněte sem.",
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
    analyzingDesc: "Kontrolujeme každou klauzuli a porovnáváme s právními předpisy. Obvykle to trvá 1 až 3 minuty. Stránka se aktualizuje automaticky.",
    retryAnalysis: "Spustit analýzu znovu",
    failedTitle: "Analýzu se nepodařilo dokončit.",
    failedDesc: "Zkusíme to znovu, nebo nám napište.",
    lawyerReview: "Advokát ověřuje report",
    lawyerReviewLine: "Advokát zapsaný v SAK ověřuje nálezy.",
    lawyerEta: "Ověření obvykle trvá do 24 hodin od platby, expresně do 4 hodin.",
    aiDone: "AI hotovo",
    lawyerVerifying: "Advokát ověřuje",
    stepUploaded: "Nahrání",
    stepPayment: "Platba",
    stepAnalysis: "AI analýza",
    stepReview: "Ověření advokátem",
    stepDone: "Hotovo",
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
    upgradeTitle: "Chcete ověření advokátem?",
    upgradeDesc: "Bezplatný sken ukazuje top 3 rizika. Advokát ověří a podepíše kompletní report u kontroly Standard nebo Premium.",
    upgradeStandard: "Standardní kontrola, 249 eur",
    upgradeStandardDesc: "Kompletní report, ověření a podpis advokáta.",
    upgradePremium: "Prémiová kontrola, 490 eur",
    upgradePremiumDesc: "Navíc redline dokument s návrhy úprav k přímému převzetí.",
    upgradeLogin: "Pro dokončení objednávky se nejprve přihlaste.",
  },
  hu: {
    riskLabels: { high: "Magas", medium: "Közepes", low: "Alacsony" } as Record<string, string>,
    redirecting: "Átirányítás a fizetéshez...",
    paymentError: "Hiba a fizetés létrehozásakor: ",
    paymentSuccess: "Sikeres fizetés! Az elemzés indul.",
    paymentCancelled: "A fizetés megszakadt.",
    checkoutFallback: "Ha a fizetési oldal nem nyílt meg, kattintson ide.",
    notFound: "A szerződés nem található",
    backToDashboard: "Vissza az áttekintéshez",
    uploaded: "Feltöltve",
    plan: "Csomag",
    planNames: { basic: "Alap", standard: "Standard", premium: "Prémium" } as Record<string, string>,
    viewReport: "Report megtekintése",
    awaitingPayment: "Fizetésre vár",
    awaitingPaymentDesc: "Az elemzés a sikeres fizetés után automatikusan elindul.",
    payAndStart: "Fizetés és elemzés indítása",
    awaitingProcessing: "Elemzés indítása",
    aiAnalyzing: "Az AI elemzi a szerződését",
    analyzingDesc: "Minden pontot ellenőrzünk és összevetünk a jogszabályokkal. Ez általában 1 és 3 perc között tart. Az oldal automatikusan frissül.",
    retryAnalysis: "Elemzés újraindítása",
    failedTitle: "Az elemzést nem sikerült befejezni.",
    failedDesc: "Újra megpróbáljuk, vagy írjon nekünk.",
    lawyerReview: "Ügyvédi iroda vagy ügyvéd ellenőrzi a reportot",
    lawyerReviewLine: "A Szlovák Ügyvédi Kamaránál bejegyzett ügyvédi iroda vagy ügyvéd ellenőrzi a megállapításokat.",
    lawyerEta: "Az ellenőrzés általában a fizetéstől számított 24 órán belül, expressz esetén 4 órán belül elkészül.",
    aiDone: "AI kész",
    lawyerVerifying: "Ügyvéd ellenőrzi",
    stepUploaded: "Feltöltés",
    stepPayment: "Fizetés",
    stepAnalysis: "AI elemzés",
    stepReview: "Ügyvédi ellenőrzés",
    stepDone: "Kész",
    highRisk: "Magas kockázat",
    mediumRisk: "Közepes kockázat",
    lowRisk: "Alacsony kockázat",
    clauseAnalysis: "Pontok elemzése",
    legalBasis: "Jogalap:",
    suggestedEdit: "Javasolt módosítás:",
    lawyerNote: "Ügyvédi megjegyzés:",
    dateLocale: "hu-HU",
    countdownLabel: "Garantált átadás:",
    countdownExpired: "A reportot a lehető leghamarabb átadjuk",
    upgradeTitle: "Szeretné, hogy ügyvédi iroda vagy ügyvéd ellenőrizze?",
    upgradeDesc: "Az ingyenes szken a top 3 kockázatot mutatja. A Standard vagy Prémium ellenőrzésnél ügyvédi iroda vagy ügyvéd ellenőrzi és írja alá a teljes reportot.",
    upgradeStandard: "Standard ellenőrzés, 249 eur",
    upgradeStandardDesc: "Teljes report, ügyvédi ellenőrzéssel és aláírással.",
    upgradePremium: "Prémium ellenőrzés, 490 eur",
    upgradePremiumDesc: "Ráadásul redline dokumentum azonnal használható módosításokkal.",
    upgradeLogin: "A megrendelés befejezéséhez először jelentkezzen be.",
  },
};

type TxShape = typeof TX.sk;

/** 5-step progress strip with visible text labels and screen-reader labels. */
function ProgressStrip({ current, tx }: { current: number; tx: TxShape }) {
  const steps = [
    { icon: Upload, label: tx.stepUploaded },
    { icon: CreditCard, label: tx.stepPayment },
    { icon: Loader2, label: tx.stepAnalysis },
    { icon: Scale, label: tx.stepReview },
    { icon: FileCheck, label: tx.stepDone },
  ];
  return (
    <div className="flex items-start justify-center mt-4" role="list">
      {steps.map((step, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const StepIcon = step.icon;
        return (
          <div key={i} className="flex items-start">
            <div
              className="flex flex-col items-center w-14 sm:w-16"
              role="listitem"
              aria-label={step.label}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                done ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary/40" : "bg-muted text-muted-foreground"
              }`}>
                <StepIcon className={`h-3.5 w-3.5 ${isCurrent && i === 2 ? "animate-spin" : ""}`} aria-hidden="true" />
              </div>
              <span className={`text-[10px] mt-1 font-sans text-center leading-tight ${
                isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-3 sm:w-5 h-0.5 mt-3.5 rounded-full ${done ? "bg-primary" : "bg-muted"}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeliveryCountdown({ startAt, expressAddon, tx }: { startAt: number; expressAddon: number; tx: TxShape }) {
  const deadline = useMemo(() => {
    const hours = expressAddon ? 4 : 24;
    return startAt + hours * 60 * 60 * 1000;
  }, [startAt, expressAddon]);

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

function getStoredPaidAt(contractId: number): number {
  if (typeof window === "undefined" || contractId <= 0) return 0;
  try {
    const raw = window.localStorage.getItem(`bod:paidAt:${contractId}`);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export default function ContractDetail() {
  // No forced login: anonymous free-scan visitors hold a claim cookie and the
  // server gates every query on owner-or-claim. Login happens at checkout.
  const { isAuthenticated } = useAuth();
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
      toast.success(tx.paymentSuccess);
    } else if (paymentResult === 'cancelled') {
      toast.error(tx.paymentCancelled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentResult]);

  // Remember when the payment succeeded so the delivery countdown starts
  // from the payment moment, not from the upload moment.
  useEffect(() => {
    if (paymentResult === 'success' && contractId > 0) {
      try {
        const key = `bod:paidAt:${contractId}`;
        if (!window.localStorage.getItem(key)) {
          window.localStorage.setItem(key, String(Date.now()));
        }
      } catch {
        // localStorage unavailable: countdown falls back to createdAt
      }
    }
  }, [paymentResult, contractId]);

  const { data, isLoading, refetch } = trpc.contracts.getById.useQuery(
    { id: contractId },
    {
      enabled: isAuthenticated && contractId > 0,
      // Stop polling once the contract reached a terminal state.
      refetchInterval: (query) => {
        const status = query.state.data?.contract?.status as string | undefined;
        if (status === "completed" || status === "failed" || status === "error") return false;
        return 5000;
      },
    }
  );

  const retryMutation = trpc.contracts.retryAnalysis.useMutation({
    onSuccess: () => refetch(),
  });

  // Public with claim-cookie support server-side, so no auth gate here.
  const paymentStatus = trpc.payments.getStatus.useQuery(
    { contractId },
    { enabled: contractId > 0 }
  );

  // Same-tab redirect: popups are blocked on iOS Safari and many mobile
  // browsers, so navigate directly and keep a visible fallback link.
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const createCheckout = trpc.payments.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        toast.success(tx.redirecting);
        window.location.href = data.checkoutUrl;
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
  const isFailed = (contract.status as string) === "failed" || (contract.status as string) === "error";

  // Countdown start: the later of the locally stored payment moment and any
  // payment timestamp the payments API returns; only fall back to createdAt
  // when neither exists.
  const storedPaidAt = getStoredPaidAt(contractId);
  const payloadPaidAtRaw = (paymentStatus.data as { paid: boolean; paidAt?: string | number | Date } | undefined)?.paidAt;
  const payloadPaidAt = payloadPaidAtRaw ? new Date(payloadPaidAtRaw).getTime() : 0;
  const paidAt = Math.max(storedPaidAt, Number.isFinite(payloadPaidAt) ? payloadPaidAt : 0);
  const countdownStart = paidAt > 0 ? paidAt : new Date(contract.createdAt).getTime();

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
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="min-w-0">
              <h1 className="text-2xl font-serif mb-1 truncate" title={contract.fileName}>{contract.fileName}</h1>
              <p className="text-sm text-muted-foreground font-sans">
                {tx.uploaded} {new Date(contract.createdAt).toLocaleDateString(tx.dateLocale)} · {tx.plan}: {tx.planNames[contract.plan] || contract.plan}
              </p>
            </div>
            {contract.status === "completed" && (
              <div className="shrink-0">
                <Link href={localePath(`/report/${contract.id}`)}>
                  <Button className="font-sans">{tx.viewReport}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Free-scan upsell: upgrade a basic contract to a lawyer-verified review */}
          {contract.plan === "basic" && !paymentStatus.data?.paid && (
            <Card className="mb-8 border-primary/30 bg-primary/[0.03]">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Scale className="h-6 w-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-sans text-lg font-semibold">{tx.upgradeTitle}</h3>
                    <p className="text-sm text-muted-foreground font-sans">{tx.upgradeDesc}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    { plan: "standard" as const, label: tx.upgradeStandard, desc: tx.upgradeStandardDesc },
                    { plan: "premium" as const, label: tx.upgradePremium, desc: tx.upgradePremiumDesc },
                  ]).map(opt => (
                    <div key={opt.plan} className="rounded-lg border border-border p-4 flex flex-col">
                      <span className="font-sans font-medium mb-1">{opt.label}</span>
                      <span className="text-xs text-muted-foreground font-sans mb-3 flex-1">{opt.desc}</span>
                      <Button
                        className="font-sans w-full"
                        variant={opt.plan === "premium" ? "default" : "outline"}
                        disabled={createCheckout.isPending}
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.info(tx.upgradeLogin);
                            startLogin();
                            return;
                          }
                          createCheckout.mutate({ contractId: contract.id, upgradeTo: opt.plan });
                        }}
                      >
                        {createCheckout.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                        {tx.payAndStart}
                      </Button>
                    </div>
                  ))}
                </div>
                {checkoutUrl && (
                  <p className="mt-3 text-center">
                    <a href={checkoutUrl} className="text-sm font-sans text-primary underline underline-offset-2">
                      {tx.checkoutFallback}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Failed analysis */}
          {isFailed && (
            <Card className="mb-8 border-red-300 bg-red-50">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                <h3 className="font-sans text-lg font-semibold mb-1 text-red-900">{tx.failedTitle}</h3>
                <p className="text-sm text-red-800/80 font-sans mb-4">{tx.failedDesc}</p>
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
              </CardContent>
            </Card>
          )}

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
                {checkoutUrl && (
                  <p className="mt-3">
                    <a href={checkoutUrl} className="text-sm font-sans text-primary underline underline-offset-2">
                      {tx.checkoutFallback}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status - analyzing or paid pending */}
          {!isFailed && (contract.status === "analyzing" || (contract.status === "pending" && paymentStatus.data?.paid)) && (
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
                <DeliveryCountdown startAt={countdownStart} expressAddon={contract.expressAddon} tx={tx} />
                {/* Progress steps */}
                <ProgressStrip current={2} tx={tx} />
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
                  <p className="text-sm text-muted-foreground font-sans">{tx.lawyerReviewLine}</p>
                  <p className="text-sm text-muted-foreground font-sans mt-1">{tx.lawyerEta}</p>
                </div>
                {/* Two-step indicator: AI done, lawyer verifying */}
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-300 text-green-800 px-3 py-1 text-xs font-sans">
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> {tx.aiDone}
                  </span>
                  <span className="w-5 h-0.5 bg-amber-300 rounded-full" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1 text-xs font-sans">
                    <Scale className="h-3.5 w-3.5" aria-hidden="true" /> {tx.lawyerVerifying}
                  </span>
                </div>
                {/* Progress steps */}
                <ProgressStrip current={3} tx={tx} />
              </CardContent>
            </Card>
          )}

          {/* Risk Summary */}
          {report && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-red-800">{(report.riskSummary as { high?: number } | null)?.high || 0}</p>
                  <p className="text-xs text-red-600 font-sans">{tx.highRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-amber-800">{(report.riskSummary as { medium?: number } | null)?.medium || 0}</p>
                  <p className="text-xs text-amber-600 font-sans">{tx.mediumRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-serif text-green-800">{(report.riskSummary as { low?: number } | null)?.low || 0}</p>
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
