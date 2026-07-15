import { ENV } from "./_core/env";
import { getContractById, createClauses, createReport, updateContractStatus, createNotification, getUserById, getNotifyPhone, createDeepAnalysis } from "./db";
import { notifyOwner } from "./_core/notification";
import { notifyClient, notifyAdmins } from "./twilio";
import { sendEmail, emailReportReady, emailNewContractForReview } from "./email";
import { storageGetSignedUrl } from "./storage";
import { LEGAL_SOURCES, RISK_CATEGORIES } from "@shared/types";
import type { ClauseAnalysis, AnalysisResult } from "@shared/types";
import axios from "axios";

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
  const payload: Record<string, unknown> = {
    model: params.model,
    max_completion_tokens: params.max_completion_tokens,
    messages: params.messages,
  };
  if (params.response_format) payload.response_format = params.response_format;
  if (params.reasoning) payload.reasoning = params.reasoning;

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
 * System prompts for contract analysis, keyed by language/jurisdiction.
 */
const SYSTEM_PROMPTS: Record<string, string> = {
  sk: `Si právny AI asistent pre bod.legal. Analyzuješ zmluvy podľa slovenského a európskeho práva.

ÚLOHY:
1. Identifikuj typ zmluvy.
2. Analyzuj max 8 najdôležitejších klauzúl (zameraj sa na riziká).
3. Pre každú klauzulu urči riziko (high/medium/low), nález, a právny základ.
4. Cituj konkrétny zákon a paragraf.

PRÁVNE ZDROJE:
- Občiansky zákonník (40/1964 Zb.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/
- Obchodný zákonník (513/1991 Zb.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/
- Zákon o verejnom obstarávaní (343/2015 Z.z.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2015/343/
- Zákon o ochrane osobných údajov (18/2018 Z.z.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2018/18/
- GDPR (2016/679) - https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng

PRAVIDLÁ:
- Odpovede píš v slovenčine.
- Vždy cituj konkrétny paragraf.
- Max 8 klauzúl v odpovedi.
- Buď stručný ale presný.`,

  cz: `Jsi právní AI asistent pro bod.legal. Analyzuješ smlouvy podle českého a evropského práva.

ÚKOLY:
1. Identifikuj typ smlouvy.
2. Analyzuj max 8 nejdůležitějších klauzulí (zaměř se na rizika).
3. Pro každou klauzuli urči riziko (high/medium/low), nález, a právní základ.
4. Cituj konkrétní zákon a paragraf.

PRÁVNÍ ZDROJE:
- Občanský zákoník (89/2012 Sb.) - https://www.zakonyprolidi.cz/cs/2012-89
- Zákon o obchodních korporacích (90/2012 Sb.) - https://www.zakonyprolidi.cz/cs/2012-90
- Zákon o veřejných zakázkách (134/2016 Sb.) - https://www.zakonyprolidi.cz/cs/2016-134
- Zákon o zpracování osobních údajů (110/2019 Sb.) - https://www.zakonyprolidi.cz/cs/2019-110
- GDPR (2016/679) - https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- Registr smluv - https://smlouvy.gov.cz/

PRAVIDLA:
- Odpovědi piš v češtině.
- Vždy cituj konkrétní paragraf.
- Max 8 klauzulí v odpovědi.
- Buď stručný ale přesný.`,

  en: `You are a legal AI assistant for bod.legal. You analyze contracts under Slovak and European law.

TASKS:
1. Identify the contract type.
2. Analyze max 8 most important clauses (focus on risks).
3. For each clause determine risk (high/medium/low), finding, and legal basis.
4. Cite specific law and section.

LEGAL SOURCES:
- Slovak Civil Code (40/1964 Coll.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1964/40/
- Slovak Commercial Code (513/1991 Coll.) - https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/1991/513/
- GDPR (2016/679) - https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng

RULES:
- Write responses in English.
- Always cite specific section.
- Max 8 clauses in response.
- Be concise but precise.`,

  hu: `Jogi AI asszisztens vagy a bod.legal számára. Szerződéseket elemzel a magyar és európai jog szerint.

FELADATOK:
1. Azonosítsd a szerződés típusát.
2. Elemezz max. 8 legfontosabb klauzulát (a kockázatokra összpontosítva).
3. Minden klauzulánál határozd meg a kockázatot (high/medium/low), a megállapítást és a jogalapot.
4. Idézd a konkrét jogszabályt és szakaszt.

JOGFORRÁSOK:
- Polgári Törvénykönyv (2013. évi V. törvény) - https://njt.hu
- A gazdasági társaságokra vonatkozó szabályok (Ptk. Harmadik Könyv) - https://njt.hu
- A közbeszerzésekről szóló 2015. évi CXLIII. törvény - https://njt.hu
- Az információs önrendelkezési jogról szóló 2011. évi CXII. törvény - https://njt.hu
- GDPR (2016/679) - https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng

SZABÁLYOK:
- A válaszokat magyarul írd.
- Mindig idézd a konkrét szakaszt.
- Max. 8 klauzula a válaszban.
- Légy tömör, de pontos.`,
};

