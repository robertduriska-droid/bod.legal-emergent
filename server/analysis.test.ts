import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

// All external effects mocked: these tests run without any API keys, network,
// or database.
vi.mock("./db", () => ({
  getContractById: vi.fn(),
  createClauses: vi.fn(async () => {}),
  createReport: vi.fn(async () => 1),
  updateContractStatus: vi.fn(async () => {}),
  createNotification: vi.fn(async () => {}),
  getUserById: vi.fn(async () => ({ name: "Test User", email: "client@example.com" })),
  getNotifyPhone: vi.fn(async () => null),
  createDeepAnalysis: vi.fn(async () => {}),
  getActivePlaybookRules: vi.fn(async () => []),
  setContractSourceText: vi.fn(async () => {}),
}));
vi.mock("./storage", () => ({
  storageGetSignedUrl: vi.fn(async () => "https://storage.example.com/file"),
}));
vi.mock("./twilio", () => ({
  notifyClient: vi.fn(async () => {}),
  notifyAdmins: vi.fn(async () => {}),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => {}),
}));
vi.mock("./email", () => ({
  sendEmail: vi.fn(async () => true),
  emailReportReady: vi.fn(() => ({ subject: "s", html: "h" })),
  emailAnalysisAwaitingReview: vi.fn(() => ({ subject: "s", html: "h" })),
  emailNewContractForReview: vi.fn(() => ({ subject: "s", html: "h" })),
  getAppBaseUrl: vi.fn(() => "http://test.local"),
}));
vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

import {
  analysisResultSchema,
  normalizeRawAnalysis,
  getAnalysisJsonSchema,
  buildAnalysisRequest,
  runAnalysisModel,
  selectTopFindings,
  analyzeContract,
  AnalysisValidationError,
  SYSTEM_PROMPTS,
  getSystemPrompt,
} from "./analysis";
import { getContractById, updateContractStatus, createClauses, createReport, createDeepAnalysis } from "./db";
import axios from "axios";

const FIXTURES = path.resolve(__dirname, "__fixtures__");
const validFixture = JSON.parse(fs.readFileSync(path.join(FIXTURES, "analysis-valid.json"), "utf8"));
const invalidFixture = JSON.parse(fs.readFileSync(path.join(FIXTURES, "analysis-invalid.json"), "utf8"));
const skNdaText = fs.readFileSync(path.join(FIXTURES, "contract-sk-nda.txt"), "utf8");
const czDiloText = fs.readFileSync(path.join(FIXTURES, "contract-cz-dilo.txt"), "utf8");

const DASH_RE = /[–—]/; // en dash, em dash

function llmResponse(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content }, finish_reason: "stop" }] }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Schema validation ───────────────────────────────────────────────────────

