import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { FileText, Loader2, Eye, AlertTriangle, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "Čaká", variant: "secondary", color: "text-muted-foreground" },
  analyzing: { label: "AI analýza", variant: "outline", color: "text-blue-600" },
  in_review: { label: "Na kontrolu", variant: "destructive", color: "text-amber-600" },
  completed: { label: "Dokončené", variant: "default", color: "text-green-600" },
  failed: { label: "Chyba", variant: "destructive", color: "text-red-600" },
};

/** SLA windows in milliseconds: 4 h express, 24 h standard. */
const SLA_EXPRESS_MS = 4 * 60 * 60 * 1000;
const SLA_STANDARD_MS = 24 * 60 * 60 * 1000;

type FilterTab = "review" | "analyzing" | "done" | "error" | "all";

const KNOWN_STATUSES = ["pending", "analyzing", "in_review", "completed"];

/**
 * SLA state for a contract in the queue.
 * TODO(server): the admin.allContracts query exposes no payment timestamp,
 * so the countdown starts from createdAt. Switch to the paid timestamp once
 * the query returns it.
 */
function slaFor(contract: { createdAt: string | Date; expressAddon: number }, now: number) {
  const start = new Date(contract.createdAt).getTime();
  const window = contract.expressAddon === 1 ? SLA_EXPRESS_MS : SLA_STANDARD_MS;
  const deadline = start + window;
  const remaining = deadline - now;
  const state: "green" | "amber" | "red" =
    remaining <= 0 ? "red" : remaining > window / 2 ? "green" : "amber";
  return { remaining, state };
}

function formatRemaining(ms: number): string {
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / (60 * 60 * 1000));
  const minutes = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
  const body = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  return ms >= 0 ? `zostáva ${body}` : `po termíne o ${body}`;
}

const SLA_CLASSES: Record<"green" | "amber" | "red", string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { data: contracts, isLoading } = trpc.admin.allContracts.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const [tab, setTab] = useState<FilterTab>("review");

  // Live clock for the SLA countdowns, ticks every 30 seconds.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingReview = useMemo(() => {
    const list = contracts?.filter((c) => c.status === "in_review") || [];
    // Queue order: express contracts first, then oldest first.
    return [...list].sort((a, b) => {
      if (a.expressAddon !== b.expressAddon) return b.expressAddon - a.expressAddon;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [contracts]);

  const analyzing = useMemo(
    () => contracts?.filter((c) => c.status === "analyzing" || c.status === "pending") || [],
    [contracts]
  );
  const completed = useMemo(
    () => contracts?.filter((c) => c.status === "completed") || [],
    [contracts]
  );
  // Defensive: the status enum today has no error value; anything unknown
  // (e.g. a future "failed" status) lands in the error tab.
  const errored = useMemo(
    () => contracts?.filter((c) => !KNOWN_STATUSES.includes(c.status)) || [],
    [contracts]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-xl mb-2">Prístup zamietnutý</h2>
            <p className="text-muted-foreground font-sans">Táto sekcia je dostupná len pre administrátorov.</p>
          </div>
        </main>
      </div>
    );
  }

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "review", label: "Na overenie", count: pendingReview.length },
    { id: "analyzing", label: "Analyzuje sa", count: analyzing.length },
    { id: "done", label: "Hotové", count: completed.length },
    { id: "error", label: "Chyba", count: errored.length },
    { id: "all", label: "Všetky", count: contracts?.length || 0 },
  ];

  const visibleContracts =
    tab === "review"
      ? pendingReview
      : tab === "analyzing"
        ? analyzing
        : tab === "done"
          ? completed
          : tab === "error"
            ? errored
            : contracts || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <h1 className="text-3xl font-serif mb-2">Admin panel</h1>
          <p className="text-muted-foreground font-sans mb-8">Prehľad a kontrola všetkých zmlúv</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif">{contracts?.length || 0}</p>
                <p className="text-xs text-muted-foreground font-sans">Celkom</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif text-amber-600">{pendingReview.length}</p>
                <p className="text-xs text-amber-600 font-sans">Na overenie</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif text-blue-600">{analyzing.length}</p>
                <p className="text-xs text-blue-600 font-sans">Analyzuje sa</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-serif text-green-600">{completed.length}</p>
                <p className="text-xs text-green-600 font-sans">Hotové</p>
              </CardContent>
            </Card>
          </div>

          {/* Priority queue: express first, then oldest, with SLA countdown */}
          {pendingReview.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Čakajú na overenie ({pendingReview.length})
              </h2>
              <div className="space-y-3">
                {pendingReview.map((contract) => {
                  const sla = slaFor(contract, now);
                  return (
                    <Card key={contract.id} className="border-amber-200 hover:shadow-sm transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-4 min-w-0">
                            <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="font-sans font-medium truncate">{contract.fileName}</p>
                                {contract.expressAddon === 1 && (
                                  <Badge className="bg-red-600 text-white font-sans text-[10px] shrink-0">
                                    <Zap className="h-3 w-3 mr-0.5" /> Expres
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-sans">
                                {new Date(contract.createdAt).toLocaleDateString("sk-SK")} · Plán: {contract.plan}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-xs font-sans font-medium border rounded-full px-2.5 py-1 ${SLA_CLASSES[sla.state]}`}
                              title={contract.expressAddon === 1 ? "SLA 4 hodiny" : "SLA 24 hodín"}
                            >
                              {formatRemaining(sla.remaining)}
                            </span>
                            <Link href={`/admin/review/${contract.id}`}>
                              <Button size="sm" className="font-sans">
                                <Eye className="mr-1 h-4 w-4" /> Skontrolovať
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mb-4 border-b overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-sm font-sans whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : visibleContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans py-8 text-center">
              V tejto kategórii nie sú žiadne zmluvy.
            </p>
          ) : (
            <div className="space-y-2">
              {visibleContracts.map((contract) => {
                const status = STATUS_MAP[contract.status] || STATUS_MAP.failed;
                return (
                  <Card key={contract.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-sans text-sm truncate">{contract.fileName}</span>
                          {contract.expressAddon === 1 && (
                            <Badge variant="outline" className="font-sans text-[10px] border-red-200 text-red-600 shrink-0">
                              Expres
                            </Badge>
                          )}
                          <Badge variant={status.variant} className="font-sans text-xs shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground font-sans">
                            {new Date(contract.createdAt).toLocaleDateString("sk-SK")}
                          </span>
                          <Link href={`/admin/review/${contract.id}`}>
                            <Button variant="ghost" size="sm" className="font-sans text-xs">Otvoriť</Button>
                          </Link>
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
