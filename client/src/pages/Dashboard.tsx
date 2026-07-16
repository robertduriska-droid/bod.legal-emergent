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
import { RISK_CATEGORIES } from "@shared/types";

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

  // ── Mini command center: computed client-side from existing query data ──
  const completedContracts = useMemo(
    () => (contracts || []).filter((c) => c.status === "completed"),
    [contracts]
  );

  // Clause categories live in the per-contract detail; fetch a bounded sample
  // (5 most recent completed contracts) to compute the top risk areas tile.
  const detailQueries = trpc.useQueries((q) =>
    completedContracts.slice(0, 5).map((c) => q.contracts.getById({ id: c.id }))
  );

  const stats = useMemo(() => {
    const completedCount = completedContracts.length;
    let avgLabel: string | null = null;
    if (completedCount > 0) {
      const totalMs = completedContracts.reduce((sum, c) => {
        const start = new Date(c.createdAt).getTime();
        const end = new Date((c as any).updatedAt || c.createdAt).getTime();
        return sum + Math.max(0, end - start);
      }, 0);
      const avgMs = totalMs / completedCount;
      const hours = Math.floor(avgMs / 3600000);
      const minutes = Math.round((avgMs % 3600000) / 60000);
      avgLabel = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
    }
    return { completedCount, avgLabel };
  }, [completedContracts]);

  const topRiskAreas = useMemo(() => {
    const counts = new Map<string, number>();
    detailQueries.forEach((q) => {
      q.data?.clauses?.forEach((cl) => {
        const category = (cl as { riskCategory?: string | null }).riskCategory;
        if (category) counts.set(category, (counts.get(category) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id, count]) => {
        const cat = RISK_CATEGORIES.find((c) => c.id === id);
        const label = cat ? (locale === "en" ? cat.label : cat.labelSk) : id;
        return { label, count };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQueries.map((q) => q.data).filter(Boolean).length, completedContracts, locale]);

  const statsLabels = locale === "en"
    ? { reviewed: "Contracts reviewed", avgTime: "Average delivery time", riskAreas: "Most common risk areas" }
    : locale === "cz"
    ? { reviewed: "Zkontrolované smlouvy", avgTime: "Průměrný čas dodání", riskAreas: "Nejčastější rizikové oblasti" }
    : { reviewed: "Skontrolované zmluvy", avgTime: "Priemerný čas dodania", riskAreas: "Najčastejšie rizikové oblasti" };

  // Contracts come in Slovak or English, analysed under Slovak law either
  // way, so the filter matches contract.language. The old third tab offered
  // Czech contracts, which the service does not accept.
  const jurisdictionLabels: Record<string, string> = locale === "en"
    ? { all: "All", sk: "Slovak", en: "English" }
    : { all: "Všetky", sk: "Slovenské", en: "Anglické" };

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
  // Source of truth: server/stripe-products.ts (basic is the free scan, standard=249€, premium=490€)
  // CZK: marketing-friendly rounded equivalents
  const planPrices: Record<string, { eur: string; czk: string }> = {
    basic: { eur: locale === "en" ? "free" : "zadarmo", czk: "zdarma" },
    standard: { eur: "249 €", czk: "6 290 Kč" },
    premium: { eur: "490 €", czk: "12 490 Kč" },
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

          {/* Mini command center */}
          {contracts && contracts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-sans">{statsLabels.reviewed}</p>
                  <p className="text-2xl font-serif mt-1">{stats.completedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-sans">{statsLabels.avgTime}</p>
                  <p className="text-2xl font-serif mt-1">{stats.avgLabel ?? "…"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-sans">{statsLabels.riskAreas}</p>
                  {topRiskAreas.length > 0 ? (
                    <div className="mt-1.5 space-y-0.5">
                      {topRiskAreas.map((area) => (
                        <p key={area.label} className="text-sm font-sans truncate" title={area.label}>
                          {area.label} ({area.count})
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-2xl font-serif mt-1">…</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

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
                <ToggleGroupItem value="en" className="font-sans text-xs px-3 h-8">
                  🇬🇧 {jurisdictionLabels.en}
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
                <p className="text-muted-foreground font-sans mb-4">
                  {locale === "en" ? "No reviews yet. Upload your first contract for free." : locale === "cz" ? "Zatím žádné kontroly. Nahrajte první smlouvu zdarma." : "Zatiaľ žiadne kontroly. Nahrajte prvú zmluvu zadarmo."}
                </p>
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
