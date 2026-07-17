import { describe, it, expect, vi } from "vitest";

/**
 * Unit tests for the PDF export endpoint logic.
 * These test the route registration and response behavior.
 */

// Mock the SDK auth
vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

// Mock DB functions (isClauseExcluded is pure, keep the real logic)
vi.mock("./db", () => ({
  getContractById: vi.fn(),
  getClausesByContractId: vi.fn(),
  getReportByContractId: vi.fn(),
  isClauseExcluded: (c: { lawyerApproved: number | null; lawyerAnnotation: string | null }) =>
    c.lawyerApproved === 0 && (c.lawyerAnnotation || "").startsWith("Vyradené advokátom"),
}));

// Mock LLM for executive summary
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: "This contract contains moderate risk. The primary concern is the lack of scope specification. We recommend adding detailed appendices before signing.",
      },
      finish_reason: "stop",
    }],
  }),
}));

import { sdk } from "./_core/sdk";
import { getContractById, getClausesByContractId, getReportByContractId } from "./db";

describe("PDF Export Endpoint", () => {
  it("should reject unauthenticated requests", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    // Mock auth to return null
    (sdk.authenticateRequest as any).mockResolvedValue(null);

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/1/report.pdf");
    expect(res.status).toBe(401);
  });

  it("should reject basic plan users", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    // Mock auth to return a user
    (sdk.authenticateRequest as any).mockResolvedValue({ id: 1, role: "user" });
    // Mock contract as basic plan
    (getContractById as any).mockResolvedValue({ id: 1, userId: 1, plan: "basic", fileName: "test.pdf" });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/1/report.pdf");
    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent contract", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    (sdk.authenticateRequest as any).mockResolvedValue({ id: 1, role: "user" });
    (getContractById as any).mockResolvedValue(null);

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/999/report.pdf");
    expect(res.status).toBe(404);
  });

  it("should reject other users from downloading", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    (sdk.authenticateRequest as any).mockResolvedValue({ id: 2, role: "user" });
    (getContractById as any).mockResolvedValue({ id: 1, userId: 1, plan: "standard", fileName: "test.pdf" });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/1/report.pdf");
    expect(res.status).toBe(403);
  });

  it("should generate PDF for authorized standard plan user", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    (sdk.authenticateRequest as any).mockResolvedValue({ id: 1, role: "user" });
    (getContractById as any).mockResolvedValue({
      id: 1,
      userId: 1,
      plan: "standard",
      fileName: "Zmluva o dielo.pdf",
      createdAt: new Date("2026-01-15"),
    });
    (getClausesByContractId as any).mockResolvedValue([
      {
        id: 1,
        contractId: 1,
        clauseNumber: 1,
        title: "Predmet zmluvy",
        excerpt: "Dodávateľ sa zaväzuje...",
        riskLevel: "medium",
        finding: "Chýba presná špecifikácia rozsahu.",
        suggestedEdit: "Doplniť prílohu s presným rozsahom.",
        legalBasis: "§ 536 Obchodného zákonníka",
        legalSourceUrl: "https://www.slov-lex.sk/...",
        riskCategory: "scope_performance",
        lawyerAnnotation: null,
        lawyerApproved: 0,
        overriddenRiskLevel: null,
      },
    ]);
    (getReportByContractId as any).mockResolvedValue({
      id: 1,
      contractId: 1,
      summary: "Zmluva obsahuje niekoľko rizikových klauzúl.",
      recommendation: "Odporúčame doplniť prílohy.",
      riskSummary: { high: 0, medium: 1, low: 0 },
      isSigned: 1,
      lawyerName: "JUDr. Test",
      signedAt: new Date("2026-01-16"),
    });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/1/report.pdf");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.headers["content-disposition"]).toContain(".pdf");
    // PDF should start with %PDF
    expect(res.body.slice(0, 5).toString()).toContain("%PDF");
  });

  it("should allow admin to download any contract report", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    (sdk.authenticateRequest as any).mockResolvedValue({ id: 99, role: "admin" });
    (getContractById as any).mockResolvedValue({
      id: 1,
      userId: 1,
      plan: "premium",
      fileName: "Contract.docx",
      createdAt: new Date("2026-01-15"),
    });
    (getClausesByContractId as any).mockResolvedValue([]);
    (getReportByContractId as any).mockResolvedValue({
      id: 1,
      contractId: 1,
      summary: "Summary text",
      recommendation: "Recommendation text",
      riskSummary: { high: 1, medium: 2, low: 3 },
      isSigned: 0,
      lawyerName: null,
      signedAt: null,
    });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/1/report.pdf");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });

  it("should generate English PDF when lang=en query param is passed", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    (sdk.authenticateRequest as any).mockResolvedValue({ id: 1, role: "user" });
    (getContractById as any).mockResolvedValue({
      id: 1,
      userId: 1,
      plan: "standard",
      fileName: "Service-Agreement.pdf",
      createdAt: new Date("2026-01-15"),
    });
    (getClausesByContractId as any).mockResolvedValue([
      {
        id: 1,
        contractId: 1,
        clauseNumber: 1,
        title: "Scope of Work",
        excerpt: "The supplier commits to...",
        riskLevel: "high",
        finding: "Missing precise scope definition.",
        suggestedEdit: "Add appendix with detailed scope.",
        legalBasis: "Section 536 Commercial Code",
        legalSourceUrl: "https://www.slov-lex.sk/...",
        riskCategory: "scope_performance",
        lawyerAnnotation: null,
        lawyerApproved: 0,
        overriddenRiskLevel: null,
      },
    ]);
    (getReportByContractId as any).mockResolvedValue({
      id: 1,
      contractId: 1,
      summary: "The contract has several risky clauses.",
      recommendation: "We recommend supplementing appendices.",
      riskSummary: { high: 1, medium: 0, low: 0 },
      isSigned: 1,
      lawyerName: "JUDr. Test",
      signedAt: new Date("2026-01-16"),
    });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/1/report.pdf?lang=en");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    // PDF should start with %PDF
    expect(res.body.slice(0, 5).toString()).toContain("%PDF");
    // The PDF should contain the Inter font (used for all text)
    const pdfContent = res.body.toString("latin1");
    expect(pdfContent).toContain("Inter");
  });

  it("should include executive summary section in the PDF", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    (sdk.authenticateRequest as any).mockResolvedValue({ id: 1, role: "user" });
    (getContractById as any).mockResolvedValue({
      id: 1,
      userId: 1,
      plan: "premium",
      fileName: "Executive-Test.pdf",
      createdAt: new Date("2026-01-15"),
    });
    (getClausesByContractId as any).mockResolvedValue([
      {
        id: 1,
        contractId: 1,
        clauseNumber: 1,
        title: "Predmet zmluvy",
        excerpt: "Dodavatel sa zavazuje...",
        riskLevel: "high",
        finding: "Chyba presna specifikacia rozsahu.",
        suggestedEdit: null,
        legalBasis: null,
        legalSourceUrl: null,
        riskCategory: "scope_performance",
        lawyerAnnotation: null,
        lawyerApproved: 0,
        overriddenRiskLevel: null,
      },
    ]);
    (getReportByContractId as any).mockResolvedValue({
      id: 1,
      contractId: 1,
      summary: "Zmluva obsahuje rizikove klauzuly.",
      recommendation: "Odporucame doplnit prilohy.",
      riskSummary: { high: 1, medium: 0, low: 0 },
      isSigned: 0,
      lawyerName: null,
      signedAt: null,
    });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/1/report.pdf");
    expect(res.status).toBe(200);
    // The LLM mock returns a summary, so the PDF should be generated successfully
    // and contain the executive summary rendered as part of the document
    const pdfContent = res.body.toString("latin1");
    // The PDF should have a filled rectangle (the executive summary background box)
    // jsPDF roundedRect with "F" fill produces re/rn operators
    expect(pdfContent).toMatch(/\d+\.?\d* \d+\.?\d* \d+\.?\d* rg/);
    // The PDF should contain the Inter font
    expect(pdfContent).toContain("Inter");
  });

  it("should include QR code and watermark in the generated PDF", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    (sdk.authenticateRequest as any).mockResolvedValue({ id: 1, role: "user" });
    (getContractById as any).mockResolvedValue({
      id: 42,
      userId: 1,
      plan: "premium",
      fileName: "Test-QR.pdf",
      createdAt: new Date("2026-06-01"),
    });
    (getClausesByContractId as any).mockResolvedValue([]);
    (getReportByContractId as any).mockResolvedValue({
      id: 1,
      contractId: 42,
      summary: "Test summary for QR verification.",
      recommendation: "Test recommendation.",
      riskSummary: { high: 0, medium: 0, low: 1 },
      isSigned: 0,
      lawyerName: null,
      signedAt: null,
    });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/42/report.pdf");
    expect(res.status).toBe(200);

    // With custom fonts, jsPDF encodes text as CID glyph IDs (hex), not plain text.
    // Verify the PDF structure contains evidence of QR code and watermark.
    const pdfContent = res.body.toString("latin1");
    // The PDF should contain an embedded image (the QR code PNG)
    expect(pdfContent).toContain("/Subtype /Image");
    // The PDF should contain a graphics state with low opacity (watermark at 0.04)
    expect(pdfContent).toContain("/ca 0.04");
    // The PDF should reference the Inter font (used for watermark text)
    expect(pdfContent).toContain("Inter");
    // The PDF should have ExtGState (used by saveGraphicsState/setGState)
    expect(pdfContent).toContain("/ExtGState");
  });
});

