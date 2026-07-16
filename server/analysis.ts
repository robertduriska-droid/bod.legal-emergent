import { z } from "zod";
import { ENV } from "./_core/env";
import { getContractById, createClauses, createReport, updateContractStatus, createNotification, getUserById, getNotifyPhone, createDeepAnalysis } from "./db";
import { notifyOwner } from "./_core/notification";
import { notifyClient, notifyAdmins } from "./twilio";
import { sendEmail, emailReportReady, emailAnalysisAwaitingReview, emailNewContractForReview, getAppBaseUrl } from "./email";
import { storageGetSignedUrl } from "./storage";
import { RISK_CATEGORIES } from "@shared/types";
import { DEFAULT_ANALYSIS_MODEL } from "@shared/const";
import { redact, summarizeRedaction, type RedactionCounts } from "./redact";
import axios from "axios";

// Deep contract-analysis model. Override with the ANALYSIS_MODEL env var;
// otherwise a frontier default (see shared/const). Routed through the
// OpenAI-compatible gateway set by BUILT_IN_FORGE_API_URL/_KEY (OpenRouter).
const ANALYSIS_MODEL = ENV.analysisModel || DEFAULT_ANALYSIS_MODEL;

/**
 * Raw LLM call that supports max_completion_tokens for GPT models.
 * The built-in invokeLLM uses max_tokens which causes issues with GPT reasoning models.
 */
async function callLLM(params: {
  model: string;
  max_completion_tokens: number;
  messages: any[];
  response_format?: any;
  reasoning?: any;
}) {
  const url = `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
  // OpenAI reasoning models (gpt-5*, o*) want max_completion_tokens + reasoning;
  // Claude / Gemini via the gateway use the standard max_tokens. Strip any
  // "provider/" prefix (OpenRouter slugs) before matching.
  const bare = params.model.split("/").pop() || params.model;
  const isOpenAIReasoning = /^(gpt-5|o\d)/.test(bare);
  const payload: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
  };
  if (isOpenAIReasoning) {
    payload.max_completion_tokens = params.max_completion_tokens;
    if (params.reasoning) payload.reasoning = params.reasoning;
  } else {
    payload.max_tokens = params.max_completion_tokens;
  }
  if (params.response_format) payload.response_format = params.response_format;

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (attempt < MAX_RETRIES) {
          console.warn(`[Analysis] LLM retry ${attempt + 1}/${MAX_RETRIES} after status ${response.status}: ${errText.substring(0, 200)}`);
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
          continue;
        }
        throw new Error(`LLM request failed: ${response.status} - ${errText.substring(0, 500)}`);
      }

      return await response.json() as any;
    } catch (err: any) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[Analysis] LLM retry ${attempt + 1}/${MAX_RETRIES} after error: ${err.message}`);
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastError || new Error("LLM request failed after retries");
}

/**
 * Extract text from a DOCX file by downloading and parsing the XML content.
 */
export async function extractDocxText(fileUrl: string): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  const zip = await JSZip.loadAsync(response.data);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("Invalid DOCX: no word/document.xml found");
  const text = docXml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

/**
 * Extract text from a PDF by downloading it and reading each page with pdf.js.
 * Provider-neutral (works with any LLM gateway), replaces the Manus-only
 * `file_url` attachment path.
 */
export async function extractPdfText(fileUrl: string): Promise<string> {
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  // Non-literal specifier keeps the bundler/type-checker off the deep subpath;
  // the package is external at runtime.
  const specifier = "pdfjs-dist/legacy/build/pdf.mjs";
  const pdfjs: any = await import(specifier);
  const data = new Uint8Array(response.data as ArrayBuffer);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it: any) => it.str ?? "").join(" "));
  }
  return pages.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── Versioned output schema (zod) ──────────────────────────────────────────
// Version history: v2 adds severity, citation, whyItMatters, suggestedWording,
// negotiationLine per finding + contract-type classification + rich riskSummary
// (negotiationChecklist, missingClauses). Legacy fields (clauseNumber, title,
// excerpt, riskLevel, finding, suggestedEdit, legalBasis, legalSourceUrl,
// riskCategory) are kept so existing consumers keep working.
export const ANALYSIS_SCHEMA_VERSION = 2;

const severityEnum = z.enum(["critical", "important", "minor"]);
const riskLevelEnum = z.enum(["high", "medium", "low"]);

const citationSchema = z.strictObject({
  /** Statute name + number, e.g. "Obchodný zákonník (513/1991 Zb.)" */
  law: z.string(),
  /** Section, e.g. "§ 379" */
  section: z.string(),
  /** Subsection, e.g. "ods. 1"; empty string when not applicable */
  paragraph: z.string(),
  /** Link to slov-lex.sk, zakonyprolidi.cz, or eur-lex.europa.eu */
  url: z.string(),
});

const clauseFindingSchema = z.strictObject({
  clauseNumber: z.number().int(),
  title: z.string(),
  excerpt: z.string(),
  riskLevel: riskLevelEnum,
  severity: severityEnum,
  finding: z.string(),
  whyItMatters: z.string(),
  suggestedEdit: z.string(),
  suggestedWording: z.string(),
  negotiationLine: z.string(),
  legalBasis: z.string(),
  legalSourceUrl: z.string(),
  citation: citationSchema,
  riskCategory: z.string(),
});

const missingClauseSchema = z.strictObject({
  name: z.string(),
  why: z.string(),
});

const richRiskSummarySchema = z.strictObject({
  high: z.number().int(),
  medium: z.number().int(),
  low: z.number().int(),
  negotiationChecklist: z.array(z.string()),
  missingClauses: z.array(missingClauseSchema),
});

export const analysisResultSchema = z.strictObject({
  /** Human-readable contract type in the report language */
  contractType: z.string(),
  /** Machine classification of the contract type */
  contractTypeCode: z.enum(["nda", "lease", "purchase", "work", "sla", "employment", "other"]),
  /** Governing-law jurisdiction, determined from the contract's governing-law clause.
   *  Only "SK" is reviewed and signed by our advokat; anything else is flagged
   *  to the client as outside the service (see SUPPORTED_JURISDICTION). */
  jurisdiction: z.enum(["SK", "CZ", "HU", "EU", "OTHER"]),
  /** Quote of the governing-law clause the jurisdiction was read from. Empty when the contract has none. */
  jurisdictionBasis: z.string(),
  /** True only when an explicit governing-law clause exists; false when inferred from other signals. */
  jurisdictionExplicit: z.boolean(),
  clauses: z.array(clauseFindingSchema),
  summary: z.string(),
  recommendation: z.string(),
  riskSummary: richRiskSummarySchema,
  /** Overall risk 1 (safe) to 5 (critical) */
  riskScore: z.number().int(),
  dealBreakers: z.array(z.strictObject({ title: z.string(), detail: z.string() })),
  verificationNotes: z.string(),
  applicableLegalSources: z.array(z.strictObject({
    id: z.string(),
    name: z.string(),
    instrument: z.string(),
    url: z.string(),
  })),
});

export type RichAnalysisResult = z.infer<typeof analysisResultSchema>;
export type RichRiskSummary = z.infer<typeof richRiskSummarySchema>;
export type ClauseFinding = z.infer<typeof clauseFindingSchema>;

/** Thrown when the model output fails schema validation even after one repair retry. */
export class AnalysisValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisValidationError";
  }
}

