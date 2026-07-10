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

// Mock DB functions
vi.mock("./db", () => ({
  getContractById: vi.fn(),
  getClausesByContractId: vi.fn(),
  getReportByContractId: vi.fn(),
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
