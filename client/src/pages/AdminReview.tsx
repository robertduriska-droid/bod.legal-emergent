import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle, PenLine, Shield, MessageCircle } from "lucide-react";
import { useState } from "react";
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
    backToAdmin: "Späť na admin",
    plan: "Plán",
    status: "Status",
    notFound: "Zmluva nenájdená",
    startReview: "Začať kontrolu",
    signing: "Podpisujem...",
    signReport: "Podpísať report",
    signConfirm: "Naozaj chcete podpísať tento report? Zmluva bude označená ako dokončená.",
    aiSummary: "Zhrnutie AI analýzy",
    recommendation: "Odporúčanie:",
    signed: "Podpísané:",
    clausesForReview: "Klauzuly na kontrolu",
    aiSuggestedEdit: "AI navrhovaná úprava:",
    yourNote: "Vaša poznámka:",
    commentsAndReplies: "Komentáre a odpovede",
    lawyerBadge: "Advokát",
    replyPlaceholder: "Odpovedať klientovi...",
    annotationPlaceholder: "Pridajte poznámku k tejto klauzule...",
    save: "Uložiť",
    cancel: "Zrušiť",
    editNote: "Upraviť poznámku",
    addNote: "Pridať poznámku",
    annotationSaved: "Anotácia uložená",
    reviewStarted: "Zmluva označená ako v kontrole",
    reportSigned: "Report podpísaný a zmluva dokončená!",
    replySent: "Odpoveď odoslaná",
    replyFailed: "Nepodarilo sa odoslať odpoveď",
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
    signConfirm: "Are you sure you want to sign this report? The contract will be marked as completed.",
    aiSummary: "AI Analysis Summary",
    recommendation: "Recommendation:",
    signed: "Signed:",
    clausesForReview: "Clauses for review",
    aiSuggestedEdit: "AI suggested amendment:",
    yourNote: "Your note:",
    commentsAndReplies: "Comments and replies",
    lawyerBadge: "Lawyer",
    replyPlaceholder: "Reply to client...",
    annotationPlaceholder: "Add a note to this clause...",
    save: "Save",
    cancel: "Cancel",
    editNote: "Edit note",
    addNote: "Add note",
    annotationSaved: "Annotation saved",
    reviewStarted: "Contract marked as in review",
    reportSigned: "Report signed and contract completed!",
    replySent: "Reply sent",
    replyFailed: "Failed to send reply",
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
    signConfirm: "Opravdu chcete podepsat tento report? Smlouva bude označena jako dokončená.",
    aiSummary: "Shrnutí AI analýzy",
    recommendation: "Doporučení:",
    signed: "Podepsáno:",
    clausesForReview: "Klauzule ke kontrole",
    aiSuggestedEdit: "AI navrhovaná úprava:",
    yourNote: "Vaše poznámka:",
    commentsAndReplies: "Komentáře a odpovědi",
    lawyerBadge: "Advokát",
    replyPlaceholder: "Odpovědět klientovi...",
    annotationPlaceholder: "Přidejte poznámku k této klauzuli...",
    save: "Uložit",
    cancel: "Zrušit",
    editNote: "Upravit poznámku",
    addNote: "Přidat poznámku",
    annotationSaved: "Anotace uložena",
    reviewStarted: "Smlouva označena jako v kontrole",
    reportSigned: "Report podepsán a smlouva dokončena!",
    replySent: "Odpověď odeslána",
    replyFailed: "Nepodařilo se odeslat odpověď",
    dateLocale: "cs-CZ",
  },
};