/**
 * Deeper "Mike OS" analysis instruction appended to every language prompt.
 * Drives the deal-breaker pass, missing-provisions check, verification pass
 * and a 1-5 overall risk score (fields written in the report's language).
 */
const DEEP_ANALYSIS_INSTRUCTION = `
DEEPER ANALYSIS (Mike OS) — additionally produce:
1) Deal-breaker pass: critical issues that should stop the client from signing → "dealBreakers": [{ "title", "detail" }].
2) Missing-provisions check: important clauses that are absent but expected for this contract type → "missingProvisions": [{ "title", "detail" }].
3) Verification pass: re-check your own findings for consistency and legal accuracy, and summarize that check in "verificationNotes".
4) Overall risk score from 1 (safe to sign) to 5 (critical) in "riskScore".
Write dealBreakers, missingProvisions and verificationNotes in the SAME language as the rest of the report. Use empty arrays if none.`;

function getSystemPrompt(language: string): string {
  return SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.sk;
}

/**
 * Run AI-powered contract analysis with Slov-Lex legal grounding.
 */
export async function analyzeContract(contractId: number): Promise<void> {
  const contract = await getContractById(contractId);
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  await updateContractStatus(contractId, "analyzing");
  console.log(`[Analysis] Starting analysis for contract ${contractId} (${contract.fileName})`);

  try {
    // Get signed URL for the file
    const fileUrl = await storageGetSignedUrl(contract.fileKey);

    // Extract text from the document
    const isPdf = contract.mimeType.includes("pdf");
    let contractText: string = "";

    if (!isPdf) {
      contractText = await extractDocxText(fileUrl);
      console.log(`[Analysis] Extracted ${contractText.length} chars from DOCX`);
    }

    // Build user message content
    let userContent: any[];
    if (isPdf) {
      // For PDF, use file_url
      userContent = [
        {
          type: "file_url",
          file_url: { url: fileUrl, mime_type: "application/pdf" },
        },
        {
          type: "text",
          text: "Analyzuj túto zmluvu. Identifikuj max 8 najrizikovejších klauzúl. Vráť JSON.",
        },
      ];
    } else {
      // For DOCX, send extracted text (truncated to prevent token overflow)
      const maxChars = 8000;
      const truncated = contractText.length > maxChars
        ? contractText.substring(0, maxChars) + "\n\n[... zvyšok textu skrátený ...]"
        : contractText;
      userContent = [
        {
          type: "text",
          text: `Text zmluvy:\n\n${truncated}\n\nAnalyzuj túto zmluvu. Identifikuj max 8 najrizikovejších klauzúl. Vráť JSON.`,
        },
      ];
    }

    // Call LLM with structured output
    const response = await callLLM({
      model: "gpt-5-mini",
      max_completion_tokens: 8000,
      reasoning: { effort: "low" },
      messages: [
        { role: "system", content: getSystemPrompt(contract.language) },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "contract_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              contractType: { type: "string", description: "Typ zmluvy" },
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
              riskScore: { type: "integer", description: "Overall risk 1 (safe) - 5 (critical)" },
              dealBreakers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    detail: { type: "string" },
                  },
                  required: ["title", "detail"],
                  additionalProperties: false,
                },
              },
              missingProvisions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    detail: { type: "string" },
                  },
                  required: ["title", "detail"],
                  additionalProperties: false,
                },
              },
              verificationNotes: { type: "string" },
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
            required: ["contractType", "clauses", "summary", "recommendation", "riskSummary", "riskScore", "dealBreakers", "missingProvisions", "verificationNotes", "applicableLegalSources"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the response
    const rawContent = response.choices?.[0]?.message?.content;
    const finishReason = response.choices?.[0]?.finish_reason;
    
    console.log(`[Analysis] LLM response received. finish_reason: ${finishReason}, content length: ${rawContent?.length || 0}`);
    
    if (!rawContent) {
      throw new Error(`Empty LLM response. finish_reason: ${finishReason}. Usage: ${JSON.stringify(response.usage)}`);
    }

    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    let analysis: AnalysisResult;
    
    try {
      analysis = JSON.parse(content);
    } catch (parseErr) {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          analysis = JSON.parse(jsonMatch[1].trim());
        } catch {
          // Try to repair truncated JSON
          let repaired = jsonMatch[1].trim();
          // Remove trailing incomplete entries
          repaired = repaired.replace(/,\s*\{[^}]*$/, "");
          repaired = repaired.replace(/,\s*"[^"]*$/, "");
          repaired = repaired.replace(/,\s*$/, "");
          // Close open structures
          const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
          const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
          for (let i = 0; i < openBrackets; i++) repaired += "]";
          for (let i = 0; i < openBraces; i++) repaired += "}";
          try {
            analysis = JSON.parse(repaired);
          } catch (finalErr) {
            console.error("[Analysis] JSON repair failed. Content (first 300):", content.substring(0, 300));
            throw new Error(`JSON parse failed: ${(parseErr as Error).message}`);
          }
        }
      } else {
        console.error("[Analysis] No JSON in response. Content (first 300):", content.substring(0, 300));
        throw new Error(`JSON parse failed: ${(parseErr as Error).message}`);
      }
    }

    // Validate and fill defaults
    if (!analysis.clauses || !Array.isArray(analysis.clauses)) analysis.clauses = [];
    if (!analysis.riskSummary) analysis.riskSummary = { high: 0, medium: 0, low: 0 };
    if (!analysis.summary) analysis.summary = "Analýza dokončená.";
    if (!analysis.recommendation) analysis.recommendation = "Odporúčame konzultáciu s advokátom.";
    if (!analysis.contractType) analysis.contractType = "other";
    if (!analysis.applicableLegalSources) analysis.applicableLegalSources = [];

    console.log(`[Analysis] Parsed ${analysis.clauses.length} clauses. Risk: H=${analysis.riskSummary.high} M=${analysis.riskSummary.medium} L=${analysis.riskSummary.low}`);

    // Save clauses to database
    const clauseRecords = analysis.clauses.map((c: ClauseAnalysis) => ({
      contractId,
      clauseNumber: c.clauseNumber || 0,
      title: c.title || "Bez názvu",
      excerpt: c.excerpt || "",
      riskLevel: (c.riskLevel || "low") as "high" | "medium" | "low",
      finding: c.finding || "",
      suggestedEdit: c.suggestedEdit || null,
      legalBasis: c.legalBasis || null,
      legalSourceUrl: c.legalSourceUrl || null,
      riskCategory: c.riskCategory || null,
    }));

    if (clauseRecords.length > 0) {
      await createClauses(clauseRecords);
    }

    // Create report record
    await createReport({
      contractId,
      summary: analysis.summary,
      riskSummary: analysis.riskSummary,
      recommendation: analysis.recommendation,
      isSigned: 0,
    });

    // Persist deeper "Mike OS" analysis (best-effort; never blocks the report).
    await createDeepAnalysis({
      contractId,
      riskScore: Math.min(5, Math.max(1, Number(analysis.riskScore) || 3)),
      dealBreakers: Array.isArray(analysis.dealBreakers) ? analysis.dealBreakers : [],
      missingProvisions: Array.isArray(analysis.missingProvisions) ? analysis.missingProvisions : [],
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
      title: plan === "basic" ? "Analýza dokončená" : "Analýza dokončená — čaká na kontrolu",
      message: plan === "basic"
        ? `Vaša zmluva "${contract.fileName}" bola analyzovaná. Pozrite si report.`
        : `Vaša zmluva "${contract.fileName}" bola analyzovaná. Čaká na kontrolu advokátom.`,
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

    // Twilio: SMS + WhatsApp notifications (client + admins), best-effort.
    {
      const notifyPhone = await getNotifyPhone(contractId).catch(() => null);
      const lang = contract.language || "sk";
      const reportUrl = `https://bod.legal/report/${contract.id}`;
      const clientMsg = lang === "en"
        ? `bod.legal: Your contract "${contract.fileName}" has been analyzed. ${plan === "basic" ? "View report: " + reportUrl : "It now awaits lawyer review."}`
        : lang === "cz"
          ? `bod.legal: Vaše smlouva "${contract.fileName}" byla analyzována. ${plan === "basic" ? "Report: " + reportUrl : "Čeká na kontrolu advokátem."}`
          : `bod.legal: Vaša zmluva "${contract.fileName}" bola analyzovaná. ${plan === "basic" ? "Report: " + reportUrl : "Čaká na kontrolu advokátom."}`;
      notifyClient(notifyPhone, clientMsg).catch(() => {});
      notifyAdmins(`bod.legal: Analýza dokončená pre "${contract.fileName}" (${riskStr}).`).catch(() => {});
    }

    // Email notifications via SendGrid
    const baseUrl = "https://bod.legal";
    const user = await getUserById(contract.userId).catch(() => null);

    // Prepare top 3 findings for email
    const topFindings = clauseRecords
      .sort((a, b) => { const order = { high: 0, medium: 1, low: 2 }; return (order[a.riskLevel] ?? 2) - (order[b.riskLevel] ?? 2); })
      .slice(0, 3)
      .map(c => ({ title: c.title, riskLevel: c.riskLevel, finding: c.finding.slice(0, 120) + (c.finding.length > 120 ? "..." : "") }));

    if (plan === "basic" && user?.email) {
      // Basic plan: email client that report is ready
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

      // Also email client that analysis is done, awaiting review
      if (user?.email) {
        const clientEmail = emailReportReady({
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
    await updateContractStatus(contractId, "pending");
    throw error;
  }
}
