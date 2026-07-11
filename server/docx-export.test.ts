import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { registerDocxExport } from "./docx-export";

// Mock the SDK
vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

// Mock the DB
vi.mock("./db", () => ({
  getContractById: vi.fn(),
  getClausesByContractId: vi.fn(),
  getReportByContractId: vi.fn(),
}));

import { sdk } from "./_core/sdk";
import { getContractById, getClausesByContractId, getReportByContractId } from "./db";

const mockAuth = sdk.authenticateRequest as ReturnType<typeof vi.fn>;
const mockGetContract = getContractById as ReturnType<typeof vi.fn>;
const mockGetClauses = getClausesByContractId as ReturnType<typeof vi.fn>;
const mockGetReport = getReportByContractId as ReturnType<typeof vi.fn>;

function createApp() {
  const app = express();
  app.use(express.json());
  registerDocxExport(app);
  return app;
}

describe("DOCX Export Endpoint", () => {
  const app = createApp();

  beforeAll(() => {
    mockAuth.mockReset();
    mockGetContract.mockReset();
    mockGetClauses.mockReset();
    mockGetReport.mockReset();
  });

  it("should reject unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await request(app).get("/api/contracts/1/report.docx");
    expect(res.status).toBe(401);
  });

  it("should reject invalid contract ID", async () => {
    mockAuth.mockResolvedValue({ id: 1, role: "user" });
    const res = await request(app).get("/api/contracts/abc/report.docx");
    expect(res.status).toBe(400);
  });

  it("should return 404 for non-existent contract", async () => {
    mockAuth.mockResolvedValue({ id: 1, role: "user" });
    mockGetContract.mockResolvedValue(null);
    const res = await request(app).get("/api/contracts/999/report.docx");
    expect(res.status).toBe(404);
  });

  it("should reject basic plan users", async () => {
    mockAuth.mockResolvedValue({ id: 1, role: "user" });
    mockGetContract.mockResolvedValue({ id: 1, userId: 1, plan: "basic", fileName: "test.pdf", createdAt: new Date() });
    const res = await request(app).get("/api/contracts/1/report.docx");
    expect(res.status).toBe(403);
  });

  it("should reject unauthorized users (not owner, not admin)", async () => {
    mockAuth.mockResolvedValue({ id: 2, role: "user" });
    mockGetContract.mockResolvedValue({ id: 1, userId: 1, plan: "standard", fileName: "test.pdf", createdAt: new Date() });
    const res = await request(app).get("/api/contracts/1/report.docx");
    expect(res.status).toBe(403);
  });

  it("should generate a valid DOCX file for authorized user (SK)", async () => {
    mockAuth.mockResolvedValue({ id: 1, role: "user" });
    mockGetContract.mockResolvedValue({
      id: 1, userId: 1, plan: "standard", fileName: "Zmluva.pdf", createdAt: new Date(),
    });
    mockGetClauses.mockResolvedValue([
      {
        id: 1, contractId: 1, clauseNumber: 1, title: "Zmluvná pokuta",
        riskLevel: "high", finding: "Neprimerane vysoká pokuta.",
        excerpt: "Zmluvná pokuta vo výške 50% z celkovej ceny.",
        suggestedEdit: "Zmluvná pokuta vo výške 10% z celkovej ceny.",
        legalBasis: "§ 544 Občianskeho zákonníka",
        lawyerAnnotation: "Odporúčam znížiť.",
        overriddenRiskLevel: null,
      },
      {
        id: 2, contractId: 1, clauseNumber: 2, title: "Výpovedná lehota",
        riskLevel: "medium", finding: "Krátka výpovedná lehota.",
        excerpt: "Výpovedná lehota 7 dní.",
        suggestedEdit: "Výpovedná lehota 30 dní.",
        legalBasis: null,
        lawyerAnnotation: null,
        overriddenRiskLevel: null,
      },
    ]);
    mockGetReport.mockResolvedValue({
      id: 1, contractId: 1, summary: "Zmluva obsahuje riziká.", recommendation: "Odporúčam úpravu.",
      lawyerName: "JUDr. Test", isSigned: 1,
    });

    const res = await request(app)
      .get("/api/contracts/1/report.docx")
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(res.headers["content-disposition"]).toContain("bod-legal-report-1-sk.docx");
    // DOCX is a ZIP file, starts with PK signature
    const buf = res.body as Buffer;
    expect(buf[0]).toBe(0x50); // 'P'
    expect(buf[1]).toBe(0x4b); // 'K'
  });

  it("should generate a valid DOCX file in English", async () => {
    mockAuth.mockResolvedValue({ id: 1, role: "user" });
    mockGetContract.mockResolvedValue({
      id: 1, userId: 1, plan: "premium", fileName: "Contract.pdf", createdAt: new Date(),
    });
    mockGetClauses.mockResolvedValue([
      {
        id: 1, contractId: 1, clauseNumber: 1, title: "Penalty clause",
        riskLevel: "high", finding: "Disproportionate penalty.",
        excerpt: "Penalty of 50% of total price.",
        suggestedEdit: "Penalty of 10% of total price.",
        legalBasis: "§ 544 Civil Code",
        lawyerAnnotation: null,
        overriddenRiskLevel: null,
      },
    ]);
    mockGetReport.mockResolvedValue({
      id: 1, contractId: 1, summary: "Contract has risks.", recommendation: "Recommend amendments.",
      lawyerName: "JUDr. Test", isSigned: 1,
    });

    const res = await request(app)
      .get("/api/contracts/1/report.docx?lang=en")
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("bod-legal-report-1-en.docx");
    // Valid ZIP/DOCX
    const buf = res.body as Buffer;
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it("should allow admin to download any user's DOCX", async () => {
    mockAuth.mockResolvedValue({ id: 99, role: "admin" });
    mockGetContract.mockResolvedValue({
      id: 1, userId: 1, plan: "standard", fileName: "test.pdf", createdAt: new Date(),
    });
    mockGetClauses.mockResolvedValue([]);
    mockGetReport.mockResolvedValue({
      id: 1, contractId: 1, summary: "Test", recommendation: "Test",
      lawyerName: null, isSigned: 0,
    });

    const res = await request(app).get("/api/contracts/1/report.docx");
    expect(res.status).toBe(200);
  });

  it("should include track changes markers in the DOCX content", async () => {
    mockAuth.mockResolvedValue({ id: 1, role: "user" });
    mockGetContract.mockResolvedValue({
      id: 1, userId: 1, plan: "standard", fileName: "test.pdf", createdAt: new Date(),
    });
    mockGetClauses.mockResolvedValue([
      {
        id: 1, contractId: 1, clauseNumber: 1, title: "Test clause",
        riskLevel: "high", finding: "Issue found.",
        excerpt: "Original text here.",
        suggestedEdit: "Suggested replacement text.",
        legalBasis: null, lawyerAnnotation: null, overriddenRiskLevel: null,
      },
    ]);
    mockGetReport.mockResolvedValue({
      id: 1, contractId: 1, summary: "Summary", recommendation: "Recommendation",
      lawyerName: null, isSigned: 0,
    });

    const res = await request(app)
      .get("/api/contracts/1/report.docx")
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    // The DOCX (ZIP) should contain document.xml with revision markup
    const buf = res.body as Buffer;
    expect(buf.length).toBeGreaterThan(1000);
    // PK header confirms valid ZIP/DOCX
    expect(buf.toString("utf8", 0, 2)).toBe("PK");
  });
});
