import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useCallback, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Link } from "wouter";
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Loader2, CreditCard, Zap, Lock, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PRICING_PLANS } from "@shared/types";
import { useT } from "@/i18n";

// sessionStorage key for form-state persistence across the login redirect
const UPLOAD_STASH_KEY = "bod_upload_stash";

/** Soft page-count heuristic for PDFs: counts "/Type /Page" objects in the raw
 * bytes. Informational only, never blocks the upload. */
async function estimatePdfPages(f: File): Promise<number | null> {
  try {
    const buf = await f.arrayBuffer();
    const text = new TextDecoder("latin1").decode(new Uint8Array(buf));
    const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
    return matches && matches.length > 0 ? matches.length : null;
  } catch {
    return null;
  }
}

export default function Upload() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedPlan = params.get("plan") as string | null;
  const { t, locale, localePath } = useT();

  const [file, setFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(preselectedPlan || "standard");
  const [expressAddon, setExpressAddon] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [phone, setPhone] = useState("");
  const [clientParty, setClientParty] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [consent, setConsent] = useState(false);
  const [pageEstimate, setPageEstimate] = useState<number | null>(null);
  const [restoredFileName, setRestoredFileName] = useState<string | null>(null);

  // Restore stashed selections after the login redirect (paid plans only stash).
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    try {
      const raw = sessionStorage.getItem(UPLOAD_STASH_KEY);
      if (!raw) return;
      const stash = JSON.parse(raw) as { plan?: string; express?: boolean; phone?: string; fileName?: string };
      if (stash.plan && ["basic", "standard", "premium"].includes(stash.plan)) setSelectedPlan(stash.plan);
      if (typeof stash.express === "boolean") setExpressAddon(stash.express);
      if (typeof stash.phone === "string" && stash.phone) setPhone(stash.phone);
      if (typeof stash.fileName === "string" && stash.fileName) setRestoredFileName(stash.fileName);
      sessionStorage.removeItem(UPLOAD_STASH_KEY);
    } catch {
      // corrupted stash, ignore
    }
  }, [authLoading, isAuthenticated]);

  const uploadMutation = trpc.contracts.upload.useMutation({
    onSuccess: (data) => {
      if (selectedPlan === "basic") {
        toast.success(t.upload.successBasic);
        navigate(localePath(`/preview/${data.contractId}`));
      } else if (data.trialApplied) {
        toast.success(
          locale === "en" ? "Free trial analysis applied, no charge." :
          locale === "cz" ? "Bezplatná analýza z trialu uplatněna, bez platby." :
          locale === "hu" ? "Ingyenes próbaelemzés alkalmazva, fizetés nélkül." :
          "Bezplatná analýza zo skúšobnej verzie uplatnená, bez platby."
        );
        navigate(localePath(`/contract/${data.contractId}`));
      } else {
        toast.success(t.upload.successPaid);
        navigate(localePath(`/contract/${data.contractId}`));
      }
      setUploading(false);
    },
    onError: (error) => {
      toast.error(t.upload.errorUpload + error.message);
      setUploading(false);
    },
  });

  const trialStatusQuery = trpc.trial.status.useQuery(undefined, { enabled: isAuthenticated });

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error(t.upload.errorFormat);
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error(t.upload.errorSize);
      return;
    }
    setFile(selectedFile);
    setRestoredFileName(null);
    // Soft page-count estimate for PDFs (never blocks the upload)
    setPageEstimate(null);
    if (selectedFile.type === "application/pdf") {
      estimatePdfPages(selectedFile).then(pages => setPageEstimate(pages)).catch(() => {});
    }
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!file || !selectedPlan || !consent) return;

    // The free basic scan runs without login; paid plans require a session.
    // Stash the selections so they survive the login redirect (restored above).
    if (!isAuthenticated && selectedPlan !== "basic") {
      try {
        sessionStorage.setItem(UPLOAD_STASH_KEY, JSON.stringify({
          plan: selectedPlan,
          express: expressAddon,
          phone,
          fileName: file.name,
        }));
      } catch {
        // storage unavailable, continue to login anyway
      }
      toast.info(t.upload.loginFirst);
      startLogin();
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation.mutate({
          fileName: file.name,
          mimeType: file.type,
          fileBase64: base64,
          plan: selectedPlan as "basic" | "standard" | "premium",
          expressAddon: expressAddon,
          language: locale,
          clientParty: clientParty.trim() || undefined,
          phone: phone || undefined,
        });
      };
      reader.onerror = () => {
        toast.error(t.upload.errorRead);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error(t.upload.errorRead);
      setUploading(false);
    }
  };

  // Get price for selected plan - use marketing-friendly prices from stripe-products
  // (basic is the free scan, so it carries no price anywhere)
  const MARKETING_PRICES_EUR: Record<string, number> = { basic: 0, standard: 249, premium: 490 };
  const MARKETING_PRICES_CZK: Record<string, number> = { basic: 0, standard: 7490, premium: 12490 };
  const MARKETING_PRICES_HUF: Record<string, number> = { basic: 0, standard: 119000, premium: 199000 };
  const EXPRESS_EUR = 127;
  const EXPRESS_CZK = 3190;
  const EXPRESS_HUF = 51000;
  const selectedPlanData = PRICING_PLANS.find(p => p.id === selectedPlan);
  const totalPriceEur = (MARKETING_PRICES_EUR[selectedPlan] || 0) + (expressAddon ? EXPRESS_EUR : 0);
  const totalPriceCzk = (MARKETING_PRICES_CZK[selectedPlan] || 0) + (expressAddon ? EXPRESS_CZK : 0);
  const totalPriceHuf = (MARKETING_PRICES_HUF[selectedPlan] || 0) + (expressAddon ? EXPRESS_HUF : 0);
  const priceLabel = locale === "cz"
    ? `${totalPriceCzk.toLocaleString("cs-CZ")} Kč`
    : locale === "hu"
      ? `${totalPriceHuf.toLocaleString("hu-HU")} Ft`
      : `${totalPriceEur} eur`;
  const trialFree = isAuthenticated && selectedPlan !== "basic" && trialStatusQuery.data?.freeAnalysisAvailable === true;
  const trialCtaLabel = locale === "en" ? "Use free trial analysis"
    : locale === "cz" ? "Použít bezplatnou analýzu z trialu"
    : locale === "hu" ? "Ingyenes próbaelemzés használata"
    : "Použiť bezplatnú analýzu zo skúšobnej verzie";
  const trialBannerText = locale === "en" ? "Your free trial analysis will be applied, no charge."
    : locale === "cz" ? "Uplatní se vaše bezplatná analýza z trialu, bez platby."
    : locale === "hu" ? "Az ingyenes próbaelemzés kerül alkalmazásra, fizetés nélkül."
    : "Uplatní sa vaša bezplatná analýza zo skúšobnej verzie, bez platby.";

  // Plan display strings are locale-specific (sk/cz/en)
  const planNames = [t.pricing.basicTitle, t.pricing.standardTitle, t.pricing.premiumTitle];
  const planPrices = [t.pricing.basicPrice, t.pricing.standardPrice, t.pricing.premiumPrice];
  const planTimes = [t.pricing.basicTime, t.pricing.standardTime, t.pricing.premiumTime];
  const planFeatures = [t.pricing.basicFeatures, t.pricing.standardFeatures, t.pricing.premiumFeatures];

  // Locale-aware legal document paths (same slugs the Footer uses)
  const vopPath = locale === "en" ? "/en/terms" : locale === "cz" ? "/cz/vop" : locale === "hu" ? "/hu/vop" : "/vop";
  const gdprPath = locale === "en" ? "/en/privacy" : locale === "cz" ? "/cz/gdpr" : locale === "hu" ? "/hu/gdpr" : "/gdpr";

  const pagesWarningText = file && pageEstimate !== null && selectedPlanData && pageEstimate > selectedPlanData.maxPages
    ? t.wp1.pagesWarning.replace("{pages}", String(pageEstimate)).replace("{max}", String(selectedPlanData.maxPages))
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-serif mb-2">{t.upload.title}</h1>
          <p className="text-muted-foreground font-sans mb-8">
            {t.upload.subtitle}
          </p>

          {/* File Upload Area */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                role="button"
                tabIndex={0}
                aria-label={t.upload.dragDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  dragOver ? "border-primary bg-primary/5" : file ? "border-primary/50 bg-primary/[0.02]" : "border-border hover:border-primary/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    document.getElementById("file-input")?.click();
                  }
                }}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-primary" />
                    <div>
                      <p className="font-sans font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground font-sans">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="font-sans" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      {t.upload.changeFile}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <UploadIcon className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-sans font-medium">{t.upload.dragDrop}</p>
                      <p className="text-sm text-muted-foreground font-sans">{t.upload.dragDropHint}</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {restoredFileName && !file && (
                <p className="text-sm text-primary font-sans mt-3" data-testid="upload-restore-notice">
                  {t.wp1.restoreNotice.replace("{fileName}", restoredFileName)}
                </p>
              )}
              {pagesWarningText && (
                <p className="text-xs text-amber-600 font-sans mt-3" data-testid="upload-pages-warning">
                  {pagesWarningText}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Plan Selection */}
          <h2 className="text-xl font-serif mb-4">{t.upload.selectPlan}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PRICING_PLANS.map((plan, index) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id ? "border-2 border-primary shadow-md" : "border hover:border-primary/30"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-sans font-semibold text-sm">{planNames[index]}</h3>
                      <p className="text-2xl font-serif">{planPrices[index]}</p>
                    </div>
                    {selectedPlan === plan.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mb-2">{planTimes[index]}</p>
                  <ul className="text-xs text-muted-foreground font-sans space-y-1">
                    {planFeatures[index].slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                    {planFeatures[index].length > 3 && (
                      <li className="text-muted-foreground">+{planFeatures[index].length - 3} {t.upload.moreFeatures}</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Express Add-on */}
          <Card
            className={`mb-8 cursor-pointer transition-all ${
              expressAddon ? "border-2 border-primary bg-primary/[0.02]" : "border border-dashed hover:border-primary/30"
            }`}
            onClick={() => setExpressAddon(!expressAddon)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className={`h-5 w-5 ${expressAddon ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-sans font-semibold text-sm">{t.pricing.expressTitle}</p>
                  <p className="text-xs text-muted-foreground font-sans">{t.pricing.expressDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg">{t.pricing.expressPrice}</span>
                {expressAddon && <CheckCircle className="h-4 w-4 text-primary" />}
              </div>
            </CardContent>
          </Card>

          {/* Whose side the client is on. Risk is directional: a liability cap
              protects the drafter and burdens the other party, so the analysis
              needs to know whose perspective to take. Optional: without it the
              report labels who each risk burdens. */}
          <div className="mb-4" data-testid="upload-party-block">
            <label className="text-sm font-sans font-medium block mb-1" htmlFor="client-party">
              {locale === 'en' ? 'Which party do you represent? (recommended)'
                : locale === 'cz' ? 'Kterou stranu zastupujete? (doporučené)'
                : 'Ktorú stranu zastupujete? (odporúčané)'}
            </label>
            <input
              id="client-party"
              type="text"
              maxLength={200}
              value={clientParty}
              onChange={(e) => setClientParty(e.target.value)}
              placeholder={locale === 'en' ? 'e.g. customer, tenant, buyer, or your company name'
                : locale === 'cz' ? 'např. objednatel, nájemce, kupující, nebo název vaší firmy'
                : 'napr. objednávateľ, nájomca, kupujúci, alebo názov vašej firmy'}
              className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="upload-party-input"
            />
            <p className="text-xs text-muted-foreground font-sans mt-1">
              {locale === 'en' ? 'We assess every risk from your side of the contract. Without this, the report labels who each risk burdens.'
                : locale === 'cz' ? 'Rizika hodnotíme z pohledu vaší strany smlouvy. Bez údaje report u každého nálezu označí, koho zatěžuje.'
                : 'Riziká hodnotíme z pohľadu vašej strany zmluvy. Bez údaja report pri každom náleze označí, koho zaťažuje.'}
            </p>
          </div>

          {/* Optional SMS/WhatsApp notifications (paid plans only: the copy
              promises a lawyer-signed report, which the free scan has not) */}
          {selectedPlan !== "basic" && (
          <div className="mb-2" data-testid="upload-phone-block">
            <label className="text-sm font-sans font-medium block mb-1" htmlFor="notify-phone">
              {locale === 'en' ? 'Phone for SMS / WhatsApp updates (optional)'
                : locale === 'cz' ? 'Telefon pro SMS / WhatsApp upozornění (volitelné)'
                : 'Telefón pre SMS / WhatsApp upozornenia (voliteľné)'}
            </label>
            <input
              id="notify-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+421 900 000 000"
              className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="upload-phone-input"
            />
            <p className="text-xs text-muted-foreground font-sans mt-1">
              {locale === 'en' ? 'We will message you when your analysis and lawyer-signed report are ready.'
                : locale === 'cz' ? 'Pošleme vám zprávu, až bude analýza a advokátem podepsaný report hotový.'
                : 'Pošleme vám správu, keď bude analýza a advokátom podpísaný report hotový.'}
            </p>
          </div>
          )}

          {/* GDPR / VOP consent (required before submit) */}
          <label className="flex items-start gap-2 mb-4 cursor-pointer select-none" data-testid="upload-consent-block">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              data-testid="upload-consent-checkbox"
            />
            <span className="text-sm font-sans text-muted-foreground">
              {t.wp1.consentText1}
              <Link href={vopPath} className="text-primary underline hover:no-underline" onClick={(e) => e.stopPropagation()}>{t.wp1.consentVop}</Link>
              {t.wp1.consentText2}
              <Link href={gdprPath} className="text-primary underline hover:no-underline" onClick={(e) => e.stopPropagation()}>{t.wp1.consentGdpr}</Link>
              {t.wp1.consentText3}
            </span>
          </label>

          {/* Submit */}
          <div className="flex flex-col gap-3">
            {trialFree && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-2" data-testid="trial-banner">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-sans">{trialBannerText}</p>
              </div>
            )}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                className="font-sans"
                disabled={!file || !selectedPlan || uploading || !consent}
                onClick={handleSubmit}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.upload.processing}
                  </>
                ) : (
                  <>
                    {selectedPlan === "basic" ? (
                      <><UploadIcon className="mr-2 h-4 w-4" />{t.upload.uploadFreePreview}</>
                    ) : trialFree ? (
                      <><Sparkles className="mr-2 h-4 w-4" />{trialCtaLabel}</>
                    ) : (
                      <><CreditCard className="mr-2 h-4 w-4" />{isAuthenticated ? `${t.upload.uploadAndPay} (${priceLabel})` : `${t.upload.continueLabel} (${priceLabel})`}</>
                    )}
                  </>
                )}
              </Button>
              {!file && (
                <p className="text-sm text-muted-foreground font-sans flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {t.upload.uploadFirst}
                </p>
              )}
            </div>
            {uploading && (
              <div
                className="w-full max-w-sm h-1.5 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-label={t.upload.processing}
                data-testid="upload-progress"
              >
                <div className="h-full w-full bg-primary/70 animate-pulse rounded-full" />
              </div>
            )}
            <p className="text-xs text-muted-foreground font-sans">
              {selectedPlan === "basic"
                ? t.upload.basicNote
                : isAuthenticated
                  ? t.upload.paidNote
                  : t.upload.loginNote
              }
            </p>
            {selectedPlan !== "basic" && (
              <>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans">
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {locale === 'en' ? 'SSL encrypted' : locale === 'cz' ? 'Šifrované připojení' : 'Šifrované pripojenie'}</span>
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {locale === 'en' ? 'Attorney-client privilege' : locale === 'cz' ? 'Advokátní mlčenlivost' : 'Advokátska mlčanlivosť'}</span>
                </div>
                {import.meta.env.VITE_STRIPE_TEST_MODE === 'true' && (
                  <p className="text-xs text-amber-600 font-sans font-medium">
                    {t.upload.testCardNote}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