/**
 * JSON Schema for the LLM response_format, generated from the zod schema so
 * the two can never drift. Sanitized for strict structured-output mode:
 * no $schema/minimum/maximum keywords, additionalProperties always false,
 * every property required.
 */
function sanitizeJsonSchema(node: any): any {
  if (Array.isArray(node)) return node.map(sanitizeJsonSchema);
  if (node && typeof node === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "$schema" || k === "minimum" || k === "maximum") continue;
      out[k] = sanitizeJsonSchema(v);
    }
    if (out.type === "object" && out.properties) {
      out.additionalProperties = false;
      out.required = Object.keys(out.properties);
    }
    return out;
  }
  return node;
}

export function getAnalysisJsonSchema(): Record<string, any> {
  return sanitizeJsonSchema(z.toJSONSchema(analysisResultSchema));
}

// ─── Response normalization ─────────────────────────────────────────────────
// Fix format drift (localized severity words, missing derivable fields) before
// zod validation so only genuinely broken outputs trigger the repair retry.

const SEVERITY_SYNONYMS: Record<string, "critical" | "important" | "minor"> = {
  critical: "critical", kriticke: "critical", "kritické": "critical", "kritická": "critical", kritikus: "critical", high: "critical", vysoke: "critical", "vysoké": "critical",
  important: "important", dolezite: "important", "dôležité": "important", "důležité": "important", fontos: "important", medium: "important", stredne: "important", "stredné": "important",
  minor: "minor", drobne: "minor", "drobné": "minor", apro: "minor", "apró": "minor", low: "minor", nizke: "minor", "nízke": "minor",
};

const SEVERITY_TO_RISK: Record<string, "high" | "medium" | "low"> = {
  critical: "high", important: "medium", minor: "low",
};
const RISK_TO_SEVERITY: Record<string, "critical" | "important" | "minor"> = {
  high: "critical", medium: "important", low: "minor",
};

const CONTRACT_TYPE_SYNONYMS: Record<string, RichAnalysisResult["contractTypeCode"]> = {
  nda: "nda", mlcanlivost: "nda", "mlčanlivosť": "nda",
  lease: "lease", najomna: "lease", "nájomná": "lease", najem: "lease", "nájem": "lease", "nájemní": "lease",
  purchase: "purchase", kupna: "purchase", "kúpna": "purchase", "kupní": "purchase",
  work: "work", dielo: "work", "o dielo": "work", "dílo": "work", "o dílo": "work",
  sla: "sla",
  employment: "employment", pracovna: "employment", "pracovná": "employment", "pracovní": "employment",
  other: "other", ina: "other", "iná": "other", "jiná": "other",
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asInt(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : undefined;
}

/**
 * Normalize a raw parsed model response toward the schema shape. Only formats
 * are fixed and derivable fields filled; required content (titles, findings)
 * is never invented, so genuinely bad outputs still fail validation.
 */
export function normalizeRawAnalysis(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const src = raw as Record<string, any>;
  const out: Record<string, any> = {};

  // Clauses
  const rawClauses = src.clauses;
  if (Array.isArray(rawClauses)) {
    out.clauses = rawClauses.map((c: any, i: number) => {
      if (!c || typeof c !== "object") return c;
      const sevKey = asString(c.severity)?.toLowerCase().trim();
      const riskKey = asString(c.riskLevel)?.toLowerCase().trim();
      let severity = sevKey ? SEVERITY_SYNONYMS[sevKey] : undefined;
      let riskLevel = riskKey && ["high", "medium", "low"].includes(riskKey) ? riskKey : undefined;
      if (!severity && riskLevel) severity = RISK_TO_SEVERITY[riskLevel];
      if (!riskLevel && severity) riskLevel = SEVERITY_TO_RISK[severity];

      let citation = c.citation;
      if (typeof citation === "string") {
        citation = { law: citation, section: "", paragraph: "", url: asString(c.legalSourceUrl) ?? "" };
      } else if (citation && typeof citation === "object") {
        citation = {
          law: asString(citation.law) ?? "",
          section: asString(citation.section) ?? "",
          paragraph: asString(citation.paragraph) ?? "",
          url: asString(citation.url) ?? asString(c.legalSourceUrl) ?? "",
        };
      } else if (asString(c.legalBasis) || asString(c.legalSourceUrl)) {
        citation = { law: asString(c.legalBasis) ?? "", section: "", paragraph: "", url: asString(c.legalSourceUrl) ?? "" };
      }

      const suggestedWording = asString(c.suggestedWording) ?? asString(c.suggestedEdit);
      const suggestedEdit = asString(c.suggestedEdit) ?? asString(c.suggestedWording);
      const legalBasis = asString(c.legalBasis)
        ?? (citation && citation.law ? [citation.law, citation.section, citation.paragraph].filter(Boolean).join(", ") : undefined);
      const legalSourceUrl = asString(c.legalSourceUrl) ?? (citation ? asString(citation.url) : undefined);

      return {
        clauseNumber: asInt(c.clauseNumber) ?? i + 1,
        title: c.title,
        excerpt: asString(c.excerpt) ?? "",
        riskLevel,
        severity,
        finding: c.finding,
        whyItMatters: c.whyItMatters,
        suggestedEdit: suggestedEdit ?? "",
        suggestedWording,
        negotiationLine: c.negotiationLine,
        legalBasis: legalBasis ?? "",
        legalSourceUrl: legalSourceUrl ?? "",
        citation,
        riskCategory: asString(c.riskCategory) ?? "",
      };
    });
  } else {
    out.clauses = rawClauses;
  }

  // Risk summary (recompute counts from clauses when missing)
  const rs = src.riskSummary && typeof src.riskSummary === "object" ? src.riskSummary : {};
  const clauseArr: any[] = Array.isArray(out.clauses) ? out.clauses : [];
  const countBy = (level: string) => clauseArr.filter(c => c && c.riskLevel === level).length;
  out.riskSummary = {
    high: asInt(rs.high) ?? countBy("high"),
    medium: asInt(rs.medium) ?? countBy("medium"),
    low: asInt(rs.low) ?? countBy("low"),
    negotiationChecklist: Array.isArray(rs.negotiationChecklist)
      ? rs.negotiationChecklist.filter((x: unknown) => typeof x === "string")
      : [],
    missingClauses: Array.isArray(rs.missingClauses)
      ? rs.missingClauses
          .filter((m: any) => m && typeof m === "object")
          .map((m: any) => ({ name: asString(m.name) ?? asString(m.title) ?? "", why: asString(m.why) ?? asString(m.detail) ?? "" }))
      : Array.isArray(src.missingProvisions)
        ? src.missingProvisions
            .filter((m: any) => m && typeof m === "object")
            .map((m: any) => ({ name: asString(m.title) ?? "", why: asString(m.detail) ?? "" }))
        : [],
  };

  // Classification
  out.contractType = src.contractType;
  const typeKey = asString(src.contractTypeCode)?.toLowerCase().trim();
  out.contractTypeCode = (typeKey && CONTRACT_TYPE_SYNONYMS[typeKey]) || "other";
  const jur = asString(src.jurisdiction)?.toUpperCase().trim();
  out.jurisdiction = jur && ["SK", "CZ", "HU", "EU"].includes(jur) ? jur : "OTHER";
  out.jurisdictionBasis = asString(src.jurisdictionBasis) ?? "";
  // Only an explicit true counts; anything else means the client must confirm.
  out.jurisdictionExplicit = src.jurisdictionExplicit === true;

  // Narrative + deep-analysis fields
  out.summary = src.summary;
  out.recommendation = src.recommendation;
  out.riskScore = Math.min(5, Math.max(1, asInt(src.riskScore) ?? 3));
  out.dealBreakers = Array.isArray(src.dealBreakers)
    ? src.dealBreakers.filter((d: any) => d && typeof d === "object").map((d: any) => ({ title: asString(d.title) ?? "", detail: asString(d.detail) ?? "" }))
    : [];
  out.verificationNotes = asString(src.verificationNotes) ?? "";
  out.applicableLegalSources = Array.isArray(src.applicableLegalSources)
    ? src.applicableLegalSources.filter((s: any) => s && typeof s === "object").map((s: any) => ({
        id: asString(s.id) ?? "",
        name: asString(s.name) ?? "",
        instrument: asString(s.instrument) ?? "",
        url: asString(s.url) ?? "",
      }))
    : [];

  return out;
}

/**
 * Lenient JSON extraction: direct parse, fenced block, first brace match,
 * then a truncation repair (close open brackets/braces).
 */
export function parseJsonLoose(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (parseErr) {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        let repaired = jsonMatch[1].trim();
        repaired = repaired.replace(/,\s*\{[^}]*$/, "");
        repaired = repaired.replace(/,\s*"[^"]*$/, "");
        repaired = repaired.replace(/,\s*$/, "");
        const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
        const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
        for (let i = 0; i < openBrackets; i++) repaired += "]";
        for (let i = 0; i < openBraces; i++) repaired += "}";
        return JSON.parse(repaired);
      }
    }
    throw new Error(`JSON parse failed: ${(parseErr as Error).message}`);
  }
}

