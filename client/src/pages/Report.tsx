import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useParams } from "wouter";
import { ArrowLeft, Loader2, CheckCircle, Download, ExternalLink, Shield, FileDown, FileText, Check, X, RotateCcw, Columns2, EyeOff } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { LEGAL_SOURCES } from "@shared/types";
import { useT } from "@/i18n";

const RISK_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};
const TX = {
  sk: {
    riskLabels: { high: "Vysoké riziko", medium: "Stredné riziko", low: "Nízke riziko" } as Record<string, string>,
    pdfError: "Chyba pri generovaní PDF",
    pdfSuccess: "PDF bol úspešne vygenerovaný",
    pdfSuccessDesc: "Súbor sa stiahol do vašich súborov.",
    pdfDownloadFail: "Nepodarilo sa stiahnuť PDF",
    pdfErrorToast: "Chyba pri sťahovaní PDF",
    generating: "Generujem PDF...",
    downloadPdf: "Stiahnuť report (PDF)",
    downloadDocx: "Stiahnuť s revíziami (DOCX)",
    docxSuccess: "DOCX bol úspešne vygenerovaný",
    docxSuccessDesc: "Otvorte v MS Word a použite Revízie → Prijať/Odmietnuť.",
    docxError: "Chyba pri generovaní DOCX",
    docxErrorToast: "Chyba pri sťahovaní DOCX",
    generatingDocx: "Generujem DOCX...",
    showRedline: "Zobraziť navrhované zmeny",
    hideRedline: "Skryť navrhované zmeny",
    sideBySide: "Porovnanie vedľa seba",
    inlineView: "Inline redline",
    viewOff: "Skryť",
    redlineOriginal: "Pôvodné znenie:",
    redlineProposed: "Navrhované znenie:",
    acceptChange: "Prijať",
    rejectChange: "Odmietnuť",
    acceptAll: "Prijať všetky zmeny",
    rejectAll: "Odmietnuť všetky",
    accepted: "Prijaté",
    rejected: "Odmietnuté",
    decisionsCount: (done: number, total: number) => `${done}/${total} rozhodnutí`,
    undoDecision: "Zrušiť",
    downloadFinal: "Stiahnuť finálnu verziu (DOCX)",
    downloadFinalDesc: "Čistý dokument s prijatými zmenami, bez sledovania zmien.",
    generatingFinal: "Generujem finálnu verziu...",
    finalSuccess: "Finálna verzia bola vygenerovaná",
    finalSuccessDesc: "Dokument obsahuje iba prijaté zmeny.",
    finalError: "Chyba pri generovaní finálnej verzie",
    finalErrorToast: "Chyba pri sťahovaní finálnej verzie",
    notAvailable: "Report ešte nie je k dispozícii.",
    backToDashboard: "Späť na prehľad",
    title: "Analýza zmluvy",
    verifiedByLawyer: "Overené advokátom",
    signed: "Podpísané",
    highRisk: "Vysoké riziko",
    mediumRisk: "Stredné riziko",
    lowRisk: "Nízke riziko",
    summary: "Zhrnutie",
    recommendation: "Odporúčanie",
    detailedFindings: (n: number) => `Detailné nálezy (${n} klauzúl)`,
    legalBasis: "Právny základ:",
    suggestedEdit: "Navrhovaná úprava:",
    lawyerNote: "Poznámka advokáta:",
    freePreviewTitle: "Toto je bezplatný náhľad",
    freePreviewDesc: "Vidíte iba 3 najzávažnejšie riziká. Plný report obsahuje analýzu všetkých klauzúl, právne základy, navrhované úpravy a overenie advokátom.",
    orderFull: "Objednať plný report od 249 eur",
    legalSources: "Použité právne zdroje",
    disclaimer1: "Tento report bol vygenerovaný systémom bod.legal s využitím AI a overený advokátom.",
    disclaimer2: "Prevádzkované KILIAN LEGAL s.r.o. · IČO: 53 957 008",
    dateLocale: "sk-SK",
  },
  en: {
    riskLabels: { high: "High risk", medium: "Medium risk", low: "Low risk" } as Record<string, string>,
    pdfError: "Error generating PDF",
    pdfSuccess: "PDF generated successfully",
    pdfSuccessDesc: "The file has been downloaded to your files.",
    pdfDownloadFail: "Failed to download PDF",
    pdfErrorToast: "Error downloading PDF",
    generating: "Generating PDF...",
    downloadPdf: "Download report (PDF)",
    downloadDocx: "Download with track changes (DOCX)",
    docxSuccess: "DOCX generated successfully",
    docxSuccessDesc: "Open in MS Word and use Review → Accept/Reject.",
    docxError: "Error generating DOCX",
    docxErrorToast: "Error downloading DOCX",
    generatingDocx: "Generating DOCX...",
    showRedline: "Show proposed changes",
    hideRedline: "Hide proposed changes",
    sideBySide: "Side-by-side comparison",
    inlineView: "Inline redline",
    viewOff: "Hide",
    redlineOriginal: "Original text:",
    redlineProposed: "Proposed text:",
    acceptChange: "Accept",
    rejectChange: "Reject",
    acceptAll: "Accept all changes",
    rejectAll: "Reject all",
    accepted: "Accepted",
    rejected: "Rejected",
    decisionsCount: (done: number, total: number) => `${done}/${total} decisions`,
    undoDecision: "Undo",
    downloadFinal: "Download final version (DOCX)",
    downloadFinalDesc: "Clean document with accepted changes only, no tracked changes.",
    generatingFinal: "Generating final version...",
    finalSuccess: "Final version generated",
    finalSuccessDesc: "Document contains only accepted changes.",
    finalError: "Error generating final version",
    finalErrorToast: "Error downloading final version",
    notAvailable: "The report is not available yet.",
    backToDashboard: "Back to dashboard",
    title: "Contract analysis",
    verifiedByLawyer: "Verified by lawyer",
    signed: "Signed",
    highRisk: "High risk",
    mediumRisk: "Medium risk",
    lowRisk: "Low risk",
    summary: "Summary",
    recommendation: "Recommendation",
    detailedFindings: (n: number) => `Detailed findings (${n} clauses)`,
    legalBasis: "Legal basis:",
    suggestedEdit: "Suggested amendment:",
    lawyerNote: "Lawyer's note:",
    freePreviewTitle: "This is a free preview",
    freePreviewDesc: "You only see the 3 most serious risks. The full report includes analysis of all clauses, legal grounds, suggested amendments, and lawyer verification.",
    orderFull: "Order the full report from 249 eur",
    legalSources: "Legal sources used",
    disclaimer1: "This report was generated by the bod.legal system using AI and verified by a lawyer.",
    disclaimer2: "Operated by KILIAN LEGAL s.r.o. · Company ID: 53 957 008",
    dateLocale: "en-GB",
  },
};

