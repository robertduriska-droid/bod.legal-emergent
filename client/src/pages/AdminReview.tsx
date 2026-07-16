import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  PenLine,
  Shield,
  MessageCircle,
  XCircle,
  FileText,
  Circle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/i18n";

const RISK_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

/**
 * Stable prefix stored in lawyerAnnotation to mark a finding the lawyer
 * excluded from the report. There is no dedicated "excluded" column or
 * mutation on the server (routers.ts is owned by WP1), so exclusion maps
 * onto the existing annotateClause procedure as:
 *   lawyerApproved: 0 + lawyerAnnotation starting with this prefix.
 * TODO(WP1/server): add a dedicated `excluded` field on clauses plus a
 * mutation to persist edited finding/suggestedEdit text directly.
 */
const EXCLUDED_PREFIX = "Vyradené advokátom";

type Resolution = "pending" | "confirmed" | "excluded";

const TX = {
  sk: {
    riskLabels: { high: "Vysoké", medium: "Stredné", low: "Nízke" } as Record<string, string>,
    backToAdmin: "Späť na admin",
    plan: "Plán",
    status: "Status",
    notFound: "Zmluva nenájdená",
    startReview: "Začať kontrolu",
    signing: "Podpisujem...",
    signReport: "Podpísať report",
    signDialogTitle: "Podpísať report",
    signDialogBody:
      "Podpisom potvrdzujete, že ste overili všetky nálezy v tomto reporte. Za obsah podpísaného reportu preberá zodpovednosť advokát. Zmluva bude označená ako dokončená a klient dostane oznámenie.",
    signDialogConfirm: "Podpísať a dokončiť",
    signDialogCancel: "Zrušiť",
    signBlockedHint: "Podpísať môžete až po overení všetkých nálezov.",
    aiSummary: "Zhrnutie AI analýzy",
    recommendation: "Odporúčanie:",
    signed: "Podpísané:",
    clausesForReview: "Nálezy na overenie",
    verified: "Overené",
    of: "z",
    allVerified: "Všetky nálezy sú overené. Report môžete podpísať.",
    shortcuts: "Klávesy: j a k pohyb, a potvrdiť, e upraviť, v vyradiť",
    originalClause: "Pôvodné znenie zmluvy",
    noExcerpt: "Bez výňatku zo zmluvy",
    aiFinding: "Nález AI",
    aiSuggestedEdit: "AI navrhovaná úprava:",
    legalBasis: "Právny základ:",
    confirm: "Potvrdiť",
    edit: "Upraviť",
    exclude: "Vyradiť",
    stateConfirmed: "Potvrdené",
    stateExcluded: "Vyradené",
    statePending: "Čaká na overenie",
    editFindingLabel: "Overené znenie nálezu",
    editSuggestionLabel: "Overený návrh úpravy",
    editNoteLabel: "Poznámka pre klienta (voliteľné)",
    editedFindingPrefix: "Overený nález:",
    editedSuggestionPrefix: "Overený návrh úpravy:",
    editedNotePrefix: "Poznámka:",
    excludedStored: "Vyradené advokátom, nález sa do reportu nezaradí.",
    yourNote: "Vaša poznámka:",
    commentsAndReplies: "Komentáre a odpovede",
    lawyerBadge: "Advokát",
    replyPlaceholder: "Odpovedať klientovi...",
    save: "Uložiť",
    cancel: "Zrušiť",
    annotationSaved: "Uložené",
    actionFailed: "Akciu sa nepodarilo uložiť",
    reviewStarted: "Zmluva označená ako v kontrole",
    reportSigned: "Report podpísaný a zmluva dokončená!",
    replySent: "Odpoveď odoslaná",
    replyFailed: "Nepodarilo sa odoslať odpoveď",
    noClauses: "AI analýza zatiaľ nevrátila žiadne nálezy.",
    dateLocale: "sk-SK",
  },
  en: {
    riskLabels: { high: "High", medium: "Medium", low: "Low" } as Record<string, string>,
    backToAdmin: "Back to admin",
    plan: "Plan",
    status: "Status",
    notFound: "Contract not found",
    startReview: "Start review",
    signing: "Signing...",
    signReport: "Sign report",
    signDialogTitle: "Sign report",
    signDialogBody:
      "By signing you confirm that you have verified every finding in this report. The lawyer takes responsibility for the signed content. The contract will be marked as completed and the client will be notified.",
    signDialogConfirm: "Sign and complete",
    signDialogCancel: "Cancel",
    signBlockedHint: "You can sign only after all findings are verified.",
    aiSummary: "AI Analysis Summary",
    recommendation: "Recommendation:",
    signed: "Signed:",
    clausesForReview: "Findings to verify",
    verified: "Verified",
    of: "of",
    allVerified: "All findings are verified. You can sign the report.",
    shortcuts: "Keys: j and k move, a confirm, e edit, v exclude",
    originalClause: "Original contract wording",
    noExcerpt: "No excerpt from the contract",
    aiFinding: "AI finding",
    aiSuggestedEdit: "AI suggested amendment:",
    legalBasis: "Legal basis:",
    confirm: "Confirm",
    edit: "Edit",
    exclude: "Exclude",
    stateConfirmed: "Confirmed",
    stateExcluded: "Excluded",
    statePending: "Awaiting verification",
    editFindingLabel: "Verified finding text",
    editSuggestionLabel: "Verified suggested wording",
    editNoteLabel: "Note for the client (optional)",
    editedFindingPrefix: "Overený nález:",
    editedSuggestionPrefix: "Overený návrh úpravy:",
    editedNotePrefix: "Poznámka:",
    excludedStored: "Vyradené advokátom, nález sa do reportu nezaradí.",
    yourNote: "Your note:",
    commentsAndReplies: "Comments and replies",
    lawyerBadge: "Lawyer",
    replyPlaceholder: "Reply to client...",
    save: "Save",
    cancel: "Cancel",
    annotationSaved: "Saved",
    actionFailed: "Failed to save the action",
    reviewStarted: "Contract marked as in review",
    reportSigned: "Report signed and contract completed!",
    replySent: "Reply sent",
    replyFailed: "Failed to send reply",
    noClauses: "AI analysis has not returned any findings yet.",
    dateLocale: "en-GB",
  },
  cz: {
    riskLabels: { high: "Vysoké", medium: "Střední", low: "Nízké" } as Record<string, string>,
    backToAdmin: "Zpět na admin",
    plan: "Plán",
    status: "Status",
    notFound: "Smlouva nenalezena",
    startReview: "Zahájit kontrolu",
    signing: "Podepisuji...",
    signReport: "Podepsat report",
    signDialogTitle: "Podepsat report",
    signDialogBody:
      "Podpisem potvrzujete, že jste ověřili všechny nálezy v tomto reportu. Za obsah podepsaného reportu přebírá odpovědnost advokát. Smlouva bude označena jako dokončená a klient dostane oznámení.",
    signDialogConfirm: "Podepsat a dokončit",
    signDialogCancel: "Zrušit",
    signBlockedHint: "Podepsat můžete až po ověření všech nálezů.",
    aiSummary: "Shrnutí AI analýzy",
    recommendation: "Doporučení:",
    signed: "Podepsáno:",
    clausesForReview: "Nálezy k ověření",
    verified: "Ověřeno",
    of: "z",
    allVerified: "Všechny nálezy jsou ověřeny. Report můžete podepsat.",
    shortcuts: "Klávesy: j a k pohyb, a potvrdit, e upravit, v vyřadit",
    originalClause: "Původní znění smlouvy",
    noExcerpt: "Bez výňatku ze smlouvy",
    aiFinding: "Nález AI",
    aiSuggestedEdit: "AI navrhovaná úprava:",
    legalBasis: "Právní základ:",
    confirm: "Potvrdit",
    edit: "Upravit",
    exclude: "Vyřadit",
    stateConfirmed: "Potvrzeno",
    stateExcluded: "Vyřazeno",
    statePending: "Čeká na ověření",
    editFindingLabel: "Ověřené znění nálezu",
    editSuggestionLabel: "Ověřený návrh úpravy",
    editNoteLabel: "Poznámka pro klienta (volitelné)",
    editedFindingPrefix: "Overený nález:",
    editedSuggestionPrefix: "Overený návrh úpravy:",
    editedNotePrefix: "Poznámka:",
    excludedStored: "Vyradené advokátom, nález sa do reportu nezaradí.",
    yourNote: "Vaše poznámka:",
    commentsAndReplies: "Komentáře a odpovědi",
    lawyerBadge: "Advokát",
    replyPlaceholder: "Odpovědět klientovi...",
    save: "Uložit",
    cancel: "Zrušit",
    annotationSaved: "Uloženo",
    actionFailed: "Akci se nepodařilo uložit",
    reviewStarted: "Smlouva označena jako v kontrole",
    reportSigned: "Report podepsán a smlouva dokončena!",
    replySent: "Odpověď odeslána",
    replyFailed: "Nepodařilo se odeslat odpověď",
    noClauses: "AI analýza zatím nevrátila žádné nálezy.",
    dateLocale: "cs-CZ",
  },
};