// ─── System prompts (structured analysis playbook, per language) ────────────
// SK is the reference wording; CZ, EN, HU mirror it. House rules baked into
// every prompt: no em or en dashes in SK/CZ output, no guarantees, only real
// statute citations, uncertain findings marked for lawyer verification.

export const SYSTEM_PROMPTS: Record<string, string> = {
  sk: `Si právny AI analytik služby bod.legal. Analyzuješ zmluvy podľa slovenského a európskeho práva pre klientov, ktorí nie sú právnici. Službu prevádzkuje advokátska kancelária KILIAN LEGAL s.r.o. a reporty overuje a podpisuje advokát zapísaný v Slovenskej advokátskej komore. Preto kontrolujeme zmluvy podľa slovenského práva.

POSTUP (presne v tomto poradí):

1. KLASIFIKÁCIA. Najprv urč typ zmluvy a rozhodné právo:
   contractTypeCode: jeden z "nda", "lease" (nájomná), "purchase" (kúpna), "work" (o dielo), "sla", "employment" (pracovná), "other" (iná).
   ROZHODNÉ PRÁVO. Nájdi v zmluve doložku o rozhodnom práve (voľba práva, "riadi sa právom", "governing law", "irányadó jog"). Podľa nej urč:
   jurisdiction: "SK" (slovenské právo), "CZ" (české právo), "HU" (maďarské právo), inak "EU" alebo "OTHER".
   jurisdictionBasis: doslovná citácia doložky, z ktorej si právo určil, aj s číslom článku. Ak zmluva doložku nemá, nechaj prázdny reťazec.
   jurisdictionExplicit: true iba ak zmluva výslovnú doložku o rozhodnom práve obsahuje. Ak si právo odvodil nepriamo (sídla strán, jazyk, mena, odkazy na zákony), daj false a v summary klienta upozorni, že rozhodné právo treba potvrdiť.
   AK JURISDICTION NIE JE "SK": bod.legal kontroluje zmluvy podľa slovenského práva, lebo report podpisuje advokát zapísaný v Slovenskej advokátskej komore. V takom prípade:
   - hneď v prvej vete summary napíš, ktorým právom sa zmluva riadi a že tento report je iba informatívna AI analýza BEZ overenia advokátom,
   - v recommendation odporuč klientovi advokáta oprávneného v danom štáte,
   - klauzuly aj tak analyzuj, ale všeobecne a opatrne, cituj iba právo EÚ a všeobecné zmluvné zásady, nevymýšľaj si paragrafy cudzieho práva.
   Celú analýzu rob podľa práva, ktoré si takto určil, nie podľa jazyka zmluvy.
   contractType: názov typu zmluvy po slovensky, napríklad "Zmluva o dielo".

2. KONTROLA CHÝBAJÚCICH KLAUZÚL podľa typu zmluvy. Výsledok zapíš do riskSummary.missingClauses ako pole objektov {name, why}. Kontrolný zoznam podľa typu:
   NDA: zmluvná pokuta za porušenie mlčanlivosti, doba trvania mlčanlivosti, definícia dôverných informácií, výnimky z mlčanlivosti, vrátenie alebo zničenie podkladov.
   Nájomná: predmet nájmu, výška a splatnosť nájomného, doba nájmu a výpovedné podmienky, kaucia, opravy a údržba, stav pri odovzdaní.
   Kúpna: predmet kúpy, kúpna cena a splatnosť, prechod vlastníctva a nebezpečenstva škody, zodpovednosť za vady, dodacie podmienky.
   O dielo: vymedzenie diela, cena a platobné podmienky, termín a spôsob odovzdania, záruka a zodpovednosť za vady, zmluvná pokuta za omeškanie, práva k výstupom.
   SLA: definícia služieb, dostupnosť a metriky, kredity za nedodržanie úrovne, reakčné časy, podpora, ukončenie a exit.
   Pracovná: druh práce, miesto výkonu práce, deň nástupu, mzda, skúšobná doba, pracovný čas.
   Iná: podstatné náležitosti podľa povahy zmluvy.

3. ANALÝZA KLAUZÚL. Analyzuj najviac 8 najrizikovejších klauzúl. Pre každú vyplň všetky polia:
   severity: "critical" (v texte reportu tomu zodpovedá slovo kritické), "important" (dôležité) alebo "minor" (drobné).
   riskLevel: "high" pre critical, "medium" pre important, "low" pre minor.
   citation: objekt {law, section, paragraph, url}. law je názov a číslo zákona, section je paragraf (napríklad "§ 379"), paragraph je odsek (napríklad "ods. 1", inak prázdny reťazec), url je odkaz na slov-lex.sk pre slovenské právo, eur-lex.europa.eu pre právo EÚ. Pri inom ako slovenskom rozhodnom práve cituj iba právo EÚ.
   whyItMatters: najviac 2 krátke vety jednoduchou slovenčinou, prečo je nález pre klienta dôležitý.
   suggestedWording: hotové znenie klauzuly, ktoré klient môže rovno vložiť do zmluvy.
   suggestedEdit: stručný popis navrhovanej úpravy.
   negotiationLine: jedna veta, ktorú klient povie alebo napíše druhej strane pri rokovaní.
   finding: vecný popis problému. excerpt: citácia textu klauzuly. title, clauseNumber: názov a poradie klauzuly.
   legalBasis: textová citácia (zákon, paragraf, odsek). legalSourceUrl: rovnaká URL ako citation.url.
   riskCategory: jedna z kategórií uvedených v zadaní.

4. ZHRNUTIE. summary: zhrnutie jednoduchou slovenčinou. recommendation: odporúčanie ďalšieho postupu. riskSummary.high, riskSummary.medium, riskSummary.low: počty klauzúl podľa riskLevel.

5. KONTROLNÝ ZOZNAM NA ROKOVANIE. riskSummary.negotiationChecklist: 3 až 7 krátkych bodov, čo si má klient vypýtať alebo overiť pred podpisom, od najdôležitejšieho.

6. HĹBKOVÁ KONTROLA. dealBreakers: zásadné problémy, pre ktoré klient nemá zmluvu podpísať, ako pole {title, detail}. verificationNotes: krátke zhrnutie tvojej vlastnej kontroly konzistencie nálezov. riskScore: celkové riziko od 1 (bezpečné) do 5 (kritické).

PRÁVNE ZDROJE (cituj iba skutočné predpisy):
Občiansky zákonník (40/1964 Zb.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/
Obchodný zákonník (513/1991 Zb.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/
Zákonník práce (311/2001 Z.z.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2001/311/
Zákon o ochrane osobných údajov (18/2018 Z.z.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2018/18/
GDPR (2016/679), https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng

TVRDÉ PRAVIDLÁ:
Píš po slovensky, jednoducho, aby textu rozumel aj laik.
Nepoužívaj pomlčky, dlhé ani stredné. Používaj čiarky a bodky.
Žiadne záruky ani sľuby výsledku.
Cituj iba skutočné zákony a paragrafy. Ak si citáciou nie si istý, citáciu vynechaj a na koniec poľa finding pridaj text "na overenie advokátom".
Ceny píš v tvare "X eur".
Odpovedz iba validným JSON podľa zadanej schémy, bez akéhokoľvek ďalšieho textu.

BEZPLATNÝ SKEN: klient s plánom basic vidí iba top 3 nálezy. Top 3 sú nálezy s najvyššou závažnosťou, každý z inej rizikovej kategórie (riskCategory). Pole clauses zoraď od najzávažnejšieho nálezu.`,

  cz: `Jsi právní AI analytik služby bod.legal. Analyzuješ smlouvy podle českého a evropského práva pro klienty, kteří nejsou právníci.

POSTUP (přesně v tomto pořadí):

1. KLASIFIKACE. Nejprve urči typ smlouvy a rozhodné právo:
   contractTypeCode: jeden z "nda", "lease" (nájemní), "purchase" (kupní), "work" (o dílo), "sla", "employment" (pracovní), "other" (jiná).
   ROZHODNÉ PRÁVO. Najdi ve smlouvě doložku o rozhodném právu (volba práva, "řídí se právem", "governing law", "irányadó jog"). Podle ní urči:
   jurisdiction: "SK" (slovenské právo), "CZ" (české právo), "HU" (maďarské právo), jinak "EU" nebo "OTHER".
   jurisdictionBasis: doslovná citace doložky, ze které jsi právo určil, včetně čísla článku. Pokud smlouva doložku nemá, nech prázdný řetězec.
   jurisdictionExplicit: true jen pokud smlouva výslovnou doložku o rozhodném právu obsahuje. Pokud jsi právo odvodil nepřímo (sídla stran, jazyk, měna, odkazy na zákony), dej false a v summary klienta upozorni, že rozhodné právo je třeba potvrdit.
   Celou analýzu dělej podle práva, které jsi takto určil, ne podle jazyka smlouvy.
   contractType: název typu smlouvy česky, například "Smlouva o dílo".

2. KONTROLA CHYBĚJÍCÍCH KLAUZULÍ podle typu smlouvy. Výsledek zapiš do riskSummary.missingClauses jako pole objektů {name, why}. Kontrolní seznam podle typu:
   NDA: smluvní pokuta za porušení mlčenlivosti, doba trvání mlčenlivosti, definice důvěrných informací, výjimky z mlčenlivosti, vrácení nebo zničení podkladů.
   Nájemní: předmět nájmu, výše a splatnost nájemného, doba nájmu a výpovědní podmínky, kauce, opravy a údržba, stav při předání.
   Kupní: předmět koupě, kupní cena a splatnost, přechod vlastnictví a nebezpečí škody, odpovědnost za vady, dodací podmínky.
   O dílo: vymezení díla, cena a platební podmínky, termín a způsob předání, záruka a odpovědnost za vady, smluvní pokuta za prodlení, práva k výstupům.
   SLA: definice služeb, dostupnost a metriky, kredity za nedodržení úrovně, reakční časy, podpora, ukončení a exit.
   Pracovní: druh práce, místo výkonu práce, den nástupu, mzda, zkušební doba, pracovní doba.
   Jiná: podstatné náležitosti podle povahy smlouvy.

3. ANALÝZA KLAUZULÍ. Analyzuj nejvýše 8 nejrizikovějších klauzulí. Pro každou vyplň všechna pole:
   severity: "critical" (v textu reportu tomu odpovídá slovo kritické), "important" (důležité) nebo "minor" (drobné).
   riskLevel: "high" pro critical, "medium" pro important, "low" pro minor.
   citation: objekt {law, section, paragraph, url}. law je název a číslo zákona, section je paragraf (například "§ 2586"), paragraph je odstavec (například "odst. 1", jinak prázdný řetězec), url je odkaz na zakonyprolidi.cz pro české právo, slov-lex.sk pro slovenské právo, eur-lex.europa.eu pro právo EU.
   whyItMatters: nejvýše 2 krátké věty jednoduchou češtinou, proč je nález pro klienta důležitý.
   suggestedWording: hotové znění klauzule, které klient může rovnou vložit do smlouvy.
   suggestedEdit: stručný popis navrhované úpravy.
   negotiationLine: jedna věta, kterou klient řekne nebo napíše druhé straně při jednání.
   finding: věcný popis problému. excerpt: citace textu klauzule. title, clauseNumber: název a pořadí klauzule.
   legalBasis: textová citace (zákon, paragraf, odstavec). legalSourceUrl: stejná URL jako citation.url.
   riskCategory: jedna z kategorií uvedených v zadání.

4. SHRNUTÍ. summary: shrnutí jednoduchou češtinou. recommendation: doporučení dalšího postupu. riskSummary.high, riskSummary.medium, riskSummary.low: počty klauzulí podle riskLevel.

5. KONTROLNÍ SEZNAM K JEDNÁNÍ. riskSummary.negotiationChecklist: 3 až 7 krátkých bodů, co si má klient vyžádat nebo ověřit před podpisem, od nejdůležitějšího.

6. HLOUBKOVÁ KONTROLA. dealBreakers: zásadní problémy, kvůli kterým klient nemá smlouvu podepsat, jako pole {title, detail}. verificationNotes: krátké shrnutí tvé vlastní kontroly konzistence nálezů. riskScore: celkové riziko od 1 (bezpečné) do 5 (kritické).

PRÁVNÍ ZDROJE (cituj pouze skutečné předpisy):
Občanský zákoník (89/2012 Sb.), https://www.zakonyprolidi.cz/cs/2012-89
Zákon o obchodních korporacích (90/2012 Sb.), https://www.zakonyprolidi.cz/cs/2012-90
Zákoník práce (262/2006 Sb.), https://www.zakonyprolidi.cz/cs/2006-262
Zákon o zpracování osobních údajů (110/2019 Sb.), https://www.zakonyprolidi.cz/cs/2019-110
GDPR (2016/679), https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng

TVRDÁ PRAVIDLA:
Piš česky, jednoduše, aby textu rozuměl i laik.
Nepoužívej pomlčky, dlouhé ani střední. Používej čárky a tečky.
Žádné záruky ani sliby výsledku.
Cituj pouze skutečné zákony a paragrafy. Pokud si citací nejsi jistý, citaci vynech a na konec pole finding přidej text "k ověření advokátem".
Ceny piš ve tvaru "X eur".
Odpověz pouze validním JSON podle zadaného schématu, bez jakéhokoli dalšího textu.

BEZPLATNÝ SKEN: klient s plánem basic vidí pouze top 3 nálezy. Top 3 jsou nálezy s nejvyšší závažností, každý z jiné rizikové kategorie (riskCategory). Pole clauses seřaď od nejzávažnějšího nálezu.`,

  en: `You are the legal AI analyst for bod.legal. You analyze contracts under Slovak and European law for clients who are not lawyers. The service is operated by the law firm KILIAN LEGAL s.r.o. and reports are verified and signed by an advokat registered with the Slovak Bar Association, which is why we review contracts governed by Slovak law.

PROCEDURE (in this exact order):

1. CLASSIFICATION. First determine the contract type and the governing law:
   contractTypeCode: one of "nda", "lease", "purchase", "work" (contract for work), "sla", "employment", "other".
   GOVERNING LAW. Find the governing-law clause in the contract (choice of law, "shall be governed by", "riadi sa právom", "irányadó jog"). From it determine:
   jurisdiction: "SK" (Slovak law), "CZ" (Czech law), "HU" (Hungarian law), otherwise "EU" or "OTHER".
   jurisdictionBasis: verbatim quote of the clause you read the governing law from, including its article number. Empty string when the contract has no such clause.
   jurisdictionExplicit: true only when the contract contains an express governing-law clause. If you inferred the law indirectly (seats of the parties, language, currency, statutes referenced), set false and warn the client in summary that the governing law needs to be confirmed.
   IF JURISDICTION IS NOT "SK": bod.legal reviews contracts governed by Slovak law, because the report is signed by an advokat registered with the Slovak Bar Association. In that case:
   - open the summary by naming the governing law and stating plainly that this report is an informational AI analysis WITHOUT lawyer verification,
   - in recommendation, advise the client to engage a lawyer qualified in that jurisdiction,
   - still analyze the clauses, but generally and cautiously: cite only EU law and general contract principles, never invent sections of foreign statutes.
   Run the whole analysis under the law you determined here, not under the language the contract is written in.
   contractType: human-readable contract type in English, e.g. "Contract for work".

2. MISSING-CLAUSES CHECK by contract type. Write the result into riskSummary.missingClauses as an array of {name, why}. Checklist per type:
   NDA: contractual penalty for breach of confidentiality, duration of confidentiality, definition of confidential information, exceptions, return or destruction of materials.
   Lease: leased object, rent amount and due dates, term and termination conditions, deposit, repairs and maintenance, handover condition.
   Purchase: object of purchase, price and due dates, transfer of ownership and risk, liability for defects, delivery terms.
   Work: scope of work, price and payment terms, delivery deadline and acceptance, warranty and defects liability, penalty for delay, rights to deliverables.
   SLA: service definitions, availability and metrics, service credits, response times, support, termination and exit.
   Employment: type of work, place of work, start date, salary, probation period, working hours.
   Other: essential terms by the nature of the contract.

3. CLAUSE ANALYSIS. Analyze at most 8 highest-risk clauses. Fill every field for each:
   severity: "critical", "important" or "minor".
   riskLevel: "high" for critical, "medium" for important, "low" for minor.
   citation: object {law, section, paragraph, url}. law is the statute name and number, section e.g. "§ 379", paragraph e.g. "para. 1" (empty string when not applicable), url links to slov-lex.sk for Slovak law, eur-lex.europa.eu for EU law. When the governing law is not Slovak, cite EU law only.
   whyItMatters: at most 2 short plain-language sentences on why the finding matters to the client.
   suggestedWording: a paste-ready replacement clause the client can drop into the contract.
   suggestedEdit: a short description of the proposed change.
   negotiationLine: one sentence the client can say or write to the counterparty.
   finding: factual description of the issue. excerpt: quoted clause text. title, clauseNumber: clause heading and order.
   legalBasis: textual citation (statute, section, paragraph). legalSourceUrl: same URL as citation.url.
   riskCategory: one of the categories listed in the task.

4. SUMMARY. summary: plain-language summary. recommendation: recommended next steps. riskSummary.high, riskSummary.medium, riskSummary.low: clause counts by riskLevel.

5. NEGOTIATION CHECKLIST. riskSummary.negotiationChecklist: 3 to 7 short items the client should request or verify before signing, most important first.

6. DEEP CHECK. dealBreakers: fundamental problems that should stop the client from signing, as an array of {title, detail}. verificationNotes: a short summary of your own consistency check of the findings. riskScore: overall risk from 1 (safe) to 5 (critical).

LEGAL SOURCES (cite only real statutes):
Slovak Civil Code (40/1964 Coll.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/
Slovak Commercial Code (513/1991 Coll.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/
Slovak Labour Code (311/2001 Coll.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2001/311/
Czech Civil Code (89/2012 Sb.), https://www.zakonyprolidi.cz/cs/2012-89
GDPR (2016/679), https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng

HARD RULES:
Write in plain English a layperson understands.
No guarantees or promises of outcome.
Cite only real statutes and sections. If unsure about a citation, omit it and append "to be verified by a lawyer" to the finding field.
Write prices as "X eur".
Respond with valid JSON matching the given schema only, no other text.

FREE SCAN: a client on the basic plan sees only the top 3 findings. The top 3 are the highest-severity findings, each from a distinct risk category (riskCategory). Sort the clauses array from the most severe finding.`,

  hu: `A bod.legal szolgáltatás jogi AI elemzője vagy. A szerződéseket a szlovák, a cseh, a magyar és az európai jog alapján elemzed olyan ügyfeleknek, akik nem jogászok. Mindig az irányadó jog szerint elemzel, nem a szerződés nyelve szerint.

ELJÁRÁS (pontosan ebben a sorrendben):

1. OSZTÁLYOZÁS. Először határozd meg a szerződés típusát és az irányadó jogot:
   contractTypeCode: az alábbiak egyike: "nda", "lease" (bérleti), "purchase" (adásvételi), "work" (vállalkozási), "sla", "employment" (munkaszerződés), "other" (egyéb).
   IRÁNYADÓ JOG. Keresd meg a szerződésben a jogválasztási kikötést ("irányadó jog", "governing law", "riadi sa právom", "řídí se právem"). Ez alapján határozd meg:
   jurisdiction: "SK" (szlovák jog), "CZ" (cseh jog), "HU" (magyar jog), egyébként "EU" vagy "OTHER".
   jurisdictionBasis: annak a kikötésnek a szó szerinti idézete, amelyből az irányadó jogot megállapítottad, a cikkszámmal együtt. Ha a szerződésben nincs ilyen kikötés, hagyd üresen.
   jurisdictionExplicit: csak akkor true, ha a szerződés kifejezett jogválasztási kikötést tartalmaz. Ha közvetve következtettél rá (a felek székhelye, nyelv, pénznem, hivatkozott jogszabályok), akkor false, és a summary mezőben figyelmeztesd az ügyfelet, hogy az irányadó jogot meg kell erősíteni.
   A teljes elemzést az így megállapított jog szerint végezd, ne a szerződés nyelve szerint.
   contractType: a szerződés típusának megnevezése magyarul, például "Vállalkozási szerződés".

2. HIÁNYZÓ KIKÖTÉSEK ELLENŐRZÉSE a szerződés típusa szerint. Az eredményt a riskSummary.missingClauses mezőbe írd {name, why} objektumok tömbjeként. Ellenőrzőlista típusonként:
   NDA: kötbér a titoktartás megsértéséért, a titoktartás időtartama, a bizalmas információk meghatározása, kivételek, az anyagok visszaadása vagy megsemmisítése.
   Bérleti: a bérlet tárgya, a bérleti díj összege és esedékessége, időtartam és felmondási feltételek, kaució, javítás és karbantartás, átadási állapot.
   Adásvételi: az adásvétel tárgya, vételár és esedékesség, a tulajdonjog és a kárveszély átszállása, hibás teljesítésért való felelősség, szállítási feltételek.
   Vállalkozási: a mű meghatározása, ár és fizetési feltételek, határidő és átadás, jótállás és hibás teljesítés, késedelmi kötbér, a szellemi alkotásokhoz fűződő jogok.
   SLA: a szolgáltatások meghatározása, rendelkezésre állás és mérőszámok, jóváírások, reakcióidők, támogatás, megszüntetés és kilépés.
   Munkaszerződés: a munkakör, a munkavégzés helye, a munkába lépés napja, a bér, a próbaidő, a munkaidő.
   Egyéb: a szerződés jellege szerinti lényeges elemek.

3. KIKÖTÉSEK ELEMZÉSE. Legfeljebb 8 legkockázatosabb kikötést elemezz. Mindegyiknél töltsd ki az összes mezőt:
   severity: "critical" (a jelentés szövegében: kritikus), "important" (fontos) vagy "minor" (apró).
   riskLevel: "high" a critical, "medium" az important, "low" a minor értékhez.
   citation: {law, section, paragraph, url} objektum. law a jogszabály neve és száma, section a paragrafus (például "§ 379"), paragraph a bekezdés (ha nincs, üres karakterlánc), url a slov-lex.sk (szlovák jog) vagy eur-lex.europa.eu (EU jog) hivatkozás. Ha az irányadó jog nem szlovák, csak az uniós jogra hivatkozz.
   whyItMatters: legfeljebb 2 rövid, közérthető mondat arról, miért fontos a megállapítás az ügyfélnek.
   suggestedWording: kész szövegű kikötés, amelyet az ügyfél azonnal beilleszthet a szerződésbe.
   suggestedEdit: a javasolt módosítás rövid leírása.
   negotiationLine: egy mondat, amelyet az ügyfél a másik félnek mondhat vagy írhat.
   finding: a probléma tárgyszerű leírása. excerpt: a kikötés idézett szövege. title, clauseNumber: a kikötés címe és sorszáma.
   legalBasis: szöveges hivatkozás (jogszabály, paragrafus, bekezdés). legalSourceUrl: ugyanaz az URL, mint a citation.url.
   riskCategory: a feladatban felsorolt kategóriák egyike.

4. ÖSSZEFOGLALÓ. summary: közérthető összefoglaló magyarul. recommendation: javasolt következő lépések. riskSummary.high, riskSummary.medium, riskSummary.low: a kikötések száma riskLevel szerint.

5. TÁRGYALÁSI ELLENŐRZŐLISTA. riskSummary.negotiationChecklist: 3 és 7 közötti rövid pont arról, mit kérjen vagy ellenőrizzen az ügyfél aláírás előtt, a legfontosabbal kezdve.

6. MÉLYELLENŐRZÉS. dealBreakers: alapvető problémák, amelyek miatt az ügyfélnek nem szabad aláírnia, {title, detail} tömbként. verificationNotes: a saját konzisztencia ellenőrzésed rövid összefoglalója. riskScore: összesített kockázat 1 (biztonságos) és 5 (kritikus) között.

JOGFORRÁSOK (csak létező jogszabályokat idézz):
Szlovák Polgári Törvénykönyv (40/1964 Zb.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/
Szlovák Kereskedelmi Törvénykönyv (513/1991 Zb.), https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/
Cseh Polgári Törvénykönyv (89/2012 Sb.), https://www.zakonyprolidi.cz/cs/2012-89
GDPR (2016/679), https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng

SZIGORÚ SZABÁLYOK:
Írj magyarul, egyszerűen, hogy laikus is megértse.
Semmilyen garanciát vagy eredményígéretet ne adj.
Csak létező jogszabályokat és paragrafusokat idézz. Ha bizonytalan vagy a hivatkozásban, hagyd ki, és a finding mező végére írd: "ügyvédi ellenőrzésre szorul".
Az árakat "X eur" formában írd.
Csak a megadott séma szerinti érvényes JSON legyen a válaszod, más szöveg nélkül.

INGYENES ELLENŐRZÉS: a basic csomagos ügyfél csak a top 3 megállapítást látja. A top 3 a legsúlyosabb megállapítás, mindegyik más kockázati kategóriából (riskCategory). A clauses tömböt a legsúlyosabb megállapítással kezdve rendezd.`,
};