function DownloadPdfButton({ contractId, tx }: { contractId: number; tx: typeof TX.sk }) {
  const { locale } = useT();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/report.pdf?lang=${locale}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: tx.pdfError }));
        throw new Error(errData.error || tx.pdfError);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+?)"/);
      a.download = filenameMatch?.[1] || `bod-legal_report_${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(tx.pdfSuccess, {
        description: tx.pdfSuccessDesc,
      });
    } catch (err: any) {
      const msg = err.message || tx.pdfDownloadFail;
      setError(msg);
      toast.error(tx.pdfErrorToast, {
        description: msg,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="text-center">
      <Button className="font-sans" onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tx.generating}</>
        ) : (
          <><FileDown className="mr-2 h-4 w-4" /> {tx.downloadPdf}</>
        )}
      </Button>
      {error && <p className="text-sm text-red-600 font-sans mt-2">{error}</p>}
    </div>
  );
}

function DownloadDocxButton({ contractId, tx }: { contractId: number; tx: typeof TX.sk }) {
  const { locale } = useT();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/report.docx?lang=${locale}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: tx.docxError }));
        throw new Error(errData.error || tx.docxError);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+?)"/);
      a.download = filenameMatch?.[1] || `bod-legal_report_${contractId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(tx.docxSuccess, {
        description: tx.docxSuccessDesc,
      });
    } catch (err: any) {
      const msg = err.message || tx.docxError;
      setError(msg);
      toast.error(tx.docxErrorToast, {
        description: msg,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="text-center">
      <Button variant="outline" className="font-sans" onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tx.generatingDocx}</>
        ) : (
          <><FileText className="mr-2 h-4 w-4" /> {tx.downloadDocx}</>
        )}
      </Button>
      {error && <p className="text-sm text-red-600 font-sans mt-2">{error}</p>}
    </div>
  );
}