export default function AdminReview() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { locale } = useT();
  const tx = TX[locale];
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
      toast.success(tx.annotationSaved);
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

  const [annotations, setAnnotations] = useState<Record<number, string>>({});
  const [editingClause, setEditingClause] = useState<number | null>(null);

  // Load user comments for this contract
  const { data: commentsData } = trpc.comments.getByContract.useQuery(
    { contractId },
    { enabled: user?.role === "admin" && contractId > 0 }
  );

  // Lawyer reply mutation
  const addReplyMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      utils.comments.getByContract.invalidate({ contractId });
      toast.success(tx.replySent);
    },
    onError: () => {
      toast.error(tx.replyFailed);
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
          <p className="text-muted-foreground font-sans">{tx.notFound}</p>
        </main>
      </div>
    );
  }

  const { contract, clauses, report } = data;

  const handleAnnotate = (clauseId: number) => {
    const annotation = annotations[clauseId];
    if (!annotation?.trim()) return;
    annotateMutation.mutate({
      clauseId,
      lawyerAnnotation: annotation,
      lawyerApproved: 1,
    });
    setEditingClause(null);
  };

  const handleOverrideRisk = (clauseId: number, newLevel: "high" | "medium" | "low") => {
    annotateMutation.mutate({
      clauseId,
      overriddenRiskLevel: newLevel,
      lawyerApproved: 1,
    });
  };

  const handleSign = () => {
    if (!confirm(tx.signConfirm)) return;
    signMutation.mutate({ contractId });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="font-sans mb-4">
              <ArrowLeft className="mr-1 h-4 w-4" /> {tx.backToAdmin}
            </Button>
          </Link>

          {/* Contract Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif mb-1">{contract.fileName}</h1>
              <p className="text-sm text-muted-foreground font-sans">
                {tx.plan}: {contract.plan} · {tx.status}: {contract.status} · {new Date(contract.createdAt).toLocaleDateString(tx.dateLocale)}
              </p>
            </div>
            <div className="flex gap-2">
              {contract.status === "pending" || contract.status === "analyzing" ? (
                <Button variant="outline" className="font-sans" onClick={() => startReviewMutation.mutate({ contractId })}>
                  {tx.startReview}
                </Button>
              ) : null}
              {(contract.status === "in_review") && (
                <Button className="font-sans" onClick={handleSign} disabled={signMutation.isPending}>
                  <Shield className="mr-1 h-4 w-4" />
                  {signMutation.isPending ? tx.signing : tx.signReport}
                </Button>
              )}
            </div>
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
                    <span className="text-sm font-sans">{tx.signed} {report.lawyerName} ({report.signedAt ? new Date(report.signedAt).toLocaleDateString(tx.dateLocale) : ""})</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clauses for Review */}
          {clauses && clauses.length > 0 && (
            <div>
              <h2 className="text-xl font-serif mb-4">{tx.clausesForReview} ({clauses.length})</h2>
              <div className="space-y-4">
                {clauses.map((clause) => {
                  const effectiveRisk = clause.overriddenRiskLevel || clause.riskLevel;
                  return (
                    <Card key={clause.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-sans">#{clause.clauseNumber}</span>
                            <h4 className="font-sans font-medium">{clause.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Risk override buttons */}
                            <div className="flex gap-1">
                              {(["high", "medium", "low"] as const).map((level) => (
                                <button
                                  key={level}
                                  className={`px-2 py-0.5 rounded text-xs font-sans border ${
                                    effectiveRisk === level ? RISK_COLORS[level] : "border-border text-muted-foreground hover:border-primary/30"
                                  }`}
                                  onClick={() => handleOverrideRisk(clause.id, level)}
                                >
                                  {tx.riskLabels[level]}
                                </button>
                              ))}
                            </div>
                            {clause.lawyerApproved === 1 && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>

                        {clause.excerpt && (
                          <p className="text-sm text-muted-foreground font-sans mb-2 italic">"{clause.excerpt}"</p>
                        )}
                        <p className="text-sm font-sans mb-2">{clause.finding}</p>

                        {clause.suggestedEdit && (
                          <div className="bg-primary/5 rounded p-3 mt-2">
                            <p className="text-xs font-sans font-medium text-primary mb-1">{tx.aiSuggestedEdit}</p>
                            <p className="text-sm font-sans">{clause.suggestedEdit}</p>
                          </div>
                        )}

                        {/* Lawyer annotation */}
                        {clause.lawyerAnnotation && editingClause !== clause.id && (
                          <div className="bg-amber-50 rounded p-3 mt-2 border border-amber-200">
                            <p className="text-xs font-sans font-medium text-amber-800 mb-1">{tx.yourNote}</p>
                            <p className="text-sm font-sans">{clause.lawyerAnnotation}</p>
                          </div>
                        )}

                        {/* User comments with lawyer reply thread */}
                        {(() => {
                          const clauseComments = commentsData?.filter((c: any) => c.clauseId === clause.id) || [];
                          if (clauseComments.length === 0) return null;
                          // Separate top-level comments and replies
                          const topLevel = clauseComments.filter((c: any) => !c.parentId);
                          const replies = clauseComments.filter((c: any) => c.parentId);
                          return (
                            <div className="bg-blue-50/50 rounded p-3 mt-2 border border-blue-200">
                              <p className="text-xs font-sans font-medium text-blue-800 mb-2 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> {tx.commentsAndReplies} ({clauseComments.length})
                              </p>
                              <div className="space-y-2">
                                {topLevel.map((comment: any) => {
                                  const commentReplies = replies.filter((r: any) => r.parentId === comment.id);
                                  return (
                                    <div key={comment.id}>
                                      <div className={`rounded p-2 border ${comment.isLawyer ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white/60 border-blue-100'}`}>
                                        <div className="flex items-center justify-between mb-0.5">
                                          <span className="text-[11px] font-sans font-medium text-blue-900 flex items-center gap-1">
                                            {comment.userName}
                                            {comment.isLawyer ? <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-emerald-300 text-emerald-700">{tx.lawyerBadge}</Badge> : null}
                                          </span>
                                          <span className="text-[10px] font-sans text-blue-600">
                                            {new Date(comment.createdAt).toLocaleString(tx.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <p className="text-sm font-sans text-blue-900/80">{comment.content}</p>
                                      </div>
                                      {/* Replies */}
                                      {commentReplies.length > 0 && (
                                        <div className="ml-4 mt-1 space-y-1">
                                          {commentReplies.map((reply: any) => (
                                            <div key={reply.id} className={`rounded p-2 border ${reply.isLawyer ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white/60 border-blue-100'}`}>
                                              <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[11px] font-sans font-medium text-blue-900 flex items-center gap-1">
                                                  {reply.userName}
                                                  {reply.isLawyer ? <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-emerald-300 text-emerald-700">{tx.lawyerBadge}</Badge> : null}
                                                </span>
                                                <span className="text-[10px] font-sans text-blue-600">
                                                  {new Date(reply.createdAt).toLocaleString(tx.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              </div>
                                              <p className="text-sm font-sans text-blue-900/80">{reply.content}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {/* Reply input for lawyer */}
                                      <div className="ml-4 mt-1">
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            placeholder={tx.replyPlaceholder}
                                            className="flex-1 text-xs font-sans border rounded px-2 py-1.5 bg-white"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                addReplyMutation.mutate({
                                                  contractId,
                                                  clauseId: clause.id,
                                                  content: val,
                                                  parentId: comment.id,
                                                });
                                                (e.target as HTMLInputElement).value = '';
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Annotation editor */}
                        {editingClause === clause.id ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder={tx.annotationPlaceholder}
                              value={annotations[clause.id] || clause.lawyerAnnotation || ""}
                              onChange={(e) => setAnnotations({ ...annotations, [clause.id]: e.target.value })}
                              className="font-sans text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="font-sans" onClick={() => handleAnnotate(clause.id)}>
                                {tx.save}
                              </Button>
                              <Button size="sm" variant="ghost" className="font-sans" onClick={() => setEditingClause(null)}>
                                {tx.cancel}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-sans mt-2 text-xs"
                            onClick={() => {
                              setAnnotations({ ...annotations, [clause.id]: clause.lawyerAnnotation || "" });
                              setEditingClause(clause.id);
                            }}
                          >
                            <PenLine className="mr-1 h-3 w-3" />
                            {clause.lawyerAnnotation ? tx.editNote : tx.addNote}
                          </Button>
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
