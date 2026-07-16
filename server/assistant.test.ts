import { describe, it, expect, vi, beforeEach } from "vitest";

// All external effects mocked: these tests run without any API keys, network,
// or database.
vi.mock("./db", () => ({
  getContractById: vi.fn(),
  getClausesByContractId: vi.fn(async () => []),
  getReportByContractId: vi.fn(async () => undefined),
  getChatMessages: vi.fn(async () => [{ role: "user", content: "Aké sú riziká?" }]),
  createChatMessage: vi.fn(async () => {}),
  getAttachmentById: vi.fn(async () => undefined),
}));
vi.mock("./storage", () => ({
  storageGetSignedUrl: vi.fn(async () => "https://storage.example.com/file"),
}));
vi.mock("./analysis", () => ({
  extractDocxText: vi.fn(async () => ""),
}));

import { runAssistant, SYSTEM_PROMPTS, getSystemPrompt } from "./assistant";
import { getContractById, getClausesByContractId, getReportByContractId, getChatMessages, createChatMessage } from "./db";

const DASH_RE = /[–—]/; // en dash, em dash

const HANDOFF = {
  sk: "Toto je otázka pre advokáta. Pri Štandardnej a Prémiovej kontrole vám advokát odpovie priamo v reporte.",
  cz: "Toto je otázka pro advokáta. U kontroly Standard a Premium vám advokát odpoví přímo v reportu.",
  en: "This is a question for the lawyer. With the Standard and Premium review the lawyer answers you directly in the report.",
  hu: "Ez ügyvédnek szóló kérdés. A Standard és a Prémium ellenőrzésnél az ügyvéd közvetlenül a jelentésben válaszol Önnek.",
};

function llmFetchMock(reply = "Odpoveď na otázku.") {
  return vi.fn(async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: reply } }] }),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  (getChatMessages as any).mockResolvedValue([{ role: "user", content: "Aké sú riziká?" }]);
  (getClausesByContractId as any).mockResolvedValue([]);
  (getReportByContractId as any).mockResolvedValue(undefined);
});

// ─── Prompt content regression ───────────────────────────────────────────────

describe("assistant SYSTEM_PROMPTS guardrails", () => {
  it("exists for sk, cz, en, hu", () => {
    expect(Object.keys(SYSTEM_PROMPTS).sort()).toEqual(["cz", "en", "hu", "sk"]);
  });

  it.each(Object.keys(SYSTEM_PROMPTS))("%s prompt scopes answers to the analyzed contract and report", (lang) => {
    const p = SYSTEM_PROMPTS[lang];
    const scopeToken = { sk: "iba o analyzovanej zmluve", cz: "pouze o analyzované smlouvě", en: "only about the client's analyzed contract", hu: "Kizárólag az ügyfél elemzett szerződéséről" }[lang as "sk"];
    expect(p).toContain(scopeToken);
  });

  it.each(Object.keys(SYSTEM_PROMPTS))("%s prompt contains the lawyer handoff line", (lang) => {
    expect(SYSTEM_PROMPTS[lang]).toContain(HANDOFF[lang as keyof typeof HANDOFF]);
  });

  it.each(Object.keys(SYSTEM_PROMPTS))("%s prompt refuses invented citations and only reuses analysis citations", (lang) => {
    const p = SYSTEM_PROMPTS[lang];
    const refusal = { sk: "Nikdy si nevymýšľaj citácie", cz: "Nikdy si nevymýšlej citace", en: "Never invent citations", hu: "Soha ne találj ki jogszabályi" }[lang as "sk"];
    const reuse = { sk: "ktoré už sú v analýze zmluvy", cz: "které už jsou v analýze smlouvy", en: "already present in the contract analysis", hu: "amelyek már szerepelnek a szerződés elemzésében" }[lang as "sk"];
    expect(p).toContain(refusal);
    expect(p).toContain(reuse);
  });

  it("sk and cz prompts state the no-dash rule and contain no dash characters", () => {
    expect(SYSTEM_PROMPTS.sk).toContain("Nepoužívaj pomlčky");
    expect(SYSTEM_PROMPTS.cz).toContain("Nepoužívej pomlčky");
    expect(SYSTEM_PROMPTS.sk).not.toMatch(DASH_RE);
    expect(SYSTEM_PROMPTS.cz).not.toMatch(DASH_RE);
  });

  it("prompts forbid guarantees and superlatives", () => {
    expect(SYSTEM_PROMPTS.sk).toContain("Žiadne superlatívy, žiadne záruky výsledku");
    expect(SYSTEM_PROMPTS.cz).toContain("Žádné superlativy, žádné záruky výsledku");
    expect(SYSTEM_PROMPTS.en).toContain("No superlatives, no guarantees of outcome");
  });

  it("falls back to sk for unknown languages", () => {
    expect(getSystemPrompt("de")).toBe(SYSTEM_PROMPTS.sk);
    expect(getSystemPrompt("hu")).toBe(SYSTEM_PROMPTS.hu);
  });
});

// ─── Runtime injection: system prompt on every call ─────────────────────────

describe("runAssistant system-prompt injection", () => {
  it("injects the SK system prompt as the first message when no contract is attached", async () => {
    const fetchMock = llmFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await runAssistant({ userId: 1, contractId: null, userMessage: "Aké sú riziká?" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toBe(SYSTEM_PROMPTS.sk);
  });

  it("injects the system prompt on EVERY call, not only the first", async () => {
    const fetchMock = llmFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await runAssistant({ userId: 1, contractId: null, userMessage: "Prvá otázka" });
    await runAssistant({ userId: 1, contractId: null, userMessage: "Druhá otázka" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls as any[]) {
      const body = JSON.parse(call[1].body);
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[0].content).toContain(HANDOFF.sk);
    }
  });

  it("uses the contract language and grounds the prompt with the stored analysis", async () => {
    (getContractById as any).mockResolvedValue({ id: 9, language: "cz", fileName: "smlouva.pdf" });
    (getClausesByContractId as any).mockResolvedValue([
      { title: "Smluvní pokuta", riskLevel: "high", excerpt: "Pokuta 50000 eur.", finding: "Neprimeraná pokuta.", suggestedEdit: "Snížit.", legalBasis: "Občanský zákoník (89/2012 Sb.), § 2048" },
    ]);
    (getReportByContractId as any).mockResolvedValue({ summary: "Shrnutí rizik.", recommendation: "Doporučení." });
    const fetchMock = llmFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await runAssistant({ userId: 1, contractId: 9, userMessage: "Co s pokutou?" });

    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    const system = body.messages[0].content as string;
    expect(system).toContain(HANDOFF.cz);
    expect(system).toContain("KONTEXT ANALYZOVANEJ ZMLUVY");
    expect(system).toContain("Smluvní pokuta");
    expect(system).toContain("§ 2048");
  });

  it("respects the explicit language option when no contract is attached", async () => {
    const fetchMock = llmFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await runAssistant({ userId: 1, contractId: null, userMessage: "Question", language: "en" });

    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(body.messages[0].content).toBe(SYSTEM_PROMPTS.en);
  });

  it("persists the user message and the assistant reply", async () => {
    vi.stubGlobal("fetch", llmFetchMock("Toto je odpoveď."));

    await runAssistant({ userId: 1, contractId: null, userMessage: "Otázka" });

    const calls = (createChatMessage as any).mock.calls;
    expect(calls[0][0]).toMatchObject({ role: "user", content: "Otázka" });
    expect(calls[1][0]).toMatchObject({ role: "assistant", content: "Toto je odpoveď." });
  });
});
