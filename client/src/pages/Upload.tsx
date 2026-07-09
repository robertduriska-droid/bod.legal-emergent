import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PRICING_PLANS } from "@shared/types";

export default function Upload() {
  const { isAuthenticated, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedPlan = params.get("plan") as string | null;

  const [file, setFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(preselectedPlan || "standard");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadMutation = trpc.contracts.upload.useMutation({
    onSuccess: (data) => {
      // TEST MODE: Skip Stripe checkout, go directly to contract detail
      // Analysis starts immediately on upload
      // TODO: Re-enable Stripe checkout when payment is active
      toast.success("Zmluva bola úspešne nahratá! AI analýza sa spúšťa...");
      navigate(`/contract/${data.contractId}`);
      setUploading(false);
    },
    onError: (error) => {
      toast.error("Chyba pri nahrávaní: " + error.message);
      setUploading(false);
    },
  });

  const createCheckout = trpc.payments.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Presmerovávame na platbu...");
        window.open(data.checkoutUrl, "_blank");
        // Also navigate to the contract page so user can see status
        const contractId = uploadMutation.data?.contractId;
        if (contractId) {
          navigate(`/contract/${contractId}`);
        }
      }
      setUploading(false);
    },
    onError: (error) => {
      toast.error("Chyba pri vytváraní platby: " + error.message);
      setUploading(false);
    },
  });

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Podporované formáty: PDF, DOCX");
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("Maximálna veľkosť súboru je 50 MB");
      return;
    }
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!file || !selectedPlan) return;
    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation.mutate({
          fileName: file.name,
          mimeType: file.type,
          fileBase64: base64,
          plan: selectedPlan as "basic" | "standard" | "premium" | "audit",
          language: "sk",
        });
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Chyba pri čítaní súboru");
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get price for selected plan
  const selectedPlanData = PRICING_PLANS.find(p => p.id === selectedPlan);
  const isAuditPlan = selectedPlan === "audit";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-serif mb-2">Nahrať zmluvu</h1>
          <p className="text-muted-foreground font-sans mb-8">
            Nahrajte zmluvu vo formáte PDF alebo DOCX a vyberte si plán kontroly.
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
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.includes("pdf") ? "PDF" : "DOCX"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="font-sans" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      Zmeniť súbor
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <UploadIcon className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-sans font-medium">Pretiahnite súbor sem</p>
                      <p className="text-sm text-muted-foreground font-sans">alebo kliknite pre výber · PDF, DOCX · max 50 MB</p>
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
          <h2 className="text-xl font-serif mb-4">Vyberte plán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {PRICING_PLANS.map((plan) => (
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
                      <h3 className="font-sans font-semibold">{plan.nameSk}</h3>
                      <p className="text-2xl font-serif">{plan.price}</p>
                    </div>
                    {selectedPlan === plan.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mb-2">Dodanie: {plan.delivery}</p>
                  <ul className="text-xs text-muted-foreground font-sans space-y-1">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-muted-foreground">+{plan.features.length - 3} ďalšie</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

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
                    {createCheckout.isPending ? "Vytváram platbu..." : "Nahrávam..."}
                  </>
                ) : isAuditPlan ? (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Odoslať na posúdenie
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Nahrať a zaplatiť {selectedPlanData?.price}
                  </>
                )}
              </Button>
              {!file && (
                <p className="text-sm text-muted-foreground font-sans flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Najprv nahrajte súbor
                </p>
              )}
            </div>
            {!isAuditPlan && (
              <p className="text-xs text-muted-foreground font-sans">
                Po nahratí budete presmerovaní na bezpečnú platobnú bránu Stripe. Analýza sa spustí automaticky po úspešnej platbe.
              </p>
            )}
            {isAuditPlan && (
              <p className="text-xs text-muted-foreground font-sans">
                Legal Audit je individuálne nacenený. Po nahratí vás budeme kontaktovať s cenovou ponukou.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
