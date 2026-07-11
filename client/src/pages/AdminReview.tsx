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

const RISK_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};
const RISK_LABELS = { high: "Vysoké", medium: "Stredné", low: "Nízke" };

export default function AdminReview() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
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
      toast.success("Anotácia uložená");
    },
  });

  const startReviewMutation = trpc.admin.startReview.useMutation({
    onSuccess: () => {
      utils.admin.getContractForReview.invalidate({ id: contractId });
      toast.success("Zmluva označená ako v kontrole");
    },
  });

  const signMutation = trpc.admin.signReport.useMutation({
    onSuccess: () => {
      toast.success("Report podpísaný a zmluva dokončená!");
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
          <p className="text-muted-foreground font-sans">Zmluva nenájdená</p>
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
    if (!confirm("Naozaj chcete podpísať tento report? Zmluva bude označená ako dokončená.")) return;
    signMutation.mutate({ contractId });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="font-sans mb-4">
              <ArrowLeft className="mr-1 h-4 w-4" /> Späť na admin
            </Button>
          </Link>

          {/* Contract Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif mb-1">{contract.fileName}</h1>
              <p className="text-sm text-muted-foreground font-sans">
                Plán: {contract.plan} · Status: {contract.status} · {new Date(contract.createdAt).toLocaleDateString("sk-SK")}
              </p>
            </div>
            <div className="flex gap-2">
              {contract.status === "pending" || contract.status === "analyzing" ? (
                <Button variant="outline" className="font-sans" onClick={() => startReviewMutation.mutate({ contractId })}>
                  Začať kontrolu
                </Button>
              ) : null}
              {(contract.status === "in_review") && (
                <Button className="font-sans" onClick={handleSign} disabled={signMutation.isPending}>
                  <Shield className="mr-1 h-4 w-4" />
                  {signMutation.isPending ? "Podpisujem..." : "Podpísať report"}
                </Button>
              )}
            </div>
          </div>

          {/* Report Summary */}
          {report && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-lg mb-3">Zhrnutie AI analýzy</h2>
                <p className="text-sm font-sans mb-4">{report.summary}</p>
                {report.recommendation && (
                  <div className="bg-primary/5 rounded p-4">
                    <p className="text-xs font-sans font-medium text-primary mb-1">Odporúčanie:</p>
                    <p className="text-sm font-sans">{report.recommendation}</p>
                  </div>
                )}
                {report.isSigned === 1 && (
                  <div className="mt-4 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-sans">Podpísané: {report.lawyerName} ({report.signedAt ? new Date(report.signedAt).toLocaleDateString("sk-SK") : ""})</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clauses for Review */}
          {clauses && clauses.length > 0 && (
            <div>
              <h2 className="text-xl font-serif mb-4">Klauzuly na kontrolu ({clauses.length})</h2>
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
                                  {RISK_LABELS[level]}
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
                            <p className="text-xs font-sans font-medium text-primary mb-1">AI navrhovaná úprava:</p>
                            <p className="text-sm font-sans">{clause.suggestedEdit}</p>
                          </div>
                        )}

                        {/* Lawyer annotation */}
                        {clause.lawyerAnnotation && editingClause !== clause.id && (
                          <div className="bg-amber-50 rounded p-3 mt-2 border border-amber-200">
                            <p className="text-xs font-sans font-medium text-amber-800 mb-1">Vaša poznámka:</p>
                            <p className="text-sm font-sans">{clause.lawyerAnnotation}</p>
                          </div>
                        )}

                        {/* User comments (read-only for lawyer) */}
                        {(() => {
                          const clauseComments = commentsData?.filter((c: any) => c.clauseId === clause.id) || [];
                          if (clauseComments.length === 0) return null;
                          return (
                            <div className="bg-blue-50/50 rounded p-3 mt-2 border border-blue-200">
                              <p className="text-xs font-sans font-medium text-blue-800 mb-2 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> Komentáre klienta ({clauseComments.length})
                              </p>
                              <div className="space-y-2">
                                {clauseComments.map((comment: any) => (
                                  <div key={comment.id} className="bg-white/60 rounded p-2 border border-blue-100">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[11px] font-sans font-medium text-blue-900">{comment.userName}</span>
                                      <span className="text-[10px] font-sans text-blue-600">
                                        {new Date(comment.createdAt).toLocaleString("sk-SK", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-sm font-sans text-blue-900/80">{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Annotation editor */}
                        {editingClause === clause.id ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Pridajte poznámku k tejto klauzule..."
                              value={annotations[clause.id] || clause.lawyerAnnotation || ""}
                              onChange={(e) => setAnnotations({ ...annotations, [clause.id]: e.target.value })}
                              className="font-sans text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="font-sans" onClick={() => handleAnnotate(clause.id)}>
                                Uložiť
                              </Button>
                              <Button size="sm" variant="ghost" className="font-sans" onClick={() => setEditingClause(null)}>
                                Zrušiť
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
                            {clause.lawyerAnnotation ? "Upraviť poznámku" : "Pridať poznámku"}
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
