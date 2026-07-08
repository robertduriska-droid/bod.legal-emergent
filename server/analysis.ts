import { invokeLLM } from "./_core/llm";
import { getContractById, createClauses, createReport, updateContractStatus, getClausesByContractId } from "./db";
import { storageGetSignedUrl } from "./storage";
import { LEGAL_SOURCES, RISK_CATEGORIES } from "@shared/types";
import type { ClauseAnalysis, AnalysisResult } from "@shared/types";
import axios from "axios";

/**
 * Extract text from a DOCX file by downloading and parsing the XML content.
 * DOCX is a ZIP archive containing word/document.xml with the main text.
 */
async function extractDocxText(fileUrl: string): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  const zip = await JSZip.loadAsync(response.data);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("Invalid DOCX: no word/document.xml found");
  // Strip XML tags and extract text content
  const text = docXml
    .replace(/<w:p[^>]*>/g, "\n") // paragraph breaks
    .replace(/<w:tab\/>/g, "\t") // tabs
    .replace(/<[^>]+>/g, "") // strip all XML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n") // collapse multiple newlines
    .trim();
  return text;
}

/**
 * System prompt for Slovak contract analysis grounded in Slov-Lex legal norms.
 * The AI must cite specific legal instruments and sections.
 */
const SYSTEM_PROMPT = `Si právny AI asistent pre bod.legal. Analyzuješ zmluvy podľa slovenského a európskeho práva.

TVOJE ÚLOHY:
1. Identifikuj typ zmluvy (public_crz, framework_services, lease_real_estate, financing_debt, corporate_governance, data_privacy_security, purchase_supply, works_services, advisory_consulting, settlement_coordination, employment_hr, other).
2. Analyzuj zmluvu klauzulu po klauzule.
3. Pre každú klauzulu urči úroveň rizika (high, medium, low).
4. Cituj konkrétny právny predpis a paragraf (napr. "§ 536 Obchodného zákonníka").
5. Navrhni konkrétne úpravy textu (redline).
6. Identifikuj chýbajúce ustanovenia.

PRÁVNE ZDROJE (VŽDY CITUJ):
- Občiansky zákonník (zákon č. 40/1964 Zb.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/
- Obchodný zákonník (zákon č. 513/1991 Zb.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/
- Zákon o verejnom obstarávaní (zákon č. 343/2015 Z. z.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/
- Zákon o ochrane osobných údajov (zákon č. 18/2018 Z. z.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2018/18/
- Zákon o ochrane spotrebiteľa (zákon č. 108/2024 Z. z.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2024/108/
- GDPR (nariadenie (EÚ) 2016/679) - https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- AI Act (nariadenie (EÚ) 2024/1689) - https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
- eIDAS (nariadenie (EÚ) č. 910/2014) - https://eur-lex.europa.eu/eli/reg/2014/910/oj/eng

KATEGÓRIE RIZÍK:
${RISK_CATEGORIES.map(c => `- ${c.id} (${c.severity}): ${c.labelSk} — kontroly: ${c.checks.join(", ")}`).join("\n")}

PRAVIDLÁ:
- Vždy cituj konkrétny právny predpis a paragraf.
- Ak nie je k dispozícii oficiálny zdroj, uveď to.
- Nikdy nevymýšľaj judikatúru ani zákonné ustanovenia.
- Preferuj oficiálny slovenský text pre slovenské zákony.
- Odpovede píš v slovenčine.
- Každý nález musí obsahovať konkrétny odkaz na Slov-Lex alebo EUR-Lex.`;

/**
 * Run AI-powered contract analysis with Slov-Lex legal grounding.
 * This function is called asynchronously after contract upload.
 */
