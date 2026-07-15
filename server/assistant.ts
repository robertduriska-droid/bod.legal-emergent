import { ENV } from "./_core/env";
import {
  getContractById,
  getClausesByContractId,
  getReportByContractId,
  getChatMessages,
  createChatMessage,
  getAttachmentById,
} from "./db";
import { storageGetSignedUrl } from "./storage";
import { extractDocxText } from "./analysis";
import type { ChatMessage } from "../drizzle/schema";
import { ASSISTANT_MODEL_IDS, DEFAULT_ASSISTANT_MODEL } from "@shared/const";

/**
 * AI legal assistant ("chat with your contract"). Grounds answers on the
 * contract's stored analysis (clauses, findings, legal basis, report summary)
 * and replies in the contract's language. Also handles general legal Q&A and
 * drafting when no contract is attached.
 */

const SYSTEM_PROMPTS: Record<string, string> = {
  sk: `Si AI právny asistent pre bod.legal, službu kontroly zmlúv pod dohľadom advokáta (KILIAN LEGAL s.r.o.).

TVOJA ÚLOHA:
- Pomáhaš klientovi porozumieť jeho zmluve a analýze, ktorú pripravil bod.legal.
- Vysvetľuješ klauzuly jednoduchým jazykom, upozorňuješ na riziká a navrhuješ ďalšie kroky.
- Odpovedáš na právne otázky podľa slovenského a európskeho práva a cituješ konkrétny zákon a paragraf, ak je to relevantné.
- Na požiadanie vieš pripraviť návrh (draft) klauzuly, dodatku alebo emailu druhej strane.

PRAVIDLÁ:
- Odpovedaj v slovenčine, vo formálnom vykaní.
- Nepoužívaj pomlčku (dlhú ani strednú) v slovenskom texte.
- Buď stručný, vecný a presný. Neuvádzaj superlatívy ani záruky výsledku.
- Ak si nie si istý, priznaj to a odporuč konzultáciu s advokátom.
- Vždy dodaj, že tvoje odpovede sú informatívne a nenahrádzajú kontrolu a podpis advokáta.`,

  cz: `Jsi AI právní asistent pro bod.legal, službu kontroly smluv pod dohledem advokáta.

TVŮJ ÚKOL:
- Pomáháš klientovi porozumět jeho smlouvě a analýze, kterou připravil bod.legal.
- Vysvětluješ klauzule jednoduchým jazykem, upozorňuješ na rizika a navrhuješ další kroky.
- Odpovídáš na právní otázky podle českého a evropského práva a cituješ konkrétní zákon a paragraf, pokud je to relevantní.
- Na požádání umíš připravit návrh (draft) klauzule, dodatku nebo e-mailu druhé straně.

PRAVIDLA:
- Odpovídej v češtině, ve formálním vykání.
- Buď stručný, věcný a přesný. Neuváděj superlativy ani záruky výsledku.
- Pokud si nejsi jistý, přiznej to a doporuč konzultaci s advokátem.
- Vždy dodej, že tvé odpovědi jsou informativní a nenahrazují kontrolu a podpis advokáta.`,

  en: `You are the AI legal assistant for bod.legal, a lawyer-supervised contract review service.

YOUR ROLE:
- Help the client understand their contract and the analysis prepared by bod.legal.
- Explain clauses in plain language, flag risks, and suggest next steps.
- Answer legal questions under Slovak and European law and cite the specific law and section where relevant.
- On request, draft a clause, an amendment, or an email to the counterparty.

RULES:
- Reply in English.
- Be concise, factual and precise. Do not use superlatives or guarantee outcomes.
- If you are unsure, say so and recommend consulting the supervising lawyer.
- Always note that your answers are informational and do not replace review and sign-off by a lawyer.`,
};

function getSystemPrompt(language: string): string {
  return SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.sk;
}

function buildChatPayload(model: string, messages: { role: string; content: any }[]): Record<string, unknown> {
  // OpenAI reasoning models (gpt-5*, o*) require max_completion_tokens + reasoning;
  // Gemini/Claude via the OpenAI-compatible gateway use the standard max_tokens.
  const isOpenAIReasoning = /^(gpt-5|o\d)/.test(model);
  const payload: Record<string, unknown> = { model, messages };
  if (isOpenAIReasoning) {
    payload.max_completion_tokens = 2000;
    payload.reasoning = { effort: "low" };
  } else {
    payload.max_tokens = 2000;
  }
  return payload;
}