function DownloadFinalButton({ contractId, decisions, tx }: { contractId: number; decisions: Record<number, 'accepted' | 'rejected'>; tx: typeof TX['sk'] }) {
  const { locale } = useT();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/report-final.docx`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions, lang: locale }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: tx.finalError }));
        throw new Error(errData.error || tx.finalError);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+?)"/);
      a.download = filenameMatch?.[1] || `bod-legal-final_${contractId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(tx.finalSuccess, {
        description: tx.finalSuccessDesc,
      });
    } catch (err: any) {
      const msg = err.message || tx.finalError;
      setError(msg);
      toast.error(tx.finalErrorToast, {
        description: msg,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="text-center">
      <Button className="font-sans bg-green-600 hover:bg-green-700 text-white" onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tx.generatingFinal}</>
        ) : (
          <><Download className="mr-2 h-4 w-4" /> {tx.downloadFinal}</>
        )}
      </Button>
      {error && <p className="text-sm text-red-600 font-sans mt-2">{error}</p>}
      <p className="text-xs text-muted-foreground font-sans mt-1">{tx.downloadFinalDesc}</p>
    </div>
  );
}

export default function Report() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const { locale, localePath } = useT();
  const tx = TX[locale];
  const params = useParams<{ id: string }>();
  const contractId = parseInt(params.id || "0");

  const { data, isLoading } = trpc.contracts.getById.useQuery(
    { id: contractId },
    { enabled: isAuthenticated && contractId > 0 }
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

  if (!data || !data.report) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground font-sans mb-4">{tx.notAvailable}</p>
            <Link href={localePath("/dashboard")}><Button variant="ghost" className="font-sans">{tx.backToDashboard}</Button></Link>
          </div>
        </main>
      </div>
    );
  }

  const { contract, clauses, report, isLimited } = data;
  const riskSummary = report.riskSummary as { high: number; medium: number; low: number } | null;
  const [viewMode, setViewMode] = useState<'off' | 'inline' | 'sidebyside'>('off');
  const hasRedlineContent = clauses?.some((c) => c.suggestedEdit);

  // Accept/Reject state: clauseId -> 'accepted' | 'rejected'
  const [decisions, setDecisions] = useState<Record<number, 'accepted' | 'rejected'>>({});
  const clausesWithEdits = clauses?.filter((c) => c.suggestedEdit) || [];
  const totalEditable = clausesWithEdits.length;
  const totalDecided = Object.keys(decisions).length;

  // Load saved decisions from DB
  const { data: savedDecisions } = trpc.decisions.getByContract.useQuery(
    { contractId },
    { enabled: isAuthenticated && contractId > 0 }
  );
  const initializedRef = useRef(false);
  useEffect(() => {
    if (savedDecisions && !initializedRef.current) {
      const parsed: Record<number, 'accepted' | 'rejected'> = {};
      for (const [k, v] of Object.entries(savedDecisions)) {
        parsed[parseInt(k)] = v;
      }
      setDecisions(parsed);
      initializedRef.current = true;
    }
  }, [savedDecisions]);

  // Mutations for persisting decisions
  const saveMutation = trpc.decisions.save.useMutation();
  const saveAllMutation = trpc.decisions.saveAll.useMutation();
  const removeMutation = trpc.decisions.remove.useMutation();

  const handleAccept = useCallback((clauseId: number) => {
    setDecisions((prev) => ({ ...prev, [clauseId]: 'accepted' }));
    saveMutation.mutate({ contractId, clauseId, decision: 'accepted' });
  }, [contractId, saveMutation]);

  const handleReject = useCallback((clauseId: number) => {
    setDecisions((prev) => ({ ...prev, [clauseId]: 'rejected' }));
    saveMutation.mutate({ contractId, clauseId, decision: 'rejected' });
  }, [contractId, saveMutation]);

  const handleUndo = useCallback((clauseId: number) => {
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[clauseId];
      return next;
    });
    removeMutation.mutate({ clauseId });
  }, [removeMutation]);

  const handleAcceptAll = useCallback(() => {
    const all: Record<number, 'accepted' | 'rejected'> = {};
    clausesWithEdits.forEach((c) => { all[c.id] = 'accepted'; });
    setDecisions(all);
    const decisionsMap: Record<string, 'accepted' | 'rejected'> = {};
    clausesWithEdits.forEach((c) => { decisionsMap[c.id.toString()] = 'accepted'; });
    saveAllMutation.mutate({ contractId, decisions: decisionsMap });
  }, [clausesWithEdits, contractId, saveAllMutation]);

  const handleRejectAll = useCallback(() => {
    const all: Record<number, 'accepted' | 'rejected'> = {};
    clausesWithEdits.forEach((c) => { all[c.id] = 'rejected'; });
    setDecisions(all);
    const decisionsMap: Record<string, 'accepted' | 'rejected'> = {};
    clausesWithEdits.forEach((c) => { decisionsMap[c.id.toString()] = 'rejected'; });
    saveAllMutation.mutate({ contractId, decisions: decisionsMap });
  }, [clausesWithEdits, contractId, saveAllMutation]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Link href={localePath("/dashboard")}>
            <Button variant="ghost" size="sm" className="font-sans mb-4">
              <ArrowLeft className="mr-1 h-4 w-4" /> {tx.backToDashboard}
            </Button>
          </Link>

          {/* Report Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-serif mb-2">{tx.title}</h1>
                <p className="text-muted-foreground font-sans">{contract.fileName}</p>
              </div>
              {report.isSigned === 1 && (
                <Badge className="bg-green-100 text-green-800 border-green-200 font-sans">
                  <Shield className="mr-1 h-3 w-3" /> {tx.verifiedByLawyer}
                </Badge>
              )}
            </div>
            {report.isSigned === 1 && report.lawyerName && (
              <p className="text-sm text-muted-foreground font-sans mt-2">
                {tx.signed}: {report.lawyerName} · {report.signedAt ? new Date(report.signedAt).toLocaleDateString(tx.dateLocale) : ""}
              </p>
            )}
          </div>

          {/* Risk Summary Cards */}
          {riskSummary && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-red-800">{riskSummary.high}</p>
                  <p className="text-xs text-red-600 font-sans">{tx.highRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-amber-800">{riskSummary.medium}</p>
                  <p className="text-xs text-amber-600 font-sans">{tx.mediumRisk}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-green-800">{riskSummary.low}</p>
                  <p className="text-xs text-green-600 font-sans">{tx.lowRisk}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary - hidden for basic plan */}
          {!isLimited && report.summary && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-3">{tx.summary}</h2>
                <p className="font-sans text-sm leading-relaxed">{report.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommendation - hidden for basic plan */}
          {!isLimited && report.recommendation && (
            <Card className="mb-8 border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-3">{tx.recommendation}</h2>
                <p className="font-sans text-sm leading-relaxed">{report.recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Clause Findings */}
          {clauses && clauses.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-serif">{tx.detailedFindings(clauses.length)}</h2>
                {!isLimited && hasRedlineContent && (
                  <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(v) => { if (v) setViewMode(v as 'off' | 'inline' | 'sidebyside'); }}
                    variant="outline"
                    size="sm"
                    className="font-sans"
                  >
                    <ToggleGroupItem value="off" className="text-xs gap-1 px-3">
                      <EyeOff className="h-3 w-3" /> {tx.viewOff}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="inline" className="text-xs gap-1 px-3">
                      <FileText className="h-3 w-3" /> {tx.inlineView}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="sidebyside" className="text-xs gap-1 px-3">
                      <Columns2 className="h-3 w-3" /> {tx.sideBySide}
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </div>
              {/* Accept/Reject toolbar */}
              {!isLimited && viewMode !== 'off' && totalEditable > 0 && (
                <div className="flex items-center justify-between mb-4 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleAcceptAll} className="font-sans text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50">
                      <Check className="h-3 w-3" /> {tx.acceptAll}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRejectAll} className="font-sans text-xs gap-1 text-red-700 border-red-300 hover:bg-red-50">
                      <X className="h-3 w-3" /> {tx.rejectAll}
                    </Button>
                  </div>
                  <span className="text-xs font-sans text-muted-foreground">
                    {tx.decisionsCount(totalDecided, totalEditable)}
                  </span>
                </div>
              )}
              <div className="space-y-3">
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
                          <Badge className={`${RISK_COLORS[effectiveRisk]} text-xs font-sans`}>
                            {tx.riskLabels[effectiveRisk]}
                          </Badge>
                        </div>
                        {clause.excerpt && (
                          <p className="text-sm text-muted-foreground font-sans mb-2 italic">"{clause.excerpt}"</p>
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
                        {clause.suggestedEdit && viewMode === 'off' && (
                          <div className="bg-primary/5 rounded p-3 mt-2">
                            <p className="text-xs font-sans font-medium text-primary mb-1">{tx.suggestedEdit}</p>
                            <p className="text-sm font-sans">{clause.suggestedEdit}</p>
                          </div>
                        )}
                        {viewMode === 'inline' && clause.suggestedEdit && (() => {
                          const decision = decisions[clause.id];
                          if (decision === 'accepted') {
                            return (
                              <div className="mt-3 rounded-lg border border-green-300 p-4 bg-green-50/50">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] font-sans">
                                    <Check className="h-2.5 w-2.5 mr-0.5" /> {tx.accepted}
                                  </Badge>
                                  <Button variant="ghost" size="sm" onClick={() => handleUndo(clause.id)} className="h-6 px-2 text-[10px] font-sans text-muted-foreground hover:text-foreground">
                                    <RotateCcw className="h-3 w-3 mr-0.5" /> {tx.undoDecision}
                                  </Button>
                                </div>
                                <p className="text-sm font-sans text-green-900">{clause.suggestedEdit}</p>
                              </div>
                            );
                          }
                          if (decision === 'rejected') {
                            return (
                              <div className="mt-3 rounded-lg border border-red-200 p-4 bg-red-50/30 opacity-60">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] font-sans">
                                    <X className="h-2.5 w-2.5 mr-0.5" /> {tx.rejected}
                                  </Badge>
                                  <Button variant="ghost" size="sm" onClick={() => handleUndo(clause.id)} className="h-6 px-2 text-[10px] font-sans text-muted-foreground hover:text-foreground">
                                    <RotateCcw className="h-3 w-3 mr-0.5" /> {tx.undoDecision}
                                  </Button>
                                </div>
                                <p className="text-sm font-sans text-muted-foreground">
                                  {clause.excerpt || <span className="line-through">{clause.suggestedEdit}</span>}
                                </p>
                              </div>
                            );
                          }
                          // No decision yet — show redline with accept/reject buttons
                          return (
                            <div className="mt-3 rounded-lg border border-dashed border-muted-foreground/30 p-4 bg-muted/20">
                              {clause.excerpt && (
                                <div className="mb-2">
                                  <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-red-600/80">{tx.redlineOriginal}</span>
                                  <p className="text-sm font-sans mt-1 line-through text-red-700/80 decoration-red-500/60">{clause.excerpt}</p>
                                </div>
                              )}
                              <div className={clause.excerpt ? "border-t border-dashed border-muted-foreground/20 pt-2" : ""}>
                                <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-green-700/80">{tx.redlineProposed}</span>
                                <p className="text-sm font-sans mt-1 text-green-800 underline decoration-green-600/50 underline-offset-2">{clause.suggestedEdit}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-muted-foreground/10">
                                <Button size="sm" variant="outline" onClick={() => handleAccept(clause.id)} className="h-7 px-3 text-[11px] font-sans gap-1 text-green-700 border-green-300 hover:bg-green-50">
                                  <Check className="h-3 w-3" /> {tx.acceptChange}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleReject(clause.id)} className="h-7 px-3 text-[11px] font-sans gap-1 text-red-700 border-red-300 hover:bg-red-50">
                                  <X className="h-3 w-3" /> {tx.rejectChange}
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                        {viewMode === 'sidebyside' && clause.suggestedEdit && (() => {
                          const decision = decisions[clause.id];
                          if (decision === 'accepted') {
                            return (
                              <div className="mt-3 rounded-lg border border-green-300 p-4 bg-green-50/50">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] font-sans">
                                    <Check className="h-2.5 w-2.5 mr-0.5" /> {tx.accepted}
                                  </Badge>
                                  <Button variant="ghost" size="sm" onClick={() => handleUndo(clause.id)} className="h-6 px-2 text-[10px] font-sans text-muted-foreground hover:text-foreground">
                                    <RotateCcw className="h-3 w-3 mr-0.5" /> {tx.undoDecision}
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="rounded-md border border-red-200/50 bg-red-50/20 p-3 opacity-50">
                                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-red-600/60 block mb-1">{tx.redlineOriginal}</span>
                                    <p className="text-sm font-sans text-red-800/60 line-through decoration-red-400/40">{clause.excerpt || '—'}</p>
                                  </div>
                                  <div className="rounded-md border border-green-300 bg-green-50/60 p-3">
                                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-green-700/80 block mb-1">{tx.redlineProposed}</span>
                                    <p className="text-sm font-sans text-green-900 font-medium">{clause.suggestedEdit}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          if (decision === 'rejected') {
                            return (
                              <div className="mt-3 rounded-lg border border-red-200 p-4 bg-red-50/30">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] font-sans">
                                    <X className="h-2.5 w-2.5 mr-0.5" /> {tx.rejected}
                                  </Badge>
                                  <Button variant="ghost" size="sm" onClick={() => handleUndo(clause.id)} className="h-6 px-2 text-[10px] font-sans text-muted-foreground hover:text-foreground">
                                    <RotateCcw className="h-3 w-3 mr-0.5" /> {tx.undoDecision}
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="rounded-md border border-red-200 bg-red-50/40 p-3">
                                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-red-600/80 block mb-1">{tx.redlineOriginal}</span>
                                    <p className="text-sm font-sans text-red-900 font-medium">{clause.excerpt || '—'}</p>
                                  </div>
                                  <div className="rounded-md border border-green-200/50 bg-green-50/20 p-3 opacity-50">
                                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-green-700/60 block mb-1">{tx.redlineProposed}</span>
                                    <p className="text-sm font-sans text-green-800/60 line-through decoration-green-400/40">{clause.suggestedEdit}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          // No decision — side-by-side two-column layout
                          return (
                            <div className="mt-3 rounded-lg border border-dashed border-muted-foreground/30 p-4 bg-muted/20">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left column: original */}
                                <div className="rounded-md border border-red-200 bg-red-50/40 p-3">
                                  <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-red-600/80 block mb-1">{tx.redlineOriginal}</span>
                                  <p className="text-sm font-sans text-red-800 line-through decoration-red-400/60">{clause.excerpt || '—'}</p>
                                </div>
                                {/* Right column: proposed */}
                                <div className="rounded-md border border-green-200 bg-green-50/40 p-3">
                                  <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-green-700/80 block mb-1">{tx.redlineProposed}</span>
                                  <p className="text-sm font-sans text-green-800 underline decoration-green-500/50 underline-offset-2">{clause.suggestedEdit}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-muted-foreground/10">
                                <Button size="sm" variant="outline" onClick={() => handleAccept(clause.id)} className="h-7 px-3 text-[11px] font-sans gap-1 text-green-700 border-green-300 hover:bg-green-50">
                                  <Check className="h-3 w-3" /> {tx.acceptChange}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleReject(clause.id)} className="h-7 px-3 text-[11px] font-sans gap-1 text-red-700 border-red-300 hover:bg-red-50">
                                  <X className="h-3 w-3" /> {tx.rejectChange}
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
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

          {/* Upgrade CTA for basic plan */}
          {isLimited && (
            <Card className="mb-8 border-primary/30 bg-primary/[0.03]">
              <CardContent className="p-6 text-center">
                <h3 className="font-serif text-lg mb-2">{tx.freePreviewTitle}</h3>
                <p className="text-sm text-muted-foreground font-sans mb-4">
                  {tx.freePreviewDesc}
                </p>
                <Link href={localePath("/upload")}>
                  <Button className="font-sans">{tx.orderFull}</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Legal Sources */}
          {!isLimited && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-4">{tx.legalSources}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LEGAL_SOURCES.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded border hover:border-primary/30 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-medium truncate">{source.name}</p>
                        <p className="text-xs text-muted-foreground font-sans">{source.instrument}</p>
                      </div>
                      <Badge variant="outline" className="text-xs font-sans shrink-0">{source.source}</Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download buttons - only for paid plans */}
          {!isLimited && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap mb-8">
              <DownloadPdfButton contractId={contractId} tx={tx} />
              <DownloadDocxButton contractId={contractId} tx={tx} />
              {viewMode !== 'off' && totalEditable > 0 && totalDecided === totalEditable && (
                <DownloadFinalButton contractId={contractId} decisions={decisions} tx={tx} />
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-center text-xs text-muted-foreground font-sans p-4 border rounded bg-muted/30">
            <p>{tx.disclaimer1}</p>
            <p className="mt-1">{tx.disclaimer2}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