describe("analysisResultSchema", () => {
  it("accepts the valid fixture as-is (canonical shape)", () => {
    const result = analysisResultSchema.safeParse(validFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clauses).toHaveLength(3);
      expect(result.data.riskSummary.negotiationChecklist.length).toBeGreaterThan(0);
      expect(result.data.riskSummary.missingClauses[0]).toHaveProperty("name");
      expect(result.data.riskSummary.missingClauses[0]).toHaveProperty("why");
      expect(result.data.contractTypeCode).toBe("nda");
      expect(result.data.jurisdiction).toBe("SK");
    }
  });

  it("keeps the legacy consumer fields on every clause", () => {
    const data = analysisResultSchema.parse(validFixture);
    for (const clause of data.clauses) {
      expect(clause).toHaveProperty("clauseNumber");
      expect(clause).toHaveProperty("title");
      expect(clause).toHaveProperty("excerpt");
      expect(clause).toHaveProperty("riskLevel");
      expect(clause).toHaveProperty("finding");
      expect(clause).toHaveProperty("legalBasis");
      expect(clause).toHaveProperty("suggestedEdit");
      // New rich fields alongside
      expect(clause).toHaveProperty("severity");
      expect(clause).toHaveProperty("whyItMatters");
      expect(clause).toHaveProperty("suggestedWording");
      expect(clause).toHaveProperty("negotiationLine");
      expect(clause.citation).toHaveProperty("law");
      expect(clause.citation).toHaveProperty("url");
    }
  });

  it("rejects the invalid fixture even after normalization", () => {
    const result = analysisResultSchema.safeParse(normalizeRawAnalysis(invalidFixture));
    expect(result.success).toBe(false);
  });

  it("normalizes localized severity words and derives riskLevel", () => {
    const raw = JSON.parse(JSON.stringify(validFixture));
    raw.clauses[0].severity = "kritické";
    delete raw.clauses[0].riskLevel;
    raw.clauses[1].severity = "důležité";
    delete raw.clauses[1].riskLevel;
    const result = analysisResultSchema.safeParse(normalizeRawAnalysis(raw));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clauses[0].severity).toBe("critical");
      expect(result.data.clauses[0].riskLevel).toBe("high");
      expect(result.data.clauses[1].severity).toBe("important");
      expect(result.data.clauses[1].riskLevel).toBe("medium");
    }
  });

  it("backfills suggestedWording, citation and riskSummary counts from legacy fields", () => {
    const raw = JSON.parse(JSON.stringify(validFixture));
    delete raw.clauses[0].suggestedWording;
    delete raw.clauses[0].citation;
    delete raw.riskSummary;
    const result = analysisResultSchema.safeParse(normalizeRawAnalysis(raw));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clauses[0].suggestedWording).toBe(raw.clauses[0].suggestedEdit);
      expect(result.data.clauses[0].citation.law).toBe(raw.clauses[0].legalBasis);
      expect(result.data.riskSummary.high).toBe(1);
      expect(result.data.riskSummary.medium).toBe(1);
      expect(result.data.riskSummary.low).toBe(1);
      expect(result.data.riskSummary.negotiationChecklist).toEqual([]);
    }
  });

  it("clamps riskScore into the 1 to 5 range", () => {
    const raw = JSON.parse(JSON.stringify(validFixture));
    raw.riskScore = 99;
    const data = analysisResultSchema.parse(normalizeRawAnalysis(raw));
    expect(data.riskScore).toBe(5);
  });
});

describe("getAnalysisJsonSchema (LLM structured output)", () => {
  it("produces a strict schema: every object closed and fully required", () => {
    const schema = getAnalysisJsonSchema();
    const visit = (node: any) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (node && typeof node === "object") {
        expect(node).not.toHaveProperty("$schema");
        expect(node).not.toHaveProperty("minimum");
        expect(node).not.toHaveProperty("maximum");
        if (node.type === "object" && node.properties) {
          expect(node.additionalProperties).toBe(false);
          expect(node.required).toEqual(Object.keys(node.properties));
        }
        Object.values(node).forEach(visit);
      }
    };
    visit(schema);
    expect(schema.properties.clauses.items.properties).toHaveProperty("severity");
    expect(schema.properties.clauses.items.properties).toHaveProperty("citation");
    expect(schema.properties.clauses.items.properties).toHaveProperty("whyItMatters");
    expect(schema.properties.clauses.items.properties).toHaveProperty("suggestedWording");
    expect(schema.properties.clauses.items.properties).toHaveProperty("negotiationLine");
    expect(schema.properties.riskSummary.properties).toHaveProperty("negotiationChecklist");
    expect(schema.properties.riskSummary.properties).toHaveProperty("missingClauses");
  });
});

// ─── Prompt regression (system prompts + prompt assembly) ────────────────────