export default function AdminReview() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { locale } = useT();
  const tx = TX[locale === "hu" ? "en" : locale];
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const contractId = parseInt(params.id || "0");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getContractForReview.useQuery(
    { id: contractId },
    { enabled: user?.role === "admin" && contractId > 0 }
  );

  const annotateMutation = trpc.admin.annotateClause.useMutation({
    onSuccess: () => {
      utils.admin.getContractForReview.invalidate({ id: contractId });
    },
    onError: () => {
      toast.error(tx.actionFailed);
    },
  });

  const startReviewMutation = trpc.admin.startReview.useMutation({
    onSuccess: () => {
      utils.admin.getContractForReview.invalidate({ id: contractId });
      toast.success(tx.reviewStarted);
    },
  });

  const signMutation = trpc.admin.signReport.useMutation({
    onSuccess: () => {
      toast.success(tx.reportSigned);
      navigate("/admin");
    },
  });

  // Optimistic per-finding resolution so the keyboard flow never waits for
  // the server round trip. Server state (lawyerApproved / annotation marker)
  // wins after refetch and matches what was written.
  const [localResolution, setLocalResolution] = useState<Record<number, Resolution>>({});
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editingClause, setEditingClause] = useState<number | null>(null);
  const [editFinding, setEditFinding] = useState("");
  const [editSuggestion, setEditSuggestion] = useState("");
  const [editNote, setEditNote] = useState("");
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Load user comments for this contract
  const { data: commentsData } = trpc.comments.getByContract.useQuery(
    { contractId },
    { enabled: user?.role === "admin" && contractId > 0 }
  );

  const addReplyMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      utils.comments.getByContract.invalidate({ contractId });
      toast.success(tx.replySent);
    },
    onError: () => {
      toast.error(tx.replyFailed);
    },
  });

  const clauses = data?.clauses;

  const resolutionOf = useMemo(() => {
    return (clause: { id: number; lawyerApproved: number | null; lawyerAnnotation: string | null }): Resolution => {
      const local = localResolution[clause.id];
      if (local) return local;
      if (clause.lawyerApproved === 1) return "confirmed";
      if (clause.lawyerAnnotation && clause.lawyerAnnotation.startsWith(EXCLUDED_PREFIX)) return "excluded";
      return "pending";
    };
  }, [localResolution]);

  const totalCount = clauses?.length ?? 0;
  const resolvedCount = clauses ? clauses.filter((c) => resolutionOf(c) !== "pending").length : 0;
  const allResolved = totalCount === 0 || resolvedCount === totalCount;

  const confirmClause = (clauseId: number, currentAnnotation: string | null) => {
    setLocalResolution((prev) => ({ ...prev, [clauseId]: "confirmed" }));
    annotateMutation.mutate(
      {
        clauseId,
        lawyerApproved: 1,
        // Clear a previous exclusion marker so the state is unambiguous.
        ...(currentAnnotation && currentAnnotation.startsWith(EXCLUDED_PREFIX)
          ? { lawyerAnnotation: "" }
          : {}),
      },
      {
        onError: () => {
          setLocalResolution((prev) => {
            const next = { ...prev };
            delete next[clauseId];
            return next;
          });
        },
      }
    );
  };

  const excludeClause = (clauseId: number) => {
    setLocalResolution((prev) => ({ ...prev, [clauseId]: "excluded" }));
    annotateMutation.mutate(
      {
        clauseId,
        lawyerApproved: 0,
        lawyerAnnotation: tx.excludedStored,
      },
      {
        onError: () => {
          setLocalResolution((prev) => {
            const next = { ...prev };
            delete next[clauseId];
            return next;
          });
        },
      }
    );
  };

  const openEditor = (clause: { id: number; finding: string; suggestedEdit: string | null; lawyerAnnotation: string | null }) => {
    setEditFinding(clause.finding || "");
    setEditSuggestion(clause.suggestedEdit || "");
    setEditNote(
      clause.lawyerAnnotation && !clause.lawyerAnnotation.startsWith(EXCLUDED_PREFIX)
        ? clause.lawyerAnnotation
        : ""
    );
    setEditingClause(clause.id);
  };

  const saveEdit = (clause: { id: number; finding: string; suggestedEdit: string | null }) => {
    // There is no server mutation to overwrite clause.finding/suggestedEdit
    // (routers.ts is owned by WP1). The lawyer's verified wording is stored
    // in lawyerAnnotation in a readable structure and the finding is marked
    // approved. TODO(WP1/server): dedicated updateClauseText mutation.
    const parts: string[] = [];
    if (editFinding.trim() && editFinding.trim() !== (clause.finding || "").trim()) {
      parts.push(`${tx.editedFindingPrefix} ${editFinding.trim()}`);
    }
    if (editSuggestion.trim() && editSuggestion.trim() !== (clause.suggestedEdit || "").trim()) {
      parts.push(`${tx.editedSuggestionPrefix} ${editSuggestion.trim()}`);
    }
    if (editNote.trim()) {
      parts.push(`${tx.editedNotePrefix} ${editNote.trim()}`);
    }
    setLocalResolution((prev) => ({ ...prev, [clause.id]: "confirmed" }));
    annotateMutation.mutate(
      {
        clauseId: clause.id,
        lawyerApproved: 1,
        lawyerAnnotation: parts.length > 0 ? parts.join("\n") : "",
      },
      {
        onSuccess: () => toast.success(tx.annotationSaved),
        onError: () => {
          setLocalResolution((prev) => {
            const next = { ...prev };
            delete next[clause.id];
            return next;
          });
        },
      }
    );
    setEditingClause(null);
  };

  // Keyboard shortcuts: j/k move, a confirm, e edit, v exclude.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!clauses || clauses.length === 0) return;
      if (signDialogOpen) return;

      if (e.key === "j") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, clauses.length - 1));
      } else if (e.key === "k") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (editingClause === null) {
        const clause = clauses[Math.min(selectedIdx, clauses.length - 1)];
        if (!clause) return;
        if (e.key === "a") {
          e.preventDefault();
          confirmClause(clause.id, clause.lawyerAnnotation);
        } else if (e.key === "e") {
          e.preventDefault();
          openEditor(clause);
        } else if (e.key === "v" || e.key === "x") {
          e.preventDefault();
          excludeClause(clause.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clauses, selectedIdx, editingClause, signDialogOpen, locale]);

  // Keep the selected row in view while navigating with j/k.
  useEffect(() => {
    if (!clauses || clauses.length === 0) return;
    const clause = clauses[Math.min(selectedIdx, clauses.length - 1)];
    if (!clause) return;
    const el = rowRefs.current[clause.id];
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selectedIdx, clauses]);

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
          <p className="text-muted-foreground font-sans">{tx.notFound}</p>
        </main>
      </div>
    );
  }

  const { contract, report } = data;

  const handleOverrideRisk = (clauseId: number, newLevel: "high" | "medium" | "low") => {
    annotateMutation.mutate({
      clauseId,
      overriddenRiskLevel: newLevel,
    });
  };

  const progressPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Sticky review progress header (below the sticky site header, h-16) */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-6xl py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium truncate">
                  {tx.verified} {resolvedCount} {tx.of} {totalCount}
                </p>
                <div className="h-1.5 w-44 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <p className="hidden lg:block text-[11px] text-muted-foreground font-sans">
                {tx.shortcuts}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(contract.status === "pending" || contract.status === "analyzing") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-sans"
                  onClick={() => startReviewMutation.mutate({ contractId })}
                  disabled={startReviewMutation.isPending}
                >
                  {tx.startReview}
                </Button>
              )}
              {contract.status === "in_review" && (
                <div className="flex flex-col items-end gap-0.5">
                  <Button
                    size="sm"
                    className="font-sans"
                    onClick={() => setSignDialogOpen(true)}
                    disabled={!allResolved || signMutation.isPending}
                  >
                    <Shield className="mr-1 h-4 w-4" />
                    {signMutation.isPending ? tx.signing : tx.signReport}
                  </Button>
                  {!allResolved && (
                    <p className="text-[11px] text-amber-700 font-sans">{tx.signBlockedHint}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sign confirmation dialog: the lawyer explicitly accepts responsibility */}
      <AlertDialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">{tx.signDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {tx.signDialogBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans">{tx.signDialogCancel}</AlertDialogCancel>
            <AlertDialogAction
              className="font-sans"
              onClick={() => signMutation.mutate({ contractId })}
            >
              {tx.signDialogConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 py-8">
        <div className="container max-w-6xl">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="font-sans mb-4">
              <ArrowLeft className="mr-1 h-4 w-4" /> {tx.backToAdmin}
            </Button>
          </Link>

          {/* Contract Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-serif mb-1 break-words">{contract.fileName}</h1>
            <p className="text-sm text-muted-foreground font-sans">
              {tx.plan}: {contract.plan} · {tx.status}: {contract.status} ·{" "}
              {new Date(contract.createdAt).toLocaleDateString(tx.dateLocale)}
            </p>
          </div>

          {/* Report Summary */}
          {report && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-lg mb-3">{tx.aiSummary}</h2>
                <p className="text-sm font-sans mb-4">{report.summary}</p>
                {report.recommendation && (
                  <div className="bg-primary/5 rounded p-4">
                    <p className="text-xs font-sans font-medium text-primary mb-1">{tx.recommendation}</p>
                    <p className="text-sm font-sans">{report.recommendation}</p>
                  </div>
                )}
                {report.isSigned === 1 && (
                  <div className="mt-4 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-sans">
                      {tx.signed} {report.lawyerName}{" "}
                      ({report.signedAt ? new Date(report.signedAt).toLocaleDateString(tx.dateLocale) : ""})
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Findings for review, one row per finding */}
          <h2 className="text-xl font-serif mb-4">
            {tx.clausesForReview} ({totalCount})
          </h2>
          {allResolved && totalCount > 0 && contract.status === "in_review" && (
            <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded p-3">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-sans">{tx.allVerified}</p>
            </div>
          )}
          {(!clauses || clauses.length === 0) && (
            <p className="text-sm text-muted-foreground font-sans">{tx.noClauses}</p>
          )}

          <div className="space-y-4">
            {clauses?.map((clause, idx) => {
              const effectiveRisk = clause.overriddenRiskLevel || clause.riskLevel;
              const resolution = resolutionOf(clause);
              const isSelected = idx === Math.min(selectedIdx, (clauses?.length ?? 1) - 1);
              const clauseComments = commentsData?.filter((c: any) => c.clauseId === clause.id) || [];
              const topLevel = clauseComments.filter((c: any) => !c.parentId);
              const replies = clauseComments.filter((c: any) => c.parentId);

              return (
                <div
                  key={clause.id}
                  ref={(el) => {
                    rowRefs.current[clause.id] = el;
                  }}
                >
                  <Card
                    className={`transition-shadow ${isSelected ? "ring-2 ring-primary/60 shadow-sm" : ""} ${
                      resolution === "excluded" ? "opacity-70" : ""
                    }`}
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <CardContent className="p-5">
                      {/* Row header: number, title, risk, state */}
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground font-sans shrink-0">
                            #{clause.clauseNumber}
                          </span>
                          <h4 className="font-sans font-medium break-words">{clause.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex gap-1">
                            {(["high", "medium", "low"] as const).map((level) => (
                              <button
                                key={level}
                                className={`px-2 py-0.5 rounded text-xs font-sans border ${
                                  effectiveRisk === level
                                    ? RISK_COLORS[level]
                                    : "border-border text-muted-foreground hover:border-primary/30"
                                }`}
                                onClick={() => handleOverrideRisk(clause.id, level)}
                              >
                                {tx.riskLabels[level]}
                              </button>
                            ))}
                          </div>
                          {resolution === "confirmed" && (
                            <Badge className="bg-green-100 text-green-800 border border-green-200 font-sans" variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {tx.stateConfirmed}
                            </Badge>
                          )}
                          {resolution === "excluded" && (
                            <Badge className="bg-gray-100 text-gray-600 border border-gray-200 font-sans" variant="outline">
                              <XCircle className="h-3 w-3 mr-1" />
                              {tx.stateExcluded}
                            </Badge>
                          )}
                          {resolution === "pending" && (
                            <Badge className="bg-amber-50 text-amber-800 border border-amber-200 font-sans" variant="outline">
                              <Circle className="h-3 w-3 mr-1" />
                              {tx.statePending}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Two columns: original clause excerpt beside the AI finding */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/40 rounded p-3 border">
                          <p className="text-xs font-sans font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> {tx.originalClause}
                          </p>
                          {clause.excerpt ? (
                            <p className="text-sm font-sans italic whitespace-pre-wrap">"{clause.excerpt}"</p>
                          ) : (
                            <p className="text-sm font-sans text-muted-foreground">{tx.noExcerpt}</p>
                          )}
                          {clause.legalBasis && (
                            <p className="text-xs font-sans text-muted-foreground mt-2">
                              {tx.legalBasis}{" "}
                              {clause.legalSourceUrl ? (
                                <a
                                  href={clause.legalSourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {clause.legalBasis}
                                </a>
                              ) : (
                                clause.legalBasis
                              )}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-sans font-medium text-muted-foreground mb-1.5">
                            {tx.aiFinding}
                          </p>
                          <p className="text-sm font-sans mb-2 whitespace-pre-wrap">{clause.finding}</p>
                          {clause.suggestedEdit && (
                            <div className="bg-primary/5 rounded p-3">
                              <p className="text-xs font-sans font-medium text-primary mb-1">
                                {tx.aiSuggestedEdit}
                              </p>
                              <p className="text-sm font-sans whitespace-pre-wrap">{clause.suggestedEdit}</p>
                            </div>
                          )}
                          {clause.lawyerAnnotation &&
                            !clause.lawyerAnnotation.startsWith(EXCLUDED_PREFIX) &&
                            editingClause !== clause.id && (
                              <div className="bg-amber-50 rounded p-3 mt-2 border border-amber-200">
                                <p className="text-xs font-sans font-medium text-amber-800 mb-1">{tx.yourNote}</p>
                                <p className="text-sm font-sans whitespace-pre-wrap">{clause.lawyerAnnotation}</p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Inline editor */}
                      {editingClause === clause.id ? (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          <div>
                            <p className="text-xs font-sans font-medium mb-1">{tx.editFindingLabel}</p>
                            <Textarea
                              value={editFinding}
                              onChange={(e) => setEditFinding(e.target.value)}
                              className="font-sans text-sm"
                              rows={3}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-sans font-medium mb-1">{tx.editSuggestionLabel}</p>
                            <Textarea
                              value={editSuggestion}
                              onChange={(e) => setEditSuggestion(e.target.value)}
                              className="font-sans text-sm"
                              rows={3}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-sans font-medium mb-1">{tx.editNoteLabel}</p>
                            <Textarea
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              className="font-sans text-sm"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="font-sans" onClick={() => saveEdit(clause)}>
                              {tx.save}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="font-sans"
                              onClick={() => setEditingClause(null)}
                            >
                              {tx.cancel}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Per-finding actions: Potvrdiť / Upraviť / Vyradiť */
                        <div className="flex gap-2 mt-4 border-t pt-3">
                          <Button
                            size="sm"
                            variant={resolution === "confirmed" ? "default" : "outline"}
                            className="font-sans"
                            onClick={() => confirmClause(clause.id, clause.lawyerAnnotation)}
                          >
                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                            {tx.confirm}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-sans"
                            onClick={() => openEditor(clause)}
                          >
                            <PenLine className="mr-1 h-3.5 w-3.5" />
                            {tx.edit}
                          </Button>
                          <Button
                            size="sm"
                            variant={resolution === "excluded" ? "secondary" : "ghost"}
                            className="font-sans"
                            onClick={() => excludeClause(clause.id)}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            {tx.exclude}
                          </Button>
                        </div>
                      )}

                      {/* Client comments with lawyer reply thread */}
                      {clauseComments.length > 0 && (
                        <div className="bg-blue-50/50 rounded p-3 mt-3 border border-blue-200">
                          <p className="text-xs font-sans font-medium text-blue-800 mb-2 flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {tx.commentsAndReplies} ({clauseComments.length})
                          </p>
                          <div className="space-y-2">
                            {topLevel.map((comment: any) => {
                              const commentReplies = replies.filter((r: any) => r.parentId === comment.id);
                              return (
                                <div key={comment.id}>
                                  <div
                                    className={`rounded p-2 border ${
                                      comment.isLawyer
                                        ? "bg-emerald-50/60 border-emerald-200"
                                        : "bg-white/60 border-blue-100"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[11px] font-sans font-medium text-blue-900 flex items-center gap-1">
                                        {comment.userName}
                                        {comment.isLawyer ? (
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-1 py-0 h-4 border-emerald-300 text-emerald-700"
                                          >
                                            {tx.lawyerBadge}
                                          </Badge>
                                        ) : null}
                                      </span>
                                      <span className="text-[10px] font-sans text-blue-600">
                                        {new Date(comment.createdAt).toLocaleString(tx.dateLocale, {
                                          day: "numeric",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm font-sans text-blue-900/80">{comment.content}</p>
                                  </div>
                                  {commentReplies.length > 0 && (
                                    <div className="ml-4 mt-1 space-y-1">
                                      {commentReplies.map((reply: any) => (
                                        <div
                                          key={reply.id}
                                          className={`rounded p-2 border ${
                                            reply.isLawyer
                                              ? "bg-emerald-50/60 border-emerald-200"
                                              : "bg-white/60 border-blue-100"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[11px] font-sans font-medium text-blue-900 flex items-center gap-1">
                                              {reply.userName}
                                              {reply.isLawyer ? (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[9px] px-1 py-0 h-4 border-emerald-300 text-emerald-700"
                                                >
                                                  {tx.lawyerBadge}
                                                </Badge>
                                              ) : null}
                                            </span>
                                            <span className="text-[10px] font-sans text-blue-600">
                                              {new Date(reply.createdAt).toLocaleString(tx.dateLocale, {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-sm font-sans text-blue-900/80">{reply.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="ml-4 mt-1">
                                    <input
                                      type="text"
                                      placeholder={tx.replyPlaceholder}
                                      className="w-full text-xs font-sans border rounded px-2 py-1.5 bg-white"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                          const val = (e.target as HTMLInputElement).value.trim();
                                          addReplyMutation.mutate({
                                            contractId,
                                            clauseId: clause.id,
                                            content: val,
                                            parentId: comment.id,
                                          });
                                          (e.target as HTMLInputElement).value = "";
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