export function getSystemPrompt(language: string): string {
  return SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.sk;
}

// Per-language user-instruction snippets for prompt assembly.
const USER_INSTRUCTIONS: Record<string, { intro: string; basicNote: string; categories: string; schemaNote: string }> = {
  sk: {
    intro: "Text zmluvy:",
    basicNote: "Tento klient má bezplatný sken (plán basic). Zobrazia sa mu iba top 3 nálezy, každý z inej rizikovej kategórie. Pole clauses zoraď od najzávažnejšieho nálezu.",
    categories: "Pre riskCategory použi jednu z týchto hodnôt:",
    schemaNote: "Analyzuj túto zmluvu podľa postupu v systémovej inštrukcii. Vráť IBA validný JSON presne podľa tejto schémy:",
  },
  cz: {
    intro: "Text smlouvy:",
    basicNote: "Tento klient má bezplatný sken (plán basic). Zobrazí se mu pouze top 3 nálezy, každý z jiné rizikové kategorie. Pole clauses seřaď od nejzávažnějšího nálezu.",
    categories: "Pro riskCategory použij jednu z těchto hodnot:",
    schemaNote: "Analyzuj tuto smlouvu podle postupu v systémové instrukci. Vrať POUZE validní JSON přesně podle tohoto schématu:",
  },
  en: {
    intro: "Contract text:",
    basicNote: "This client is on the free scan (basic plan). They will only see the top 3 findings, each from a distinct risk category. Sort the clauses array from the most severe finding.",
    categories: "For riskCategory use one of these values:",
    schemaNote: "Analyze this contract following the procedure in the system instruction. Return ONLY valid JSON matching exactly this schema:",
  },
  hu: {
    intro: "A szerződés szövege:",
    basicNote: "Ez az ügyfél ingyenes ellenőrzést használ (basic csomag). Csak a top 3 megállapítást látja, mindegyiket más kockázati kategóriából. A clauses tömböt a legsúlyosabb megállapítással kezdve rendezd.",
    categories: "A riskCategory mezőhöz az alábbi értékek egyikét használd:",
    schemaNote: "Elemezd ezt a szerződést a rendszerutasítás szerinti eljárással. KIZÁRÓLAG a következő sémának megfelelő érvényes JSON legyen a válaszod:",
  },
};