export async function analyzeContract(contractId: number): Promise<void> {
  const contract = await getContractById(contractId);
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  // Update status to analyzing
  await updateContractStatus(contractId, "analyzing");

  try {
    // Get signed URL for the file
    const fileUrl = await storageGetSignedUrl(contract.fileKey);

    // Build user content based on file type
    const isPdf = contract.mimeType.includes("pdf");
    let userContent: any[];

    if (isPdf) {
      // PDF: send file URL directly to LLM
      userContent = [
        {
          type: "file_url",
          file_url: {
            url: fileUrl,
            mime_type: "application/pdf" as any,
          },
        },
        {
          type: "text",
          text: `Analyzuj túto zmluvu klauzulu po klauzule.`,
        },
      ];
    } else {
      // DOCX: extract text and send as text content
      const docxText = await extractDocxText(fileUrl);
      userContent = [
        {
          type: "text",
          text: `Nasleduje text zmluvy extrahovaný z DOCX súboru:\n\n---\n${docxText}\n---\n\nAnalyzuj túto zmluvu klauzulu po klauzule.`,
        },
      ];
    }

    // Call LLM with the contract content and structured output
    const response = await invokeLLM({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            ...userContent,
            {
              type: "text",
              text: ` Pre každú klauzulu identifikuj:
1. Názov klauzuly
2. Výňatok z textu
3. Úroveň rizika (high/medium/low)
4. Nález a odporúčanie
5. Navrhovanú úpravu textu (redline)
6. Právny základ (konkrétny paragraf a zákon zo Slov-Lex)
7. URL na Slov-Lex alebo EUR-Lex
8. Kategóriu rizika z taxonómie

Na záver uveď:
- Typ zmluvy
- Celkové zhrnutie
- Odporúčanie
- Počet rizík podľa úrovne
- Aplikovateľné právne predpisy

Odpoveď vráť ako JSON.`,
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "contract_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              contractType: {
                type: "string",
                description: "Type of contract from taxonomy",
              },
              clauses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    clauseNumber: { type: "integer" },
                    title: { type: "string" },
                    excerpt: { type: "string" },
                    riskLevel: { type: "string", enum: ["high", "medium", "low"] },
                    finding: { type: "string" },
                    suggestedEdit: { type: "string" },
                    legalBasis: { type: "string" },
                    legalSourceUrl: { type: "string" },
                    riskCategory: { type: "string" },
                  },
                  required: ["clauseNumber", "title", "excerpt", "riskLevel", "finding", "suggestedEdit", "legalBasis", "legalSourceUrl", "riskCategory"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
              recommendation: { type: "string" },
              riskSummary: {
                type: "object",
                properties: {
                  high: { type: "integer" },
                  medium: { type: "integer" },
                  low: { type: "integer" },
                },
                required: ["high", "medium", "low"],
                additionalProperties: false,
              },
              applicableLegalSources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    instrument: { type: "string" },
                    url: { type: "string" },
                  },
                  required: ["id", "name", "instrument", "url"],
                  additionalProperties: false,
                },
              },
            },
            required: ["contractType", "clauses", "summary", "recommendation", "riskSummary", "applicableLegalSources"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the structured response
    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("Empty LLM response");

    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const analysis: AnalysisResult = JSON.parse(content);

    // Save clauses to database
    const clauseRecords = analysis.clauses.map((c: ClauseAnalysis) => ({
      contractId,
      clauseNumber: c.clauseNumber,
      title: c.title,
      excerpt: c.excerpt || "",
      riskLevel: c.riskLevel as "high" | "medium" | "low",
      finding: c.finding,
      suggestedEdit: c.suggestedEdit || null,
      legalBasis: c.legalBasis || null,
      legalSourceUrl: c.legalSourceUrl || null,
      riskCategory: c.riskCategory || null,
    }));

    await createClauses(clauseRecords);

    // Create report record
    await createReport({
      contractId,
      summary: analysis.summary,
      riskSummary: analysis.riskSummary,
      recommendation: analysis.recommendation,
      isSigned: 0,
    });

    // Update contract status
    const plan = contract.plan;
    if (plan === "basic") {
      // Basic plan: AI only, mark as completed immediately
      await updateContractStatus(contractId, "completed");
    } else {
      // Standard/Premium/Audit: needs lawyer review
      await updateContractStatus(contractId, "in_review");
    }
  } catch (error: any) {
    console.error(`[Analysis] Error analyzing contract ${contractId}:`, error);
    // Keep status as pending so it can be retried
    await updateContractStatus(contractId, "pending");
    throw error;
  }
}