// ─── Verification honesty ─────────────────────────────────────────────────────
// An unsigned report must never claim lawyer verification and must carry a
// visible draft watermark. A signed report keeps the verified wording.

async function extractPdfText(body: Buffer): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(body), useSystemFonts: true }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => (typeof item.str === "string" ? item.str : "")).join(" ") + "\n";
  }
  return text;
}

function mockPaidContract() {
  (sdk.authenticateRequest as any).mockResolvedValue({ id: 1, role: "user" });
  (getContractById as any).mockResolvedValue({
    id: 7,
    userId: 1,
    plan: "standard",
    fileName: "Zmluva o dielo.pdf",
    createdAt: new Date("2026-06-01"),
  });
  (getClausesByContractId as any).mockResolvedValue([
    {
      id: 1,
      contractId: 7,
      clauseNumber: 1,
      title: "Zmluvná pokuta",
      excerpt: "Zmluvná pokuta vo výške 50 % z ceny.",
      riskLevel: "high",
      finding: "Neprimerane vysoká zmluvná pokuta.",
      suggestedEdit: "Znížiť pokutu na 10 % z ceny.",
      legalBasis: "§ 544 Občianskeho zákonníka",
      legalSourceUrl: null,
      riskCategory: "liability_indemnity",
      lawyerAnnotation: null,
      lawyerApproved: 0,
      overriddenRiskLevel: null,
    },
  ]);
}

