import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Loader2, CreditCard, Zap, Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import { PRICING_PLANS, EXPRESS_ADDON } from "@shared/types";
import { useT } from "@/i18n";

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
  const [dragOver, setDragOver] = useState(false);

  const uploadMutation = trpc.contracts.upload.useMutation({
    onSuccess: (data) => {
      if (selectedPlan === "basic") {
        toast.success(t.upload.successBasic);
        navigate(localePath(`/preview/${data.contractId}`));
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
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!file || !selectedPlan) return;

    if (!isAuthenticated) {
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
        });
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error(t.upload.errorRead);
      setUploading(false);
    }
  };

  // Get price for selected plan - use marketing-friendly prices from stripe-products
  const MARKETING_PRICES_EUR: Record<string, number> = { basic: 197, standard: 297, premium: 497 };
  const MARKETING_PRICES_CZK: Record<string, number> = { basic: 4990, standard: 7490, premium: 12490 };
  const EXPRESS_EUR = 127;
  const EXPRESS_CZK = 3190;
  const selectedPlanData = PRICING_PLANS.find(p => p.id === selectedPlan);
  const totalPriceEur = (MARKETING_PRICES_EUR[selectedPlan] || 0) + (expressAddon ? EXPRESS_EUR : 0);
  const totalPriceCzk = (MARKETING_PRICES_CZK[selectedPlan] || 0) + (expressAddon ? EXPRESS_CZK : 0);

  // Plan names per locale
  const planNames = locale === "en"
    ? [t.pricing.basicTitle, t.pricing.standardTitle, t.pricing.premiumTitle]
    : PRICING_PLANS.map(p => p.nameSk);

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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : file ? "border-primary/50 bg-primary/[0.02]" : "border-border hover:border-primary/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
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
                      <p className="text-2xl font-serif">{[t.pricing.basicPrice, t.pricing.standardPrice, t.pricing.premiumPrice][index]}</p>
                    </div>
                    {selectedPlan === plan.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mb-2">{plan.delivery}</p>
                  <ul className="text-xs text-muted-foreground font-sans space-y-1">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-muted-foreground">+{plan.features.length - 3} {t.upload.moreFeatures}</li>
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
                <span className="font-serif text-lg">{EXPRESS_ADDON.priceLabel}</span>
                {expressAddon && <CheckCircle className="h-4 w-4 text-primary" />}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                className="font-sans"
                disabled={!file || !selectedPlan || uploading}
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
                    ) : (
                      <><CreditCard className="mr-2 h-4 w-4" />{isAuthenticated ? `${t.upload.uploadAndPay} (${locale === 'cz' ? `${totalPriceCzk.toLocaleString('cs-CZ')} Kč` : `${totalPriceEur} eur`})` : `${t.upload.continueLabel} (${locale === 'cz' ? `${totalPriceCzk.toLocaleString('cs-CZ')} Kč` : `${totalPriceEur} eur`})`}</>
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
                <p className="text-xs text-amber-600 font-sans font-medium">
                  {t.upload.testCardNote}
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