async function callChatLLM(messages: { role: string; content: any }[], model: string): Promise<string> {
  const url = `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
  const payload = buildChatPayload(model, messages);

  const MAX_RETRIES = 2;
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
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`LLM request failed: ${response.status} - ${errText.substring(0, 300)}`);
      }
      const json = (await response.json()) as any;
      const content = json.choices?.[0]?.message?.content;
      return typeof content === "string" ? content : content ? JSON.stringify(content) : "";
    } catch (err: any) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastError || new Error("LLM request failed");
}

async function buildContractContext(contractId: number): Promise<string> {
  const contract = await getContractById(contractId);
  if (!contract) return "";
  const clauses = await getClausesByContractId(contractId);
  const report = await getReportByContractId(contractId);

  const lines: string[] = [];
  lines.push("KONTEXT ANALYZOVANEJ ZMLUVY (use this to ground your answers):");
  lines.push(`Súbor / file: ${contract.fileName}`);
  if (report?.summary) lines.push(`Zhrnutie / summary: ${report.summary}`);
  if (report?.recommendation) lines.push(`Odporúčanie / recommendation: ${report.recommendation}`);

  if (clauses.length > 0) {
    lines.push("\nAnalyzované klauzuly / analyzed clauses:");
    for (const c of clauses) {
      const risk = (c.overriddenRiskLevel || c.riskLevel || "low").toUpperCase();
      let block = `- [${risk}] ${c.title}`;
      if (c.excerpt) block += `\n  Text: ${c.excerpt.slice(0, 300)}`;
      if (c.finding) block += `\n  Nález / finding: ${c.finding.slice(0, 400)}`;
      if (c.suggestedEdit) block += `\n  Návrh úpravy / suggested edit: ${c.suggestedEdit.slice(0, 300)}`;
      if (c.legalBasis) block += `\n  Právny základ / legal basis: ${c.legalBasis}`;
      lines.push(block);
    }
  }

  const ctx = lines.join("\n");
  return ctx.length > 9000 ? ctx.slice(0, 9000) + "\n[... skrátené / truncated ...]" : ctx;
}

function fallbackReply(language: string): string {
  if (language === "en") return "Sorry, the assistant is temporarily unavailable. Please try again in a moment.";
  if (language === "cz") return "Omlouvám se, asistent je dočasně nedostupný. Zkuste to prosím za chvíli znovu.";
  return "Prepáčte, asistent je dočasne nedostupný. Skúste to prosím o chvíľu znova.";
}

function emptyReply(language: string): string {
  if (language === "en") return "I could not generate a response. Please rephrase your question.";
  if (language === "cz") return "Nepodařilo se vygenerovat odpověď. Zkuste prosím otázku přeformulovat.";
  return "Nepodarilo sa vygenerovať odpoveď. Skúste prosím otázku preformulovať.";
}

export async function runAssistant(opts: {
  userId: number;
  contractId: number | null;
  userMessage: string;
  language?: string;
  model?: string;
  attachmentId?: number;
}): Promise<ChatMessage[]> {
  const { userId, contractId, userMessage } = opts;
  const model = opts.model && ASSISTANT_MODEL_IDS.includes(opts.model)
    ? opts.model
    : DEFAULT_ASSISTANT_MODEL;
  let language = opts.language || "sk";
  let contextBlock = "";

  if (contractId !== null) {
    const contract = await getContractById(contractId);
    if (contract) language = contract.language || language;
    contextBlock = await buildContractContext(contractId);
  }

  // If the user attached an uploaded file to this question, prepare its content
  // for the LLM: PDFs/images become multimodal parts, DOCX becomes extracted text.
  let multimodalContent: any = null;
  let docxTextNote = "";
  if (opts.attachmentId && contractId !== null) {
    const att = await getAttachmentById(opts.attachmentId);
    if (att && att.contractId === contractId) {
      try {
        const signedUrl = await storageGetSignedUrl(att.fileKey);
        if (att.mimeType.includes("pdf")) {
          multimodalContent = [
            { type: "text", text: `${userMessage}\n\n[Priložený súbor / attached file: ${att.fileName}]` },
            { type: "file_url", file_url: { url: signedUrl, mime_type: "application/pdf" } },
          ];
        } else if (att.mimeType.startsWith("image/")) {
          multimodalContent = [
            { type: "text", text: `${userMessage}\n\n[Priložený obrázok / attached image: ${att.fileName}]` },
            { type: "image_url", image_url: { url: signedUrl } },
          ];
        } else {
          const text = await extractDocxText(signedUrl);
          const truncated = text.length > 6000 ? text.slice(0, 6000) + "\n[... skrátené / truncated ...]" : text;
          docxTextNote = `\n\n[Priložený súbor / attached file: ${att.fileName}]\nObsah / content:\n${truncated}`;
        }
      } catch (err) {
        console.error("[Assistant] attachment processing failed:", err);
      }
    }
  }

  // Persist the user's typed message (attachment content is included only for
  // this LLM turn, not stored, to keep history compact).
  await createChatMessage({ userId, contractId, role: "user", content: userMessage });

  // Load history (includes the message we just stored).
  const history = await getChatMessages(userId, contractId);
  const recent: { role: string; content: any }[] = history
    .slice(-20)
    .map(m => ({ role: m.role as string, content: m.content as any }));

  // Replace the final user turn with attachment-augmented content when present.
  if (recent.length > 0) {
    const finalContent = multimodalContent
      ? multimodalContent
      : docxTextNote
        ? userMessage + docxTextNote
        : userMessage;
    recent[recent.length - 1] = { role: "user", content: finalContent };
  }

  const llmMessages: { role: string; content: any }[] = [
    { role: "system", content: getSystemPrompt(language) + (contextBlock ? `\n\n${contextBlock}` : "") },
    ...recent,
  ];

  let reply: string;
  try {
    reply = await callChatLLM(llmMessages, model);
  } catch (err) {
    console.error(`[Assistant] LLM call failed (model=${model}):`, err);
    // If a non-default provider/model failed (e.g. Forge doesn't expose it),
    // fall back to the known-good default model so the user still gets an answer.
    if (model !== DEFAULT_ASSISTANT_MODEL) {
      try {
        reply = await callChatLLM(llmMessages, DEFAULT_ASSISTANT_MODEL);
      } catch (err2) {
        console.error("[Assistant] Default model fallback failed:", err2);
        reply = fallbackReply(language);
      }
    } else {
      reply = fallbackReply(language);
    }
  }
  if (!reply || !reply.trim()) {
    reply = emptyReply(language);
  }

  await createChatMessage({ userId, contractId, role: "assistant", content: reply });

  return getChatMessages(userId, contractId);
}
