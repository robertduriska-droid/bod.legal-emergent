import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContractAssistant from "@/components/ContractAssistant";
import DeepAnalysis from "@/components/DeepAnalysis";
import ContractAttachments from "@/components/ContractAttachments";
import { Link, useParams } from "wouter";
import { ArrowLeft, Loader2, CheckCircle, Download, ExternalLink, Shield, FileDown, FileText, Check, X, RotateCcw, Columns2, EyeOff, MessageCircle, Send, Trash2, HelpCircle, ChevronDown, ThumbsUp, ThumbsDown, Scale, AlertTriangle } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { LEGAL_SOURCES } from "@shared/types";
import { useT } from "@/i18n";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { signOffLines } from "@shared/advokat";
import { computeVerdict } from "@shared/verdict";

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
    redlineDownload: "Stiahnuť celú zmluvu s revíziami",
    redlineHint: "Vaša zmluva so zapracovanými zmenami, pripravená poslať druhej strane.",
    redlineGone: "Zdrojový text zmluvy už nie je dostupný (mažeme ho po 30 dňoch).",
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
    addComment: "Pridať komentár",
    commentPlaceholder: "Napíšte otázku pre advokáta k tejto klauzule...",
    sendComment: "Odoslať otázku",
    comments: "Diskusia",
    noComments: "Zatiaľ žiadne otázky. Ak niečomu nerozumiete, opýtajte sa.",
    deleteComment: "Zmazať",
    commentAdded: "Otázka bola odoslaná advokátovi",
    commentDeleted: "Komentár bol zmazaný",
    lawyerBadge: "Advokát",
    askLawyer: "Opýtať sa advokáta",
    askLawyerHint: "Advokát odpovie zvyčajne do 24 hodín.",
    qaSummary: "Moje otázky a odpovede",
    qaSummaryEmpty: "Zatiaľ ste nepoložili žiadnu otázku.",
    qaPending: "Čaká na odpoveď",
    qaClause: "Klauzula",
    dateLocale: "sk-SK",
    lawyerCardTitle: "Overil",
    lawyerCardSAK: "SAK č.",
    lawyerCardFirm: "KILIAN LEGAL s.r.o.",
    liabilityLine: "Za správnosť ručí advokát podľa zákona o advokácii, povinne poistený so zákonným minimom 1,5 mil. eur.",
    surveyTitle: "Bol pre vás report užitočný?",
    surveyThanks: "Ďakujeme za spätnú väzbu!",
    surveyCommentPlaceholder: "Voliteľné: čo by sme mohli zlepšiť?",
    surveySubmit: "Odoslať",
    surveyYes: "Áno",
    surveyNo: "Nie",
    disclaimer1Unsigned: "Tento report vygenerovala AI systému bod.legal a čaká na overenie advokátom.",
    reviewBanner: "Advokát report ešte overuje. Nálezy sa môžu doplniť alebo zmeniť.",
    verdictCritical: "Kritické",
    verdictImportant: "Dôležité",
    verdictMinor: "Drobné",
    firstStepsTitle: "Čo urobiť ako prvé",
    actionApplyEdit: "Nahraďte znenie navrhovanou úpravou.",
    actionReview: "Prejdite si nález a dohodnite úpravu s druhou stranou.",
    checkedByLawyer: "Skontrolované advokátom",
    negotiationChecklistTitle: "Kontrolný zoznam na rokovanie",
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
    redlineDownload: "Download the whole contract redlined",
    redlineHint: "Your contract with the edits applied, ready to send to the other side.",
    redlineGone: "The contract source text is no longer available (deleted after 30 days).",
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
    orderFull: "Order the full report from €249",
    legalSources: "Legal sources used",
    disclaimer1: "This report was generated by the bod.legal system using AI and verified by a lawyer.",
    disclaimer2: "Operated by KILIAN LEGAL s.r.o. · Company ID: 53 957 008",
    addComment: "Add comment",
    commentPlaceholder: "Ask the lawyer about this clause...",
    sendComment: "Send question",
    comments: "Discussion",
    noComments: "No questions yet. If something is unclear, ask here.",
    lawyerBadge: "Lawyer",
    deleteComment: "Delete",
    commentAdded: "Question sent to the lawyer",
    commentDeleted: "Comment deleted",
    askLawyer: "Ask the lawyer",
    askLawyerHint: "The lawyer usually responds within 24 hours.",
    qaSummary: "My questions & answers",
    qaSummaryEmpty: "You haven't asked any questions yet.",
    qaPending: "Awaiting reply",
    qaClause: "Clause",
    dateLocale: "en-GB",
    lawyerCardTitle: "Verified by",
    lawyerCardSAK: "Bar No.",
    lawyerCardFirm: "KILIAN LEGAL s.r.o.",
    liabilityLine: "The attorney is professionally liable under the Slovak Advocacy Act and carries mandatory insurance (statutory minimum 1.5M eur).",
    surveyTitle: "Was this report helpful?",
    surveyThanks: "Thank you for your feedback!",
    surveyCommentPlaceholder: "Optional: What could we improve?",
    surveySubmit: "Submit",
    surveyYes: "Yes",
    surveyNo: "No",
    disclaimer1Unsigned: "This report was generated by the bod.legal AI system and is awaiting verification by a lawyer.",
    reviewBanner: "A lawyer is still verifying this report. Findings may be added or changed.",
    verdictCritical: "Critical",
    verdictImportant: "Important",
    verdictMinor: "Minor",
    firstStepsTitle: "What to do first",
    actionApplyEdit: "Replace the wording with the suggested edit.",
    actionReview: "Review the finding and agree on a change with the counterparty.",
    checkedByLawyer: "Checked by a lawyer",
    negotiationChecklistTitle: "Negotiation checklist",
  },
  cz: {
    riskLabels: { high: "Vysoké riziko", medium: "Střední riziko", low: "Nízké riziko" } as Record<string, string>,
    pdfError: "Chyba při generování PDF",
    pdfSuccess: "PDF byl úspěšně vygenerován",
    pdfSuccessDesc: "Soubor se stáhl do vašich souborů.",
    pdfDownloadFail: "Nepodařilo se stáhnout PDF",
    pdfErrorToast: "Chyba při stahování PDF",
    generating: "Generuji PDF...",
    downloadPdf: "Stáhnout report (PDF)",
    downloadDocx: "Stáhnout s revizemi (DOCX)",
    redlineDownload: "Stáhnout celou smlouvu s revizemi",
    redlineHint: "Vaše smlouva se zapracovanými změnami, připravená poslat druhé straně.",
    redlineGone: "Zdrojový text smlouvy již není dostupný (mažeme po 30 dnech).",
    docxSuccess: "DOCX byl úspěšně vygenerován",
    docxSuccessDesc: "Otevřete v MS Word a použijte Revize → Přijmout/Odmítnout.",
    docxError: "Chyba při generování DOCX",
    docxErrorToast: "Chyba při stahování DOCX",
    generatingDocx: "Generuji DOCX...",
    showRedline: "Zobrazit navrhované změny",
    hideRedline: "Skrýt navrhované změny",
    sideBySide: "Porovnání vedle sebe",
    inlineView: "Inline redline",
    viewOff: "Skrýt",
    redlineOriginal: "Původní znění:",
    redlineProposed: "Navrhované znění:",
    acceptChange: "Přijmout",
    rejectChange: "Odmítnout",
    acceptAll: "Přijmout všechny změny",
    rejectAll: "Odmítnout všechny",
    accepted: "Přijato",
    rejected: "Odmítnuto",
    decisionsCount: (done: number, total: number) => `${done}/${total} rozhodnutí`,
    undoDecision: "Zrušit",
    downloadFinal: "Stáhnout finální verzi (DOCX)",
    downloadFinalDesc: "Čistý dokument s přijatými změnami, bez sledování změn.",
    generatingFinal: "Generuji finální verzi...",
    finalSuccess: "Finální verze byla vygenerována",
    finalSuccessDesc: "Dokument obsahuje pouze přijaté změny.",
    finalError: "Chyba při generování finální verze",
    finalErrorToast: "Chyba při stahování finální verze",
    notAvailable: "Report zatím není k dispozici.",
    backToDashboard: "Zpět na přehled",
    title: "Analýza smlouvy",
    verifiedByLawyer: "Ověřeno advokátem",
    signed: "Podepsáno",
    highRisk: "Vysoké riziko",
    mediumRisk: "Střední riziko",
    lowRisk: "Nízké riziko",
    summary: "Shrnutí",
    recommendation: "Doporučení",
    detailedFindings: (n: number) => `Detailní nálezy (${n} klauzulí)`,
    legalBasis: "Právní základ:",
    suggestedEdit: "Navrhovaná úprava:",
    lawyerNote: "Poznámka advokáta:",
    freePreviewTitle: "Toto je bezplatný náhled",
    freePreviewDesc: "Vidíte pouze 3 nejzávažnější rizika. Plný report obsahuje analýzu všech klauzulí, právní základy, navrhované úpravy a ověření advokátem.",
    orderFull: "Objednat plný report od 7 490 Kč",
    legalSources: "Použité právní zdroje",
    disclaimer1: "Tento report byl vygenerován systémem bod.legal s využitím AI a ověřen advokátem.",
    disclaimer2: "Provozováno KILIAN LEGAL s.r.o. · IČO: 53 957 008",
    addComment: "Přidat komentář",
    commentPlaceholder: "Zeptejte se advokáta k této klauzuli...",
    sendComment: "Odeslat otázku",
    comments: "Diskuse",
    noComments: "Zatím žádné otázky. Pokud něčemu nerozumíte, zeptejte se.",
    lawyerBadge: "Advokát",
    deleteComment: "Smazat",
    commentAdded: "Otázka byla odeslána advokátovi",
    commentDeleted: "Komentář byl smazán",
    askLawyer: "Zeptat se advokáta",
    askLawyerHint: "Advokát obvykle odpoví do 24 hodin.",
    qaSummary: "Moje otázky a odpovědi",
    qaSummaryEmpty: "Zatím jste nepoložili žádnou otázku.",
    qaPending: "Čeká na odpověď",
    qaClause: "Klauzule",
    dateLocale: "cs-CZ",
    lawyerCardTitle: "Ověřil",
    lawyerCardSAK: "ČAK č.",
    lawyerCardFirm: "KILIAN LEGAL s.r.o.",
    liabilityLine: "Za správnost ručí advokát podle zákona o advokacii, povinně pojištěný se zákonným minimem 1,5 mil. eur.",
    surveyTitle: "Byl pro vás report užitečný?",
    surveyThanks: "Děkujeme za zpětnou vazbu!",
    surveyCommentPlaceholder: "Volitelné: Co bychom mohli zlepšit?",
    surveySubmit: "Odeslat",
    surveyYes: "Ano",
    surveyNo: "Ne",
    disclaimer1Unsigned: "Tento report vygenerovala AI systému bod.legal a čeká na ověření advokátem.",
    reviewBanner: "Advokát report ještě ověřuje. Nálezy se mohou doplnit nebo změnit.",
    verdictCritical: "Kritické",
    verdictImportant: "Důležité",
    verdictMinor: "Drobné",
    firstStepsTitle: "Co udělat jako první",
    actionApplyEdit: "Nahraďte znění navrhovanou úpravou.",
    actionReview: "Projděte si nález a dohodněte úpravu s druhou stranou.",
    checkedByLawyer: "Zkontrolováno advokátem",
    negotiationChecklistTitle: "Kontrolní seznam na jednání",
  },
};