/**
 * Assemble the full analysis request (messages + response_format) for a
 * contract text. Pure function so tests can verify prompt assembly without
 * calling the model.
 */
export function buildAnalysisRequest(opts: {
  language: string;
  contractText: string;
  plan: string;
  maxChars?: number;
}): { messages: { role: string; content: any }[]; responseFormat: any; redaction: RedactionCounts } {
  const { language, contractText, plan } = opts;

  // PII redaction happens HERE, at the single choke point where contract text
  // enters a model request, so no code path can reach the model with personal
  // data intact (CLAUDE.md §2.2). Redact before truncating so the counts
  // describe the whole document, not just the part we send.
  const { text: safeText, counts: redaction } = redact(contractText);

  const maxChars = opts.maxChars ?? 12000;
  const truncated = safeText.length > maxChars
    ? safeText.substring(0, maxChars) + "\n\n[... zvyšok textu skrátený ...]"
    : safeText;

  const t = USER_INSTRUCTIONS[language] || USER_INSTRUCTIONS.sk;
  const jsonSchema = getAnalysisJsonSchema();
  const categoryIds = RISK_CATEGORIES.map(c => c.id).join(", ");

  const parts = [
    `${t.intro}\n\n${truncated}`,
    `${t.categories} ${categoryIds}.`,
  ];
  if (plan === "basic") parts.push(t.basicNote);
  parts.push(`${t.schemaNote}\n${JSON.stringify(jsonSchema)}`);

  return {
    redaction,
    messages: [
      { role: "system", content: getSystemPrompt(language) },
      { role: "user", content: [{ type: "text", text: parts.join("\n\n") }] },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "contract_analysis",
        strict: true,
        schema: jsonSchema,
      },
    },
  };
}