describe("PDF verification honesty", () => {
  it("unsigned report carries the draft watermark and never claims lawyer verification", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    mockPaidContract();
    (getReportByContractId as any).mockResolvedValue({
      id: 1,
      contractId: 7,
      summary: "Zmluva obsahuje rizikové klauzuly.",
      recommendation: "Odporúčame úpravy pred podpisom.",
      riskSummary: { high: 1, medium: 0, low: 0 },
      isSigned: 0,
      lawyerName: null,
      signedAt: null,
    });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/7/report.pdf");
    expect(res.status).toBe(200);

    const text = await extractPdfText(res.body);
    expect(text).toContain("PRACOVNÁ VERZIA");
    expect(text).toContain("čaká na overenie advokátskou kanceláriou alebo advokátom");
    expect(text).not.toContain("overený advokátskou kanceláriou alebo advokátom");
  });

  it("signed report keeps the verified wording and has no draft watermark", async () => {
    const { registerPdfExport } = await import("./pdf-export");
    const express = await import("express");
    const app = express.default();
    app.use(express.default.json());
    registerPdfExport(app);

    mockPaidContract();
    (getReportByContractId as any).mockResolvedValue({
      id: 1,
      contractId: 7,
      summary: "Zmluva obsahuje rizikové klauzuly.",
      recommendation: "Odporúčame úpravy pred podpisom.",
      riskSummary: { high: 1, medium: 0, low: 0 },
      isSigned: 1,
      lawyerName: "JUDr. Test",
      signedAt: new Date("2026-06-02"),
    });

    const request = await import("supertest").then(m => m.default);
    const res = await request(app).get("/api/contracts/7/report.pdf");
    expect(res.status).toBe(200);

    const text = await extractPdfText(res.body);
    expect(text).toContain("overený advokátskou kanceláriou alebo advokátom");
    expect(text).toContain("JUDr. Test");
    expect(text).not.toContain("PRACOVNÁ VERZIA");
  });
});
