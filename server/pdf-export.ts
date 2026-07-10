import type { Express, Request, Response } from "express";
import { jsPDF } from "jspdf";
import { sdk } from "./_core/sdk";
import { getContractById, getClausesByContractId, getReportByContractId } from "./db";
import { getInterRegularBase64, getInterBoldBase64 } from "./fonts/font-data";

/**
 * Register the PDF export route.
 * GET /api/contracts/:id/report.pdf
 * Requires authentication. Only the contract owner or admin can download.
 */
export function registerPdfExport(app: Express) {
  app.get("/api/contracts/:id/report.pdf", async (req: Request, res: Response) => {
    try {
      // Authenticate the request
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const contractId = parseInt(req.params.id);
      if (isNaN(contractId)) {
        res.status(400).json({ error: "Invalid contract ID" });
        return;
      }

      // Fetch contract data
      const contract = await getContractById(contractId);
      if (!contract) {
        res.status(404).json({ error: "Contract not found" });
        return;
      }

      // Authorization: owner or admin only
      if (contract.userId !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      // Basic plan users cannot download PDF (limited preview only)
      if (contract.plan === "basic") {
        res.status(403).json({ error: "PDF export is not available for the basic plan" });
        return;
      }

      const clauses = await getClausesByContractId(contractId);
      const report = await getReportByContractId(contractId);

      if (!report) {
        res.status(404).json({ error: "Report not yet available" });
        return;
      }

      // Generate PDF
      const pdf = generateReportPdf(contract, clauses, report);
      const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

      // Send PDF response
      const safeFileName = contract.fileName
        .replace(/\.[^.]+$/, "") // remove extension
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip diacritics for filename
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="bod-legal_report_${safeFileName}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length.toString());
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error("[PDF Export] Error:", err);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
}

// ─── PDF Generation Logic ──────────────────────────────────────────────────

const RISK_LABELS: Record<string, string> = {
  high: "Vysoké riziko",
  medium: "Stredné riziko",
  low: "Nízke riziko",
};

function generateReportPdf(contract: any, clauses: any[], report: any): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ─── Embed Unicode fonts ─────────────────────────────────────────────────
  const interRegular = getInterRegularBase64();
  const interBold = getInterBoldBase64();
  doc.addFileToVFS("Inter-Regular.ttf", interRegular);
  doc.addFileToVFS("Inter-Bold.ttf", interBold);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");
  doc.setFont("Inter", "normal");

  // Helper: check if we need a new page
  function checkPage(neededHeight: number) {
    if (y + neededHeight > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
  }

  // ─── Header / Title ────────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont("Inter", "bold");
  doc.text("bod.legal", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("Inter", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Analýza zmluvy | AI + overenie advokátom", margin, y);
  doc.setTextColor(0, 0, 0);
  y += 12;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ─── Contract Info ─────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("Inter", "bold");
  doc.text("Dokument:", margin, y);
  doc.setFont("Inter", "normal");
  doc.text(contract.fileName || "—", margin + 28, y);
  y += 6;

  doc.setFont("Inter", "bold");
  doc.text("Plán:", margin, y);
  doc.setFont("Inter", "normal");
  const planLabels: Record<string, string> = {
    basic: "Základná kontrola",
    standard: "Štandardná kontrola",
    premium: "Prémiová kontrola",
  };
  doc.text(planLabels[contract.plan] || contract.plan, margin + 28, y);
  y += 6;

  doc.setFont("Inter", "bold");
  doc.text("Dátum:", margin, y);
  doc.setFont("Inter", "normal");
  doc.text(
    contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("sk-SK") : "—",
    margin + 28,
    y
  );
  y += 6;

  if (report.isSigned && report.lawyerName) {
    doc.setFont("Inter", "bold");
    doc.text("Overil:", margin, y);
    doc.setFont("Inter", "normal");
    doc.text(
      `${report.lawyerName} (${report.signedAt ? new Date(report.signedAt).toLocaleDateString("sk-SK") : ""})`,
      margin + 28,
      y
    );
    y += 6;
  }
  y += 8;

  // ─── Risk Summary ─────────────────────────────────────────────────────────
  const riskSummary = report.riskSummary as { high: number; medium: number; low: number } | null;
  if (riskSummary) {
    checkPage(20);
    doc.setFontSize(14);
    doc.setFont("Inter", "bold");
    doc.text("Sumár rizík", margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("Inter", "normal");

    // Risk boxes
    const boxWidth = (contentWidth - 10) / 3;
    const boxHeight = 14;

    // High risk box
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "F");
    doc.setTextColor(153, 27, 27);
    doc.setFont("Inter", "bold");
    doc.text(`${riskSummary.high}`, margin + boxWidth / 2, y + 6, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("Inter", "normal");
    doc.text("Vysoké", margin + boxWidth / 2, y + 11, { align: "center" });

    // Medium risk box
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin + boxWidth + 5, y, boxWidth, boxHeight, 2, 2, "F");
    doc.setTextColor(146, 64, 14);
    doc.setFont("Inter", "bold");
    doc.setFontSize(11);
    doc.text(`${riskSummary.medium}`, margin + boxWidth + 5 + boxWidth / 2, y + 6, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("Inter", "normal");
    doc.text("Stredné", margin + boxWidth + 5 + boxWidth / 2, y + 11, { align: "center" });

    // Low risk box
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 2, 2, "F");
    doc.setTextColor(22, 101, 52);
    doc.setFont("Inter", "bold");
    doc.setFontSize(11);
    doc.text(`${riskSummary.low}`, margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 6, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("Inter", "normal");
    doc.text("Nízke", margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 11, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += boxHeight + 10;
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  if (report.summary) {
    checkPage(30);
    doc.setFontSize(14);
    doc.setFont("Inter", "bold");
    doc.text("Zhrnutie", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("Inter", "normal");
    const summaryLines = doc.splitTextToSize(report.summary, contentWidth);
    for (const line of summaryLines) {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 8;
  }

  // ─── Recommendation ───────────────────────────────────────────────────────
  if (report.recommendation) {
    checkPage(30);
    doc.setFontSize(14);
    doc.setFont("Inter", "bold");
    doc.text("Odporúčanie", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("Inter", "normal");
    const recLines = doc.splitTextToSize(report.recommendation, contentWidth);
    for (const line of recLines) {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 8;
  }

  // ─── Clause Findings ──────────────────────────────────────────────────────
  if (clauses && clauses.length > 0) {
    checkPage(20);
    doc.setFontSize(14);
    doc.setFont("Inter", "bold");
    doc.text(`Detailné nálezy (${clauses.length} klauzúl)`, margin, y);
    y += 10;

    for (const clause of clauses) {
      const effectiveRisk = clause.overriddenRiskLevel || clause.riskLevel;
      const estimatedHeight = 30 + (clause.excerpt ? 15 : 0) + (clause.suggestedEdit ? 15 : 0) + (clause.lawyerAnnotation ? 15 : 0);
      checkPage(estimatedHeight);

      // Clause header with risk badge
      doc.setFontSize(11);
      doc.setFont("Inter", "bold");
      doc.text(`#${clause.clauseNumber} ${clause.title}`, margin, y);

      // Risk label on the right
      doc.setFontSize(9);
      doc.setFont("Inter", "normal");
      const riskLabel = RISK_LABELS[effectiveRisk] || effectiveRisk;
      if (effectiveRisk === "high") doc.setTextColor(153, 27, 27);
      else if (effectiveRisk === "medium") doc.setTextColor(146, 64, 14);
      else doc.setTextColor(22, 101, 52);
      doc.text(riskLabel, pageWidth - margin, y, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 6;

      // Excerpt
      if (clause.excerpt) {
        doc.setFontSize(9);
        doc.setFont("Inter", "normal");
        doc.setTextColor(100, 100, 100);
        const excerptLines = doc.splitTextToSize(`„${clause.excerpt}"`, contentWidth - 5);
        for (const line of excerptLines.slice(0, 3)) {
          checkPage(5);
          doc.text(line, margin + 3, y);
          y += 4.5;
        }
        doc.setTextColor(0, 0, 0);
        y += 2;
      }

      // Finding
      doc.setFontSize(10);
      doc.setFont("Inter", "normal");
      const findingLines = doc.splitTextToSize(clause.finding, contentWidth - 3);
      for (const line of findingLines) {
        checkPage(5);
        doc.text(line, margin + 3, y);
        y += 5;
      }
      y += 2;

      // Legal basis
      if (clause.legalBasis) {
        checkPage(6);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Právny základ: ${clause.legalBasis}`, margin + 3, y);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }

      // Suggested edit
      if (clause.suggestedEdit) {
        checkPage(12);
        doc.setFontSize(9);
        doc.setFont("Inter", "bold");
        doc.text("Navrhovaná úprava:", margin + 3, y);
        y += 4.5;
        doc.setFont("Inter", "normal");
        const editLines = doc.splitTextToSize(clause.suggestedEdit, contentWidth - 8);
        for (const line of editLines.slice(0, 4)) {
          checkPage(5);
          doc.text(line, margin + 5, y);
          y += 4.5;
        }
        y += 2;
      }

      // Lawyer annotation
      if (clause.lawyerAnnotation) {
        checkPage(12);
        doc.setFontSize(9);
        doc.setFont("Inter", "bold");
        doc.setTextColor(146, 64, 14);
        doc.text("Poznámka advokáta:", margin + 3, y);
        y += 4.5;
        doc.setFont("Inter", "normal");
        doc.setTextColor(0, 0, 0);
        const annotLines = doc.splitTextToSize(clause.lawyerAnnotation, contentWidth - 8);
        for (const line of annotLines.slice(0, 4)) {
          checkPage(5);
          doc.text(line, margin + 5, y);
          y += 4.5;
        }
        y += 2;
      }

      // Separator between clauses
      y += 3;
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    }
  }

  // ─── Disclaimer Footer ────────────────────────────────────────────────────
  checkPage(25);
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Tento report bol vygenerovaný systémom bod.legal s využitím AI a overený advokátom.",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 4;
  doc.text(
    "Prevádzkované KILIAN LEGAL s.r.o. | IČO: 53 957 008 | robert.duriska@kilian.sk",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("Inter", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `bod.legal | KILIAN LEGAL s.r.o. | Strana ${i} z ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
}