describe("SYSTEM_PROMPTS playbook regression", () => {
  const REQUIRED_FIELD_TOKENS = ["severity", "citation", "whyItMatters", "suggestedWording", "negotiationLine", "missingClauses", "negotiationChecklist", "riskScore", "contractTypeCode", "jurisdiction"];

  it("exists for sk, cz, en, hu", () => {
    expect(Object.keys(SYSTEM_PROMPTS).sort()).toEqual(["cz", "en", "hu", "sk"]);
  });

  it.each(Object.keys(SYSTEM_PROMPTS))("%s prompt requires every rich finding field", (lang) => {
    for (const token of REQUIRED_FIELD_TOKENS) {
      expect(SYSTEM_PROMPTS[lang]).toContain(token);
    }
  });

  it.each(Object.keys(SYSTEM_PROMPTS))("%s prompt contains no em or en dashes", (lang) => {
    expect(SYSTEM_PROMPTS[lang]).not.toMatch(DASH_RE);
  });

  // Governing law drives the whole analysis, so every prompt must ask the model
  // to read it off the contract's choice-of-law clause and record the evidence.
  it.each(Object.keys(SYSTEM_PROMPTS))("%s prompt derives the governing law from the contract", (lang) => {
    for (const token of ["jurisdictionBasis", "jurisdictionExplicit", '"SK"', '"CZ"', '"HU"']) {
      expect(SYSTEM_PROMPTS[lang]).toContain(token);
    }
  });

  // Every report is signed by an advokat registered with the Slovak Bar, so the
  // service reviews Slovak law only. Prompts must never cite foreign statutes we
  // cannot stand behind, and must tell the client plainly when a contract falls
  // outside that scope.
  it.each(Object.keys(SYSTEM_PROMPTS))("%s prompt cites no foreign statute databases", (lang) => {
    for (const foreign of ["njt.hu", "ekr.gov.hu"]) {
      expect(SYSTEM_PROMPTS[lang]).not.toContain(foreign);
    }
  });

  it("live prompts flag non-Slovak contracts as unverified by a lawyer", () => {
    expect(SYSTEM_PROMPTS.sk).toContain('AK JURISDICTION NIE JE "SK"');
    expect(SYSTEM_PROMPTS.sk).toContain("BEZ overenia advokátom");
    expect(SYSTEM_PROMPTS.en).toContain('IF JURISDICTION IS NOT "SK"');
    expect(SYSTEM_PROMPTS.en).toContain("WITHOUT lawyer verification");
  });

  it("sk and cz prompts state the no-dash output rule", () => {
    expect(SYSTEM_PROMPTS.sk).toContain("Nepoužívaj pomlčky");
    expect(SYSTEM_PROMPTS.cz).toContain("Nepoužívej pomlčky");
  });

  it("prompts forbid guarantees and invented citations, and mark uncertainty for the lawyer", () => {
    expect(SYSTEM_PROMPTS.sk).toContain("Žiadne záruky");
    expect(SYSTEM_PROMPTS.sk).toContain("iba skutočné zákony");
    expect(SYSTEM_PROMPTS.sk).toContain("na overenie advokátom");
    expect(SYSTEM_PROMPTS.cz).toContain("k ověření advokátem");
    expect(SYSTEM_PROMPTS.en).toContain("to be verified by a lawyer");
    expect(SYSTEM_PROMPTS.hu).toContain("ügyvédi ellenőrzésre szorul");
  });

  it("prompts carry the contract-type classification and per-type missing-clause checklists", () => {
    for (const lang of Object.keys(SYSTEM_PROMPTS)) {
      const p = SYSTEM_PROMPTS[lang];
      for (const code of ["nda", "lease", "purchase", "work", "sla", "employment", "other"]) {
        expect(p).toContain(`"${code}"`);
      }
    }
    expect(SYSTEM_PROMPTS.sk).toContain("zmluvná pokuta za porušenie mlčanlivosti");
    expect(SYSTEM_PROMPTS.cz).toContain("smluvní pokuta za porušení mlčenlivosti");
  });

  it("prompts cite the correct per-jurisdiction sources", () => {
    expect(SYSTEM_PROMPTS.sk).toContain("slov-lex.sk");
    expect(SYSTEM_PROMPTS.cz).toContain("zakonyprolidi.cz");
    expect(SYSTEM_PROMPTS.hu).toContain("slov-lex.sk");
    expect(SYSTEM_PROMPTS.hu).toContain("zakonyprolidi.cz");
  });

  it("prompts state the free-scan top 3 distinct-category rule", () => {
    expect(SYSTEM_PROMPTS.sk).toContain("top 3");
    expect(SYSTEM_PROMPTS.sk).toContain("inej rizikovej kategórie");
    expect(SYSTEM_PROMPTS.cz).toContain("jiné rizikové kategorie");
  });

  it("falls back to sk for unknown languages", () => {
    expect(getSystemPrompt("de")).toBe(SYSTEM_PROMPTS.sk);
  });
});