const REPAIR_INSTRUCTION = "Tvoja predchádzajúca odpoveď nebola validný JSON podľa schémy. Oprav ju a vráť IBA validný JSON presne podľa schémy, bez akéhokoľvek ďalšieho textu. / Your previous answer was not valid JSON matching the schema. Fix it and return ONLY valid JSON matching the schema exactly, with no other text.";

/**
 * Call the model and validate the output against analysisResultSchema.
 * On validation failure the call is retried ONCE with a repair instruction
 * (the invalid output + validation errors appended). A second failure throws
 * AnalysisValidationError so the caller can mark the contract as failed.
 */
export async function runAnalysisModel(opts: {
  messages: { role: string; content: any }[];
  responseFormat: any;
  model?: string;
}): Promise<RichAnalysisResult> {
  const model = opts.model || ANALYSIS_MODEL;
  let messages = [...opts.messages];
  let lastIssue = "unknown";

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await callLLM({
      model,
      max_completion_tokens: 8000,
      reasoning: { effort: "low" },
      messages,
      response_format: opts.responseFormat,
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const finishReason = response.choices?.[0]?.finish_reason;
    console.log(`[Analysis] LLM response (attempt ${attempt + 1}). finish_reason: ${finishReason}, content length: ${typeof rawContent === "string" ? rawContent.length : 0}`);

    const content = typeof rawContent === "string" ? rawContent : rawContent ? JSON.stringify(rawContent) : "";
    let issue: string;

    if (!content) {
      issue = `empty response (finish_reason: ${finishReason})`;
    } else {
      try {
        const parsed = parseJsonLoose(content);
        const normalized = normalizeRawAnalysis(parsed);
        const check = analysisResultSchema.safeParse(normalized);
        if (check.success) return check.data;
        issue = check.error.issues
          .slice(0, 5)
          .map(i => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
      } catch (err: any) {
        issue = err.message || "JSON parse failed";
      }
    }

    lastIssue = issue;
    console.warn(`[Analysis] Schema validation failed (attempt ${attempt + 1}): ${issue.substring(0, 300)}`);
    if (attempt === 0) {
      messages = [
        ...messages,
        { role: "assistant", content: content ? content.slice(0, 6000) : "(empty)" },
        { role: "user", content: `${REPAIR_INSTRUCTION}\n\nValidation errors: ${issue.substring(0, 1000)}` },
      ];
    }
  }

  throw new AnalysisValidationError(`Analysis output failed schema validation after one repair retry: ${lastIssue.substring(0, 500)}`);
}

/**
 * Pick the top N findings for previews/emails: highest severity first, each
 * from a distinct risk category where possible (free-scan top 3 rule). If
 * there are not enough distinct categories, the remainder is filled by
 * severity alone.
 */
export function selectTopFindings<T extends { title: string; riskLevel: "high" | "medium" | "low"; finding: string; riskCategory?: string | null }>(
  clauses: T[],
  count = 3,
): { title: string; riskLevel: "high" | "medium" | "low"; finding: string }[] {
  const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...clauses].sort((a, b) => (order[a.riskLevel] ?? 2) - (order[b.riskLevel] ?? 2));

  const picked: T[] = [];
  const seenCategories = new Set<string>();
  for (const c of sorted) {
    if (picked.length >= count) break;
    const cat = c.riskCategory || null;
    if (cat && seenCategories.has(cat)) continue;
    if (cat) seenCategories.add(cat);
    picked.push(c);
  }
  for (const c of sorted) {
    if (picked.length >= count) break;
    if (!picked.includes(c)) picked.push(c);
  }

  return picked.map(c => ({
    title: c.title,
    riskLevel: c.riskLevel,
    finding: c.finding.length > 120 ? c.finding.slice(0, 120) + "..." : c.finding,
  }));
}

// Labels used when folding the rich per-finding fields into the legacy
// `finding` text column (the clauses table has no dedicated columns for them).
const FOLD_LABELS: Record<string, { why: string; negotiate: string }> = {
  sk: { why: "Prečo je to dôležité:", negotiate: "Veta na rokovanie:" },
  cz: { why: "Proč je to důležité:", negotiate: "Věta k jednání:" },
  en: { why: "Why it matters:", negotiate: "Negotiation line:" },
  hu: { why: "Miért fontos:", negotiate: "Tárgyalási mondat:" },
};

/**
 * Run AI-powered contract analysis with Slov-Lex/Zákony pro lidi legal grounding.
 */
export async function analyzeContract(contractId: number): Promise<void> {
  const contract = await getContractById(contractId);
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  await updateContractStatus(contractId, "analyzing");
  console.log(`[Analysis] Starting analysis for contract ${contractId} (${contract.fileName})`);

  try {
    // Get signed URL for the file
    const fileUrl = await storageGetSignedUrl(contract.fileKey);

    // Extract text from the document (provider-neutral: works on any
    // OpenAI-compatible gateway, unlike the Manus-only file_url attachment).
    const isPdf = contract.mimeType.includes("pdf");
    const contractText = isPdf
      ? await extractPdfText(fileUrl)
      : await extractDocxText(fileUrl);
    console.log(`[Analysis] Extracted ${contractText.length} chars from ${isPdf ? "PDF" : "DOCX"}`);

    const language = contract.language || "sk";
    const { messages, responseFormat, redaction } = buildAnalysisRequest({
      language,
      contractText,
      plan: contract.plan,
    });
    // Log what was scrubbed, never the values themselves.
    console.log(`[Analysis] Redacted before model call: ${summarizeRedaction(redaction)}`);

    // Call the model; output is zod-validated with one repair retry.
    const analysis = await runAnalysisModel({ messages, responseFormat });

    console.log(`[Analysis] Parsed ${analysis.clauses.length} clauses. Risk: H=${analysis.riskSummary.high} M=${analysis.riskSummary.medium} L=${analysis.riskSummary.low}`);

    // Save clauses to database. The clauses table has no columns for the new
    // rich fields (whyItMatters, negotiationLine, citation), so they are
    // folded into the legacy text columns to stay backward compatible:
    // finding carries whyItMatters + negotiationLine as labeled paragraphs,
    // suggestedEdit prefers the paste-ready suggestedWording, and
    // legalBasis/legalSourceUrl are backfilled from the structured citation.
    const fold = FOLD_LABELS[language] || FOLD_LABELS.sk;
    const clauseRecords = analysis.clauses.map((c) => {
      const findingParts = [c.finding];
      if (c.whyItMatters) findingParts.push(`${fold.why} ${c.whyItMatters}`);
      if (c.negotiationLine) findingParts.push(`${fold.negotiate} ${c.negotiationLine}`);
      const citationText = c.citation.law
        ? [c.citation.law, c.citation.section, c.citation.paragraph].filter(Boolean).join(", ")
        : "";
      return {
        contractId,
        clauseNumber: c.clauseNumber || 0,
        title: c.title || "Bez názvu",
        excerpt: c.excerpt || "",
        riskLevel: c.riskLevel,
        finding: findingParts.filter(Boolean).join("\n\n"),
        suggestedEdit: c.suggestedWording || c.suggestedEdit || null,
        legalBasis: c.legalBasis || citationText || null,
        legalSourceUrl: c.legalSourceUrl || c.citation.url || null,
        riskCategory: c.riskCategory || null,
      };
    });

    if (clauseRecords.length > 0) {
      await createClauses(clauseRecords);
    }

    // Create report record. riskSummary is a JSON column, so the rich shape
    // (negotiationChecklist, missingClauses) rides along with the legacy
    // high/medium/low counts; existing consumers keep reading the counts.
    const richRiskSummary: RichRiskSummary = {
      high: analysis.riskSummary.high,
      medium: analysis.riskSummary.medium,
      low: analysis.riskSummary.low,
      negotiationChecklist: analysis.riskSummary.negotiationChecklist,
      missingClauses: analysis.riskSummary.missingClauses,
    };
    await createReport({
      contractId,
      summary: analysis.summary,
      riskSummary: richRiskSummary,
      recommendation: analysis.recommendation,
      isSigned: 0,
    });

    // Persist deeper "Mike OS" analysis (best-effort; never blocks the report).
    // missingProvisions is derived from the schema's riskSummary.missingClauses.
    await createDeepAnalysis({
      contractId,
      riskScore: Math.min(5, Math.max(1, Number(analysis.riskScore) || 3)),
      dealBreakers: analysis.dealBreakers,
      missingProvisions: analysis.riskSummary.missingClauses.map(m => ({ title: m.name, detail: m.why })),
      verificationNotes: analysis.verificationNotes || null,
    }).catch(err => console.warn("[Analysis] Deep analysis save failed:", err));

    // Update contract status based on plan
    const plan = contract.plan;
    if (plan === "basic") {
      await updateContractStatus(contractId, "completed");
    } else {
      await updateContractStatus(contractId, "in_review");
    }

    console.log(`[Analysis] Contract ${contractId} analysis complete. Status: ${plan === "basic" ? "completed" : "in_review"}`);

    // Create in-app notification for the user
    await createNotification({
      userId: contract.userId,
      title: plan === "basic" ? "Analýza dokončená" : "Analýza dokončená, čaká na kontrolu advokátom",
      message: plan === "basic"
        ? `Vaša zmluva "${contract.fileName}" bola analyzovaná. Pozrite si report.`
        : `Vaša zmluva "${contract.fileName}" bola analyzovaná. Advokát teraz nálezy overuje.`,
      type: "contract_completed",
      contractId: contractId,
    }).catch(err => console.error("[Notification] Failed to create:", err));

    // Push notification to owner/admin
    const riskStr = `H:${analysis.riskSummary.high} M:${analysis.riskSummary.medium} L:${analysis.riskSummary.low}`;
    await notifyOwner({
      title: `Analýza dokončená: ${contract.fileName}`,
      content: plan === "basic"
        ? `Report pre "${contract.fileName}" je hotový (${riskStr}). Klient: ${contract.userId}.\nOdkaz: /report/${contract.id}`
        : `Report pre "${contract.fileName}" čaká na lawyer review (${riskStr}). Klient: ${contract.userId}.\nOdkaz: /admin/review/${contract.id}`,
    }).catch(err => console.warn("[Notification] Owner push failed:", err));

    // Deep links: env-based base URL (APP_BASE_URL, Railway fallback).
    const baseUrl = getAppBaseUrl();

    // Twilio: SMS + WhatsApp notifications (client + admins), best-effort.
    {
      const notifyPhone = await getNotifyPhone(contractId).catch(() => null);
      const reportUrl = `${baseUrl}/report/${contract.id}`;
      const clientMsg = language === "en"
        ? `bod.legal: Your contract "${contract.fileName}" has been analyzed. ${plan === "basic" ? "View report: " + reportUrl : "It now awaits lawyer review."}`
        : language === "cz"
          ? `bod.legal: Vaše smlouva "${contract.fileName}" byla analyzována. ${plan === "basic" ? "Report: " + reportUrl : "Čeká na kontrolu advokátem."}`
          : `bod.legal: Vaša zmluva "${contract.fileName}" bola analyzovaná. ${plan === "basic" ? "Report: " + reportUrl : "Čaká na kontrolu advokátom."}`;
      notifyClient(notifyPhone, clientMsg).catch(() => {});
      notifyAdmins(`bod.legal: Analýza dokončená pre "${contract.fileName}" (${riskStr}).`).catch(() => {});
    }

    // Email notifications via SendGrid
    const user = await getUserById(contract.userId).catch(() => null);

    // Top 3 findings for emails: highest severity, distinct categories.
    const topFindings = selectTopFindings(clauseRecords);

    if (plan === "basic" && user?.email) {
      // Basic plan: the AI report is the deliverable (no lawyer verification).
      const { subject, html } = emailReportReady({
        contractName: contract.fileName,
        reportUrl: `${baseUrl}/report/${contract.id}`,
        recipientName: user.name || undefined,
        topFindings,
        riskSummary: analysis.riskSummary,
      });
      sendEmail({ to: user.email, subject, html }).catch(err => console.warn("[Email] Report ready failed:", err));
    } else if (plan !== "basic") {
      // Paid plan: email lawyer that new contract needs review
      const lawyerEmail = ENV.sendgridFromEmail; // lawyer = owner for now
      const { subject, html } = emailNewContractForReview({
        contractName: contract.fileName,
        reviewUrl: `${baseUrl}/admin/review/${contract.id}`,
        uploaderName: user?.name || undefined,
      });
      sendEmail({ to: lawyerEmail, subject, html }).catch(err => console.warn("[Email] New review failed:", err));

      // Also email client: AI pass done, lawyer has not signed yet.
      if (user?.email) {
        const clientEmail = emailAnalysisAwaitingReview({
          contractName: contract.fileName,
          reportUrl: `${baseUrl}/report/${contract.id}`,
          recipientName: user.name || undefined,
          topFindings,
          riskSummary: analysis.riskSummary,
        });
        sendEmail({ to: user.email, subject: clientEmail.subject, html: clientEmail.html }).catch(err => console.warn("[Email] Client notify failed:", err));
      }
    }
  } catch (error: any) {
    console.error(`[Analysis] Failed for contract ${contractId}:`, error.message || error);
    // NOTE: the contracts.status enum (drizzle/schema.ts, read-only for this
    // workstream) has no "failed" value, so a hard failure (including
    // AnalysisValidationError after the one repair retry) returns the contract
    // to "pending"; the client UI offers retry from there.
    // TODO: introduce a dedicated "failed" status once the schema can change.
    await updateContractStatus(contractId, "pending");
    throw error;
  }
}
