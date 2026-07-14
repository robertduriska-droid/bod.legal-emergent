import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { FileText, Upload, Clock, CheckCircle, AlertCircle, Loader2, Eye, CreditCard, Brain, Scale } from "lucide-react";
import { useT } from "@/i18n";
import { useState, useMemo } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: contracts, isLoading } = trpc.contracts.myContracts.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { t, locale, localePath } = useT();
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");

  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    if (jurisdictionFilter === "all") return contracts;
    return contracts.filter((c: any) => c.language === jurisdictionFilter);
  }, [contracts, jurisdictionFilter]);

  const jurisdictionLabels: Record<string, string> = locale === "en"
    ? { all: "All", sk: "Slovak", cz: "Czech" }
    : locale === "cz"
    ? { all: "Všechny", sk: "Slovenské", cz: "České" }
    : { all: "Všetky", sk: "Slovenské", cz: "České" };

  const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
    pending: { label: t.dashboard.status.pending, variant: "secondary", icon: Clock },
    analyzing: { label: t.dashboard.status.analyzing, variant: "outline", icon: Loader2 },
    in_review: { label: t.dashboard.status.in_review, variant: "default", icon: Eye },
    completed: { label: t.dashboard.status.completed, variant: "default", icon: CheckCircle },
  };

  const PROGRESS_STEPS = [
    { key: "pending", label: locale === "en" ? "Uploaded" : locale === "cz" ? "Nahráno" : "Nahraná", icon: Upload },
    { key: "analyzing", label: locale === "en" ? "AI Analysis" : "AI analýza", icon: Brain },
    { key: "in_review", label: locale === "en" ? "Lawyer Review" : locale === "cz" ? "Kontrola advokátem" : "Kontrola advokátom", icon: Scale },
    { key: "completed", label: locale === "en" ? "Done" : "Hotovo", icon: CheckCircle },
  ];

  function getStepIndex(status: string) {
    const idx = PROGRESS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  }

  const planLabels: Record<string, string> = locale === "en"
    ? { basic: "Basic", standard: "Standard", premium: "Premium" }
    : locale === "cz"
    ? { basic: "Základní", standard: "Standardní", premium: "Prémiová" }
    : { basic: "Základná", standard: "Štandardná", premium: "Prémiová" };

  // Price labels per plan, currency depends on contract language
  // Source of truth: server/stripe-products.ts (basic=197€, standard=297€, premium=497€)
  // CZK: marketing-friendly rounded equivalents
  const planPrices: Record<string, { eur: string; czk: string }> = {
    basic: { eur: "197 €", czk: "4 990 Kč" },
    standard: { eur: "297 €", czk: "7 490 Kč" },
    premium: { eur: "497 €", czk: "12 490 Kč" },
  };

  function getPlanDisplay(plan: string, language: string) {
    const label = planLabels[plan] || plan;
    const price = planPrices[plan];
    if (!price) return label;
    const amount = language === "cz" ? price.czk : price.eur;
    return `${label} · ${amount}`;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif">{t.dashboard.title}</h1>
              <p className="text-muted-foreground font-sans mt-1">
                {locale === "en" ? "Overview of your submitted contracts and their status" : locale === "cz" ? "Přehled vašich odeslaných smluv a jejich stav" : "Prehľad vašich odoslaných zmlúv a ich stav"}
              </p>
            </div>
            <Link href={localePath("/upload")}>
              <Button className="font-sans">
                <Upload className="mr-2 h-4 w-4" />
                {t.header.uploadContract}
              </Button>
            </Link>
          </div>

          {/* Jurisdiction filter */}
          {contracts && contracts.length > 0 && (
            <div className="mb-4">
              <ToggleGroup
                type="single"
                value={jurisdictionFilter}
                onValueChange={(v) => v && setJurisdictionFilter(v)}
                className="justify-start"
              >
                <ToggleGroupItem value="all" className="font-sans text-xs px-3 h-8">
                  {jurisdictionLabels.all}
                </ToggleGroupItem>
                <ToggleGroupItem value="sk" className="font-sans text-xs px-3 h-8">
                  🇸🇰 {jurisdictionLabels.sk}
                </ToggleGroupItem>
                <ToggleGroupItem value="cz" className="font-sans text-xs px-3 h-8">
                  🇨🇿 {jurisdictionLabels.cz}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !contracts || contracts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-sans text-xl font-semibold mb-2">
                  {locale === "en" ? "No contracts yet" : locale === "cz" ? "Zatím žádné smlouvy" : "Zatiaľ žiadne zmluvy"}
                </h3>
                <p className="text-muted-foreground font-sans mb-4">{t.dashboard.noContracts}</p>
                <Link href={localePath("/upload")}>
                  <Button className="font-sans">
                    <Upload className="mr-2 h-4 w-4" />
                    {t.header.uploadContract}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-sans">
                  {locale === "en" ? "No contracts for this jurisdiction" : locale === "cz" ? "Žádné smlouvy pro tuto jurisdikci" : "Žiadne zmluvy pre túto jurisdikciu"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredContracts.map((contract) => {
                const status = STATUS_MAP[contract.status] || STATUS_MAP.pending;
                const StatusIcon = status.icon;
                return (
                  <Card key={contract.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-sans font-medium truncate">{contract.fileName}</p>
                            <p className="text-xs text-muted-foreground font-sans">
                              {new Date(contract.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : locale === "cz" ? "cs-CZ" : "sk-SK")} · {getPlanDisplay(contract.plan, (contract as any).language || "sk")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Link href={localePath(contract.status === "completed" && contract.plan !== "basic" ? `/report/${contract.id}` : contract.plan === "basic" && contract.status !== "pending" ? `/preview/${contract.id}` : `/contract/${contract.id}`)}>
                            <Button variant={contract.status === "completed" ? "default" : "ghost"} size="sm" className="font-sans">
                              {contract.status === "completed"
                                ? (locale === "en" ? "View report" : locale === "cz" ? "Zobrazit report" : "Zobraziť report")
                                : contract.status === "in_review"
                                ? (locale === "en" ? "In review" : locale === "cz" ? "U advokáta" : "U advokáta")
                                : contract.status === "analyzing"
                                ? (locale === "en" ? "Analyzing..." : locale === "cz" ? "Analyzuje se..." : "Analyzuje sa...")
                                : (locale === "en" ? "Continue" : locale === "cz" ? "Pokračovat" : "Pokračovať")
                              }
                            </Button>
                          </Link>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1">
                          {PROGRESS_STEPS.map((step, i) => {
                            const currentIdx = getStepIndex(contract.status);
                            const isCompleted = i < currentIdx;
                            const isCurrent = i === currentIdx;
                            const StepIcon = step.icon;
                            return (
                              <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                    isCompleted ? "bg-primary text-primary-foreground" :
                                    isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary/40" :
                                    "bg-muted text-muted-foreground"
                                  }`}>
                                    <StepIcon className={`h-3.5 w-3.5 ${isCurrent && step.key === "analyzing" ? "animate-spin" : ""}`} />
                                  </div>
                                  <span className={`text-[10px] mt-1 font-sans text-center leading-tight ${
                                    isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                                  }`}>{step.label}</span>
                                </div>
                                {i < PROGRESS_STEPS.length - 1 && (
                                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                                    i < currentIdx ? "bg-primary" : "bg-muted"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