describe("buildAnalysisRequest (prompt assembly, no model call)", () => {
  // Risk is directional: the model must know whose side it is on, or must be
  // told to label who each risk burdens when the client did not say.
  it("tells the model whose side it is on when the client says so", () => {
    const { messages } = buildAnalysisRequest({
      language: "sk", contractText: skNdaText, plan: "standard", clientParty: "objednávateľ",
    });
    const userText = messages[1].content[0].text as string;
    expect(userText).toContain("zastupuje túto stranu zmluvy: objednávateľ");
    expect(userText).toContain("Návrhy úprav formuluj v jej prospech");
    expect(userText).not.toContain("Nie je známe");
  });

  it("demands per-finding burden labels when the party is unknown", () => {
    const { messages } = buildAnalysisRequest({
      language: "sk", contractText: skNdaText, plan: "standard",
    });
    const userText = messages[1].content[0].text as string;
    expect(userText).toContain("Nie je známe, ktorú stranu zmluvy klient zastupuje");
    expect(userText).toContain("ktorú stranu riziko zaťažuje");
  });

  // The party label is client-typed text; if someone pastes an e-mail or
  // phone number into it, redaction must strip it like everywhere else.
  it("redacts identifiers inside the party label", () => {
    const { messages } = buildAnalysisRequest({
      language: "sk", contractText: skNdaText, plan: "standard",
      clientParty: "objednávateľ, kontakt jan@firma.sk",
    });
    const userText = messages[1].content[0].text as string;
    expect(userText).not.toContain("jan@firma.sk");
    expect(userText).toContain("zastupuje túto stranu zmluvy: objednávateľ");
  });

  it("injects active firm playbook rules into the system prompt", () => {
    const { messages } = buildAnalysisRequest({
      language: "sk", contractText: skNdaText, plan: "standard",
      playbook: ["Vždy skontroluj doložku o vyššej moci.", "Nehlás štandardnú 30-dňovú splatnosť ako riziko."],
    });
    const system = messages[0].content as string;
    expect(system).toContain("PRAVIDLÁ KANCELÁRIE");
    expect(system).toContain("Vždy skontroluj doložku o vyššej moci.");
    expect(system).toContain("Nehlás štandardnú 30-dňovú splatnosť ako riziko.");
  });

  it("adds no playbook block when there are no rules", () => {
    const withNone = buildAnalysisRequest({ language: "sk", contractText: skNdaText, plan: "standard" });
    expect(withNone.messages[0].content).not.toContain("PRAVIDLÁ KANCELÁRIE");
    const withEmpty = buildAnalysisRequest({ language: "sk", contractText: skNdaText, plan: "standard", playbook: ["  ", ""] });
    expect(withEmpty.messages[0].content).not.toContain("PRAVIDLÁ KANCELÁRIE");
  });

  it("assembles the SK NDA request for the basic plan", () => {
    const { messages, responseFormat } = buildAnalysisRequest({ language: "sk", contractText: skNdaText, plan: "basic" });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe(SYSTEM_PROMPTS.sk);
    const userText = messages[1].content[0].text as string;
    expect(userText).toContain("ZMLUVA O MLČANLIVOSTI");
    expect(userText).toContain("ALFA TECH s.r.o.");
    // Schema instructions embedded in the prompt itself
    expect(userText).toContain('"contractTypeCode"');
    expect(userText).toContain('"negotiationLine"');
    // Top 3 rule present for the basic plan
    expect(userText).toContain("bezplatný sken");
    expect(userText).toContain("top 3");
    // Structured output requested
    expect(responseFormat.type).toBe("json_schema");
    expect(responseFormat.json_schema.strict).toBe(true);
    expect(responseFormat.json_schema.schema.properties).toHaveProperty("clauses");
  });

  it("assembles the CZ contract-for-work request without the basic note", () => {
    const { messages } = buildAnalysisRequest({ language: "cz", contractText: czDiloText, plan: "standard" });
    expect(messages[0].content).toBe(SYSTEM_PROMPTS.cz);
    expect(messages[0].content).toContain("zakonyprolidi.cz");
    const userText = messages[1].content[0].text as string;
    expect(userText).toContain("SMLOUVA O DÍLO");
    expect(userText).not.toContain("bezplatný sken");
  });

  it("truncates over-long contract text", () => {
    const { messages } = buildAnalysisRequest({ language: "sk", contractText: "x".repeat(20000), plan: "premium", maxChars: 12000 });
    const userText = messages[1].content[0].text as string;
    expect(userText).toContain("[... zvyšok textu skrátený ...]");
    expect(userText.length).toBeLessThan(30000);
  });

  it("falls back to the SK prompt for unknown languages", () => {
    const { messages } = buildAnalysisRequest({ language: "xx", contractText: "text", plan: "basic" });
    expect(messages[0].content).toBe(SYSTEM_PROMPTS.sk);
  });
});