function DownloadRedlineButton({ contractId, tx }: { contractId: number; tx: typeof TX.sk }) {
  const { locale } = useT();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/report-redline.docx?lang=${locale}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: tx.docxError }));
        // 410: retention deleted the source text; say it plainly.
        throw new Error(response.status === 410 ? tx.redlineGone : (errData.error || tx.docxError));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+?)"/);
      a.download = filenameMatch?.[1] || `bod-legal-zmluva-s-reviziami-${contractId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(tx.redlineDownload);
    } catch (err: any) {
      const msg = err.message || tx.docxError;
      setError(msg);
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="text-center">
      <Button className="font-sans" onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tx.generatingDocx}</>
        ) : (
          <><FileDown className="mr-2 h-4 w-4" /> {tx.redlineDownload}</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground font-sans mt-1 max-w-xs mx-auto">{tx.redlineHint}</p>
      {error && <p className="text-sm text-red-600 font-sans mt-2">{error}</p>}
    </div>
  );
}

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

function SatisfactionSurvey({ contractId, tx }: { contractId: number; tx: typeof TX.sk }) {
  const { data: existing, isLoading } = trpc.feedback.getByContract.useQuery({ contractId });
  const submitMutation = trpc.feedback.submit.useMutation();
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) return null;
  if (existing || submitted) {
    return (
      <div className="text-center py-6 mb-8">
        <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-full px-4 py-2">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-sans font-medium">{tx.surveyThanks}</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!rating) return;
    await submitMutation.mutateAsync({ contractId, rating, comment: comment.trim() || undefined });
    setSubmitted(true);
    toast.success(tx.surveyThanks);
  };

  return (
    <div className="mb-8 p-6 border rounded-lg bg-muted/20">
      <p className="text-center font-sans font-medium text-sm mb-4">{tx.surveyTitle}</p>
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setRating('positive')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-150 font-sans text-sm ${
            rating === 'positive' ? 'bg-green-100 border-green-400 text-green-800 scale-105' : 'border-border hover:bg-muted'
          }`}
        >
          <ThumbsUp className="h-4 w-4" /> {tx.surveyYes}
        </button>
        <button
          onClick={() => setRating('negative')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-150 font-sans text-sm ${
            rating === 'negative' ? 'bg-red-100 border-red-400 text-red-800 scale-105' : 'border-border hover:bg-muted'
          }`}
        >
          <ThumbsDown className="h-4 w-4" /> {tx.surveyNo}
        </button>
      </div>
      {rating && (
        <div className="max-w-md mx-auto space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={tx.surveyCommentPlaceholder}
            className="font-sans text-sm resize-none"
            rows={2}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            size="sm"
            className="w-full font-sans"
          >
            {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {tx.surveySubmit}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Typed shape of report.riskSummary (JSON column). negotiationChecklist and
 *  missingClauses are optional richer fields that may be added by the analysis
 *  pipeline; render conditionally so the page works with or without them. */
interface RiskSummaryData {
  high?: number;
  medium?: number;
  low?: number;
  negotiationChecklist?: string[];
  missingClauses?: { name: string; why?: string }[];
}

type ContractGetByIdOutput = NonNullable<inferRouterOutputs<AppRouter>["contracts"]["getById"]>;
type ReportPageData = Omit<ContractGetByIdOutput, "report"> & {
  report: NonNullable<ContractGetByIdOutput["report"]>;
};

/**
 * Thin loader: runs auth + the contract query and renders the loading/empty
 * states. All other hooks live in ReportContent, which only mounts once data
 * is available, so no hooks ever run after an early return (rules of hooks).
 */
export default function Report() {
  // No forced login: a free-scan visitor reaches their report through the
  // claim-token cookie, and access is enforced server-side (owner, admin, or a
  // matching claim). Forcing a redirect here also crashed the page, because the
  // Manus login it triggered does not exist on a self-hosted deployment.
  const { isAuthenticated, user: authUser } = useAuth();
  const { locale, localePath } = useT();
  const tx = TX[locale === "hu" ? "en" : locale];
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

  return (
    <ReportContent
      data={data as ReportPageData}
      contractId={contractId}
      isAuthenticated={isAuthenticated}
      authUser={authUser}
    />
  );
}

function ReportContent({
  data,
  contractId,
  isAuthenticated,
  authUser,
}: {
  data: ReportPageData;
  contractId: number;
  isAuthenticated: boolean;
  authUser: ReturnType<typeof useAuth>["user"];
}) {
  const { locale, localePath } = useT();
  const tx = TX[locale === "hu" ? "en" : locale];
  const { contract, clauses: allClauses, report, isLimited } = data;
  // Findings the advokát excluded during review (stored as lawyerApproved 0 +
  // a "Vyradené advokátom" annotation prefix, see AdminReview) are hidden
  // from the client-facing report entirely.
  const clauses = useMemo(
    () =>
      (allClauses || []).filter(
        (c) => !(c.lawyerApproved === 0 && (c.lawyerAnnotation || "").startsWith("Vyradené advokátom")),
      ),
    [allClauses],
  );
  const riskSummary = (report.riskSummary ?? null) as RiskSummaryData | null;
  const [viewMode, setViewMode] = useState<'off' | 'inline' | 'sidebyside'>('off');
  const hasRedlineContent = clauses?.some((c) => c.suggestedEdit);

  // Verdict counts: prefer stored riskSummary, fall back to counting clauses
  const verdictCounts = useMemo(() => {
    if (riskSummary && (riskSummary.high !== undefined || riskSummary.medium !== undefined || riskSummary.low !== undefined)) {
      return { high: riskSummary.high ?? 0, medium: riskSummary.medium ?? 0, low: riskSummary.low ?? 0 };
    }
    const counts = { high: 0, medium: 0, low: 0 };
    clauses?.forEach((c) => {
      const r = (c.overriddenRiskLevel || c.riskLevel) as keyof typeof counts;
      if (counts[r] !== undefined) counts[r]++;
    });
    return counts;
  }, [riskSummary, clauses]);

  // Top 3 findings by severity for the "what to do first" box
  const topFindings = useMemo(() => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...(clauses || [])]
      .sort((a, b) => {
        const ra = order[a.overriddenRiskLevel || a.riskLevel] ?? 2;
        const rb = order[b.overriddenRiskLevel || b.riskLevel] ?? 2;
        return ra !== rb ? ra - rb : a.clauseNumber - b.clauseNumber;
      })
      .slice(0, 3);
  }, [clauses]);

  const negotiationChecklist = (riskSummary?.negotiationChecklist || []).filter(
    (item) => typeof item === "string" && item.trim().length > 0
  );

  // The one answer a non-lawyer opens the report for: can I sign this?
  const verdict = computeVerdict({
    high: verdictCounts.high,
    medium: verdictCounts.medium,
    dealBreakers: Array.isArray(data.deepAnalysis?.dealBreakers) ? data.deepAnalysis!.dealBreakers.length : 0,
  });
  const verdictStyle = {
    stop: { box: "border-red-300 bg-red-50", title: "text-red-800", dot: "bg-red-500" },
    caution: { box: "border-amber-300 bg-amber-50", title: "text-amber-800", dot: "bg-amber-500" },
    go: { box: "border-green-300 bg-green-50", title: "text-green-800", dot: "bg-green-500" },
  }[verdict.level];

  const isClauseChecked = (clause: { lawyerAnnotation: string | null; lawyerApproved: number | null }) =>
    report.isSigned === 1 || !!clause.lawyerAnnotation || clause.lawyerApproved === 1;

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

  // ─── Comments ─────────────────────────────────────────────────────────────
  const { data: commentsData, refetch: refetchComments } = trpc.comments.getByContract.useQuery(
    { contractId },
    { enabled: isAuthenticated && contractId > 0 }
  );
  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      refetchComments();
      toast.success(tx.commentAdded);
    },
  });
  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      refetchComments();
      toast.success(tx.commentDeleted);
    },
  });
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

  const handleAddComment = useCallback((clauseId: number) => {
    const content = commentInputs[clauseId]?.trim();
    if (!content) return;
    addCommentMutation.mutate({ contractId, clauseId, content });
    setCommentInputs((prev) => ({ ...prev, [clauseId]: '' }));
  }, [contractId, commentInputs, addCommentMutation]);

  const handleDeleteComment = useCallback((commentId: number) => {
    deleteCommentMutation.mutate({ id: commentId });
  }, [deleteCommentMutation]);

  const toggleComments = useCallback((clauseId: number) => {
    setExpandedComments((prev) => ({ ...prev, [clauseId]: !prev[clauseId] }));
  }, []);

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
              <div className="mt-4 p-4 border border-green-200 bg-green-50/50 rounded-lg flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center shrink-0">
                  <Scale className="h-6 w-6 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-semibold text-green-900">
                    {tx.lawyerCardTitle}: {signOffLines(report.lawyerName, locale === "en" ? "en" : "sk")[0]}
                  </p>
                  {signOffLines(report.lawyerName, locale === "en" ? "en" : "sk")[1] && (
                    <p className="text-xs text-green-700 font-sans mt-0.5">
                      {signOffLines(report.lawyerName, locale === "en" ? "en" : "sk")[1]}
                    </p>
                  )}
                  <p className="text-xs text-green-700 font-sans mt-0.5">
                    {tx.lawyerCardFirm}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans mt-1 leading-snug">
                    {tx.liabilityLine}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    {report.signedAt ? new Date(report.signedAt).toLocaleDateString(tx.dateLocale) : ""}
                  </p>
                </div>
                <Shield className="h-5 w-5 text-green-600 shrink-0" />
              </div>
            )}
          </div>

          {/* Review-in-progress banner: shown until the lawyer completes verification */}
          {contract.status !== "completed" && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4" role="status">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-amber-900">{tx.reviewBanner}</p>
            </div>
          )}

          {/* Can I sign this? The single verdict, before the detail. */}
          {(riskSummary || (clauses && clauses.length > 0)) && (
            <div className={`mb-6 rounded-lg border p-5 flex items-start gap-4 ${verdictStyle.box}`}>
              <span className={`mt-1 h-3 w-3 rounded-full shrink-0 ${verdictStyle.dot}`} aria-hidden="true" />
              <div>
                <p className={`font-serif text-xl ${verdictStyle.title}`}>
                  {locale === "en" ? verdict.titleEn : verdict.titleSk}
                </p>
                <p className="text-sm font-sans text-foreground/80 mt-1">
                  {locale === "en" ? verdict.detailEn : verdict.detailSk}
                </p>
              </div>
            </div>
          )}

          {/* Verdict strip: kritické / dôležité / drobné counts */}
          {(riskSummary || (clauses && clauses.length > 0)) && (
            <div className="mb-8 grid grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-red-800">{verdictCounts.high}</p>
                  <p className="text-xs text-red-600 font-sans uppercase tracking-wider">{tx.verdictCritical}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-amber-800">{verdictCounts.medium}</p>
                  <p className="text-xs text-amber-600 font-sans uppercase tracking-wider">{tx.verdictImportant}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-serif text-green-800">{verdictCounts.low}</p>
                  <p className="text-xs text-green-600 font-sans uppercase tracking-wider">{tx.verdictMinor}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* What to do first: top 3 findings by severity with one-line actions */}
          {topFindings.length > 0 && (
            <Card className="mb-8 border-primary/20">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-4">{tx.firstStepsTitle}</h2>
                <ol className="space-y-3">
                  {topFindings.map((clause, i) => {
                    const effectiveRisk = clause.overriddenRiskLevel || clause.riskLevel;
                    return (
                      <li key={clause.id} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-sans font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-sans font-medium">
                            #{clause.clauseNumber} {clause.title}
                            <Badge className={`${RISK_COLORS[effectiveRisk]} text-[10px] font-sans ml-2 align-middle`}>
                              {tx.riskLabels[effectiveRisk]}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">
                            {clause.suggestedEdit ? tx.actionApplyEdit : tx.actionReview}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
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

          {/* Deep analysis (Mike OS) - hidden for basic plan */}
          {!isLimited && data.deepAnalysis && (
            <DeepAnalysis data={data.deepAnalysis} locale={locale} />
          )}

          {/* Bonuses for paid plans: real deliverables promised on the price
              cards. Pages are noindex on the marketing domain; the library of
              clauses is a premium extra. */}
          {!isLimited && contract.plan !== "basic" && (
            <div className="mb-8 rounded-lg border border-green-200 bg-green-50/60 p-5" data-testid="report-bonuses">
              <p className="font-serif text-lg mb-2">
                {locale === "en" ? "Your bonuses" : "Vaše bonusy"}
              </p>
              <ul className="space-y-1.5 text-sm font-sans">
                <li>
                  <a className="text-green-700 underline underline-offset-2" href="https://bod.legal/bonus-toto-nikdy-nepodpisuj.html" target="_blank" rel="noopener">
                    {locale === "en" ? "Never sign this: 12 clauses that can sink a company" : "Toto nikdy nepodpisujte: 12 klauzúl, ktoré vedia firmu potopiť"}
                  </a>
                </li>
                <li>
                  <a className="text-green-700 underline underline-offset-2" href="https://bod.legal/bonus-vyjednavacie-emaily.html" target="_blank" rel="noopener">
                    {locale === "en" ? "5 negotiation e-mails ready to send" : "5 vyjednávacích e-mailov pripravených na poslanie"}
                  </a>
                </li>
                {contract.plan === "premium" && (
                  <li>
                    <a className="text-green-700 underline underline-offset-2" href="https://bod.legal/bonus-kniznica-klauzul.html" target="_blank" rel="noopener">
                      {locale === "en" ? "Library of vetted clauses (premium)" : "Knižnica overených klauzúl (prémiový bonus)"}
                    </a>
                  </li>
                )}
              </ul>
            </div>
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
                          <div className="flex items-center gap-2 shrink-0">
                            {isClauseChecked(clause) && (
                              <Badge variant="outline" className="text-[10px] font-sans text-green-700 border-green-300 bg-green-50">
                                <Check className="h-2.5 w-2.5 mr-0.5" /> {tx.checkedByLawyer}
                              </Badge>
                            )}
                            <Badge className={`${RISK_COLORS[effectiveRisk]} text-xs font-sans`}>
                              {tx.riskLabels[effectiveRisk]}
                            </Badge>
                          </div>
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
                          // No decision yet: show redline with accept/reject buttons
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
                                    <p className="text-sm font-sans text-red-800/60 line-through decoration-red-400/40">{clause.excerpt || '…'}</p>
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
                                    <p className="text-sm font-sans text-red-900 font-medium">{clause.excerpt || '…'}</p>
                                  </div>
                                  <div className="rounded-md border border-green-200/50 bg-green-50/20 p-3 opacity-50">
                                    <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-green-700/60 block mb-1">{tx.redlineProposed}</span>
                                    <p className="text-sm font-sans text-green-800/60 line-through decoration-green-400/40">{clause.suggestedEdit}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          // No decision: side-by-side two-column layout
                          return (
                            <div className="mt-3 rounded-lg border border-dashed border-muted-foreground/30 p-4 bg-muted/20">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left column: original */}
                                <div className="rounded-md border border-red-200 bg-red-50/40 p-3">
                                  <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-red-600/80 block mb-1">{tx.redlineOriginal}</span>
                                  <p className="text-sm font-sans text-red-800 line-through decoration-red-400/60">{clause.excerpt || '…'}</p>
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
                        {/* Comments section */}
                        {!isLimited && (() => {
                          const clauseComments = commentsData?.filter((c) => c.clauseId === clause.id) || [];
                          const isExpanded = expandedComments[clause.id];
                          return (
                            <div className="mt-3 pt-3 border-t border-muted-foreground/10">
                              <button
                                onClick={() => {
                                  if (!expandedComments[clause.id]) {
                                    toggleComments(clause.id);
                                    setTimeout(() => {
                                      document.getElementById(`ask-lawyer-${clause.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 100);
                                  } else {
                                    toggleComments(clause.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 rounded-full px-3 py-1.5"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                                {tx.askLawyer}
                                {clauseComments.length > 0 && (
                                  <span className="bg-primary/20 text-primary text-[10px] rounded-full px-1.5 py-0.5 ml-1">{clauseComments.length}</span>
                                )}
                              </button>
                              {isExpanded && (
                                <div id={`ask-lawyer-${clause.id}`} className="mt-3 space-y-2 rounded-lg border border-primary/10 bg-primary/[0.02] p-3">
                                  {clauseComments.length === 0 && (
                                    <p className="text-xs text-muted-foreground font-sans italic">{tx.noComments}</p>
                                  )}
                                  {(() => {
                                    const topLevel = clauseComments.filter((c: any) => !c.parentId);
                                    const replies = clauseComments.filter((c: any) => c.parentId);
                                    return topLevel.map((comment: any) => {
                                      const commentReplies = replies.filter((r: any) => r.parentId === comment.id);
                                      return (
                                        <div key={comment.id}>
                                          <div className={`rounded p-2.5 border ${comment.isLawyer ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted/40 border-muted-foreground/10'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[11px] font-sans font-medium text-foreground flex items-center gap-1">
                                                {comment.userName}
                                                {comment.isLawyer ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-medium">{tx.lawyerBadge}</span> : null}
                                              </span>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-sans text-muted-foreground">
                                                  {new Date(comment.createdAt).toLocaleString(tx.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {authUser && comment.userId === authUser.id && (
                                                  <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-muted-foreground hover:text-red-600 transition-colors"
                                                    title={tx.deleteComment}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                            <p className="text-sm font-sans text-foreground/90">{comment.content}</p>
                                          </div>
                                          {/* Threaded replies */}
                                          {commentReplies.length > 0 && (
                                            <div className="ml-4 mt-1 space-y-1">
                                              {commentReplies.map((reply: any) => (
                                                <div key={reply.id} className={`rounded p-2 border ${reply.isLawyer ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-muted/40 border-muted-foreground/10'}`}>
                                                  <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[11px] font-sans font-medium text-foreground flex items-center gap-1">
                                                      {reply.userName}
                                                      {reply.isLawyer ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-medium">{tx.lawyerBadge}</span> : null}
                                                    </span>
                                                    <span className="text-[10px] font-sans text-muted-foreground">
                                                      {new Date(reply.createdAt).toLocaleString(tx.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                  </div>
                                                  <p className="text-sm font-sans text-foreground/90">{reply.content}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    });
                                  })()}
                                  <div className="flex gap-2 mt-2">
                                    <Textarea
                                      value={commentInputs[clause.id] || ''}
                                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [clause.id]: e.target.value }))}
                                      placeholder={tx.commentPlaceholder}
                                      className="text-sm font-sans min-h-[60px] resize-none"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                          handleAddComment(clause.id);
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddComment(clause.id)}
                                      disabled={!commentInputs[clause.id]?.trim() || addCommentMutation.isPending}
                                      className="h-7 px-3 text-[11px] font-sans gap-1"
                                    >
                                      {addCommentMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} {tx.sendComment}
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground font-sans">{tx.askLawyerHint}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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

          {/* Q&A Summary */}
          {!isLimited && commentsData && (() => {
            const clientQuestions = commentsData.filter((c: any) => !c.parentId && !c.isLawyer);
            const lawyerReplies = commentsData.filter((c: any) => c.parentId && c.isLawyer);
            // Build clause map for titles
            const clauseMap = new Map<number, string>();
            clauses?.forEach((cl) => { clauseMap.set(cl.id, `#${cl.clauseNumber} ${cl.title}`); });
            // Group questions by clause
            const byClause = new Map<number, any[]>();
            clientQuestions.forEach((q: any) => {
              const arr = byClause.get(q.clauseId) || [];
              arr.push(q);
              byClause.set(q.clauseId, arr);
            });
            return (
              <Card className="mb-8 border-primary/10">
                <Collapsible defaultOpen={clientQuestions.length > 0}>
                  <CardContent className="p-6">
                    <CollapsibleTrigger className="w-full">
                      <h2 className="font-serif text-xl flex items-center gap-2 cursor-pointer group">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        {tx.qaSummary}
                        {clientQuestions.length > 0 && (
                          <Badge variant="outline" className="text-xs font-sans ml-2">{clientQuestions.length}</Badge>
                        )}
                        <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </h2>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      {clientQuestions.length === 0 ? (
                        <p className="text-sm text-muted-foreground font-sans italic">{tx.qaSummaryEmpty}</p>
                      ) : (
                        <div className="space-y-5">
                          {Array.from(byClause.entries()).map(([clauseId, questions]) => {
                            const clauseTitle = clauseMap.get(clauseId) || `${tx.qaClause} ${clauseId}`;
                            return (
                              <div key={clauseId}>
                                <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-2">{clauseTitle}</p>
                                <div className="space-y-3">
                                  {questions.map((q: any) => {
                                    const replies = lawyerReplies.filter((r: any) => r.parentId === q.id);
                                    return (
                                      <div key={q.id} className="rounded-lg border p-4 bg-muted/20">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[11px] font-sans font-medium">{q.userName}</span>
                                          <span className="text-[10px] font-sans text-muted-foreground">
                                            {new Date(q.createdAt).toLocaleString(tx.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <p className="text-sm font-sans mb-2">{q.content}</p>
                                        {replies.length > 0 ? (
                                          <div className="ml-3 pl-3 border-l-2 border-emerald-300 space-y-2">
                                            {replies.map((r: any) => (
                                              <div key={r.id} className="bg-emerald-50/60 rounded p-2.5 border border-emerald-200">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                  <span className="text-[11px] font-sans font-medium">{r.userName}</span>
                                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{tx.lawyerBadge}</span>
                                                  <span className="text-[10px] font-sans text-muted-foreground ml-auto">
                                                    {new Date(r.createdAt).toLocaleString(tx.dateLocale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                  </span>
                                                </div>
                                                <p className="text-sm font-sans">{r.content}</p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <Badge variant="outline" className="text-[10px] font-sans text-amber-700 border-amber-300 bg-amber-50">
                                            {tx.qaPending}
                                          </Badge>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Collapsible>
              </Card>
            );
          })()}

          {/* Negotiation checklist (rendered only when the analysis provides it) */}
          {!isLimited && negotiationChecklist.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl mb-4">{tx.negotiationChecklistTitle}</h2>
                <ul className="space-y-2">
                  {negotiationChecklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm font-sans">{item}</span>
                    </li>
                  ))}
                </ul>
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
              {contract.plan === "premium" && <DownloadRedlineButton contractId={contractId} tx={tx} />}
              <DownloadPdfButton contractId={contractId} tx={tx} />
              <DownloadDocxButton contractId={contractId} tx={tx} />
              {viewMode !== 'off' && totalEditable > 0 && totalDecided === totalEditable && (
                <DownloadFinalButton contractId={contractId} decisions={decisions} tx={tx} />
              )}
            </div>
          )}

          {/* Satisfaction Micro-Survey */}
          {!isLimited && <ContractAssistant contractId={contractId} language={contract.language} />}
          {!isLimited && <ContractAttachments contractId={contractId} language={contract.language} />}
          {!isLimited && <SatisfactionSurvey contractId={contractId} tx={tx} />}

          {/* Disclaimer: verification is only claimed once the lawyer signed */}
          <div className="text-center text-xs text-muted-foreground font-sans p-4 border rounded bg-muted/30">
            <p>{report.isSigned === 1 ? tx.disclaimer1 : tx.disclaimer1Unsigned}</p>
            <p className="mt-1">{tx.disclaimer2}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