// ─── Model call: validate, repair-retry once, hard fail ─────────────────────

describe("runAnalysisModel", () => {
  it("returns the parsed result when the first response is valid", async () => {
    const fetchMock = vi.fn(async () => llmResponse(JSON.stringify(validFixture)));
    vi.stubGlobal("fetch", fetchMock);
    const req = buildAnalysisRequest({ language: "sk", contractText: skNdaText, plan: "basic" });
    const result = await runAnalysisModel({ messages: req.messages, responseFormat: req.responseFormat });
    expect(result.clauses).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries ONCE with a repair instruction, then succeeds", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(llmResponse("this is not json at all"))
      .mockResolvedValueOnce(llmResponse(JSON.stringify(validFixture)));
    vi.stubGlobal("fetch", fetchMock);
    const req = buildAnalysisRequest({ language: "sk", contractText: skNdaText, plan: "basic" });
    const result = await runAnalysisModel({ messages: req.messages, responseFormat: req.responseFormat });
    expect(result.riskScore).toBe(4);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const lastMessage = secondBody.messages[secondBody.messages.length - 1];
    expect(lastMessage.role).toBe("user");
    expect(lastMessage.content).toContain("nebola validný JSON");
    expect(lastMessage.content).toContain("Validation errors");
  });

  it("repairs schema violations too, not only broken JSON", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(llmResponse(JSON.stringify(invalidFixture)))
      .mockResolvedValueOnce(llmResponse(JSON.stringify(validFixture)));
    vi.stubGlobal("fetch", fetchMock);
    const req = buildAnalysisRequest({ language: "sk", contractText: skNdaText, plan: "basic" });
    const result = await runAnalysisModel({ messages: req.messages, responseFormat: req.responseFormat });
    expect(result.contractTypeCode).toBe("nda");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("hard-fails with AnalysisValidationError after the second invalid response", async () => {
    const fetchMock = vi.fn(async () => llmResponse("garbage"));
    vi.stubGlobal("fetch", fetchMock);
    const req = buildAnalysisRequest({ language: "sk", contractText: skNdaText, plan: "basic" });
    await expect(runAnalysisModel({ messages: req.messages, responseFormat: req.responseFormat }))
      .rejects.toBeInstanceOf(AnalysisValidationError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ─── Top findings selection (free-scan top 3 rule) ───────────────────────────

describe("selectTopFindings", () => {
  const mk = (riskLevel: "high" | "medium" | "low", riskCategory: string | null, title: string) => ({
    title,
    riskLevel,
    finding: `Finding for ${title}`,
    riskCategory,
  });

  it("picks the highest severity findings from distinct categories", () => {
    const picked = selectTopFindings([
      mk("high", "liability_indemnity", "A"),
      mk("high", "liability_indemnity", "B"),
      mk("medium", "price_payment", "C"),
      mk("low", "scope_performance", "D"),
    ]);
    expect(picked.map(p => p.title)).toEqual(["A", "C", "D"]);
  });

  it("fills from remaining findings when there are not enough distinct categories", () => {
    const picked = selectTopFindings([
      mk("high", "liability_indemnity", "A"),
      mk("high", "liability_indemnity", "B"),
      mk("medium", "liability_indemnity", "C"),
    ]);
    expect(picked).toHaveLength(3);
    expect(picked[0].title).toBe("A");
  });

  it("truncates long finding text to 120 characters plus ellipsis", () => {
    const long = { title: "L", riskLevel: "high" as const, finding: "y".repeat(200), riskCategory: null };
    const picked = selectTopFindings([long]);
    expect(picked[0].finding).toHaveLength(123);
    expect(picked[0].finding.endsWith("...")).toBe(true);
  });
});

// ─── analyzeContract end to end (mocked LLM + storage + db) ─────────────────

async function makeDocxBuffer(text: string): Promise<ArrayBuffer> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("word/document.xml", `<w:document><w:body><w:p><w:r><w:t>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r></w:p></w:body></w:document>`);
  return zip.generateAsync({ type: "arraybuffer" });
}

const CONTRACT = {
  id: 42,
  userId: 7,
  fileName: "nda.docx",
  fileKey: "uploads/nda.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  plan: "standard",
  language: "sk",
  status: "pending",
};

describe("analyzeContract", () => {
  beforeEach(async () => {
    (getContractById as any).mockResolvedValue(CONTRACT);
    (axios.get as any).mockResolvedValue({ data: await makeDocxBuffer(skNdaText) });
  });

  it("persists legacy-compatible clauses, the rich riskSummary and derived deep analysis on success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => llmResponse(JSON.stringify(validFixture))));

    await analyzeContract(42);

    // Status: analyzing -> in_review (standard plan)
    expect((updateContractStatus as any).mock.calls[0]).toEqual([42, "analyzing"]);
    expect((updateContractStatus as any).mock.calls[1]).toEqual([42, "in_review"]);

    // Clause records keep the legacy consumer fields populated
    const records = (createClauses as any).mock.calls[0][0];
    expect(records).toHaveLength(3);
    expect(records[0].riskLevel).toBe("high");
    expect(records[0].title).toBe("Zmluvná pokuta za porušenie mlčanlivosti");
    // suggestedEdit carries the paste-ready wording
    expect(records[0].suggestedEdit).toBe(validFixture.clauses[0].suggestedWording);
    // whyItMatters + negotiationLine folded into the finding text
    expect(records[0].finding).toContain(validFixture.clauses[0].finding);
    expect(records[0].finding).toContain("Prečo je to dôležité:");
    expect(records[0].finding).toContain("Veta na rokovanie:");
    expect(records[0].legalBasis).toContain("Obchodný zákonník");
    expect(records[0].legalSourceUrl).toContain("slov-lex.sk");

    // Report row carries the rich riskSummary for WP2's checklist rendering
    const reportRow = (createReport as any).mock.calls[0][0];
    expect(reportRow.riskSummary.high).toBe(1);
    expect(reportRow.riskSummary.negotiationChecklist.length).toBeGreaterThan(0);
    expect(reportRow.riskSummary.missingClauses[0].name).toBe("Vrátenie alebo zničenie podkladov");

    // Deep analysis derives missingProvisions from riskSummary.missingClauses
    const deepRow = (createDeepAnalysis as any).mock.calls[0][0];
    expect(deepRow.riskScore).toBe(4);
    expect(deepRow.missingProvisions).toEqual([
      { title: "Vrátenie alebo zničenie podkladov", detail: "Zmluva neupravuje, čo sa stane s dôvernými podkladmi po skončení spolupráce." },
    ]);
  });

  it("marks the contract failed (pending, no failed enum value exists) after the repair retry also fails", async () => {
    const fetchMock = vi.fn(async () => llmResponse("still not json"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeContract(42)).rejects.toBeInstanceOf(AnalysisValidationError);

    expect(fetchMock).toHaveBeenCalledTimes(2); // one attempt + ONE repair retry
    expect((updateContractStatus as any).mock.calls[0]).toEqual([42, "analyzing"]);
    const lastCall = (updateContractStatus as any).mock.calls.at(-1);
    expect(lastCall).toEqual([42, "pending"]);
    // Nothing half-written
    expect(createClauses as any).not.toHaveBeenCalled();
    expect(createReport as any).not.toHaveBeenCalled();
  });

  it("marks a basic-plan contract completed", async () => {
    (getContractById as any).mockResolvedValue({ ...CONTRACT, plan: "basic" });
    vi.stubGlobal("fetch", vi.fn(async () => llmResponse(JSON.stringify(validFixture))));

    await analyzeContract(42);

    expect((updateContractStatus as any).mock.calls[1]).toEqual([42, "completed"]);
  });
});
