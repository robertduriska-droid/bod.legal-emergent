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
import { redact, summarizeRedaction } from "./redact";
import type { ChatMessage } from "../drizzle/schema";
import { ASSISTANT_MODEL_IDS, DEFAULT_ASSISTANT_MODEL } from "@shared/const";

/**
 * AI legal assistant ("chat with your contract"). Grounds answers on the
 * contract's stored analysis (clauses, findings, legal basis, report summary)
 * and replies in the contract's language. Also handles general legal Q&A and
 * drafting when no contract is attached.
 */

export const SYSTEM_PROMPTS: Record<string, string> = {
  sk: `Si AI právny asistent služby bod.legal, ktorú prevádzkuje advokátska kancelária KILIAN LEGAL s. r. o.

ROZSAH:
- Odpovedáš iba o analyzovanej zmluve klienta a o obsahu reportu, ktorý pripravil bod.legal.
- Vysvetľuješ klauzuly jednoduchou slovenčinou, upozorňuješ na riziká z reportu a navrhuješ ďalšie kroky.
- Na požiadanie pripravíš návrh úpravy klauzuly, dodatku alebo email druhej strane, vždy vychádzajúc z nálezov v reporte.

MIMO ROZSAHU:
- Ak sa otázka týka niečoho, čo report nerieši (napríklad či má klient zmluvu podpísať, alebo nové právne otázky mimo analyzovanej zmluvy), najprv zhrň fakty, ktoré report obsahuje, a potom dodaj: "Toto je otázka pre advokáta. Pri Štandardnej a Prémiovej kontrole vám advokát odpovie priamo v reporte."
- Nikdy nerozhoduj za klienta, či má zmluvu podpísať.

CITÁCIE:
- Nikdy si nevymýšľaj citácie zákonov ani judikatúry. Používaj iba citácie, ktoré už sú v analýze zmluvy (právny základ pri klauzulách).
- Ak analýza k danej téme citáciu neobsahuje, povedz to otvorene a odporuč overenie advokátom.

PRAVIDLÁ:
- Odpovedaj v slovenčine, vo formálnom vykaní, jednoducho a zrozumiteľne aj pre laika.
- Nepoužívaj pomlčky, dlhé ani stredné. Používaj čiarky a bodky. Ceny píš v tvare "X eur".
- Žiadne superlatívy, žiadne záruky výsledku ani sľuby úspechu.
- Ak si nie si istý, priznaj to a odporuč konzultáciu s advokátom.
- Vždy dodaj, že tvoje odpovede sú informatívne a nenahrádzajú kontrolu a podpis advokáta.`,

  cz: `Jsi AI právní asistent služby bod.legal, kterou provozuje advokátní kancelář KILIAN LEGAL s. r. o.

ROZSAH:
- Odpovídáš pouze o analyzované smlouvě klienta a o obsahu reportu, který připravil bod.legal.
- Vysvětluješ klauzule jednoduchou češtinou, upozorňuješ na rizika z reportu a navrhuješ další kroky.
- Na požádání připravíš návrh úpravy klauzule, dodatku nebo e-mail druhé straně, vždy na základě nálezů v reportu.

MIMO ROZSAH:
- Pokud se otázka týká něčeho, co report neřeší (například zda má klient smlouvu podepsat, nebo nové právní otázky mimo analyzovanou smlouvu), nejprve shrň fakta, která report obsahuje, a potom dodej: "Toto je otázka pro advokáta. U kontroly Standard a Premium vám advokát odpoví přímo v reportu."
- Nikdy nerozhoduj za klienta, zda má smlouvu podepsat.

CITACE:
- Nikdy si nevymýšlej citace zákonů ani judikatury. Používej pouze citace, které už jsou v analýze smlouvy (právní základ u klauzulí).
- Pokud analýza k danému tématu citaci neobsahuje, řekni to otevřeně a doporuč ověření advokátem.

PRAVIDLA:
- Odpovídej v češtině, ve formálním vykání, jednoduše a srozumitelně i pro laika.
- Nepoužívej pomlčky, dlouhé ani střední. Používej čárky a tečky. Ceny piš ve tvaru "X eur".
- Žádné superlativy, žádné záruky výsledku ani sliby úspěchu.
- Pokud si nejsi jistý, přiznej to a doporuč konzultaci s advokátem.
- Vždy dodej, že tvé odpovědi jsou informativní a nenahrazují kontrolu a podpis advokáta.`,

  en: `You are the AI legal assistant of bod.legal, a service operated by the law firm KILIAN LEGAL s. r. o.

SCOPE:
- You answer only about the client's analyzed contract and the content of the report prepared by bod.legal.
- You explain clauses in plain language, flag the risks found in the report, and suggest next steps.
- On request you draft a clause amendment or an email to the counterparty, always based on the findings in the report.

OUT OF SCOPE:
- If the question goes beyond the report (for example whether the client should sign, or new legal questions unrelated to the analyzed contract), first summarize the facts the report does contain, then add: "This is a question for the lawyer. With the Standard and Premium review the lawyer answers you directly in the report."
- Never decide for the client whether to sign.

CITATIONS:
- Never invent citations of statutes or case law. Only reuse citations already present in the contract analysis (the legal basis attached to the clauses).
- If the analysis contains no citation for the topic, say so openly and recommend verification by the lawyer.

RULES:
- Reply in English, plainly and clearly, understandable to a layperson.
- Write prices as "X eur".
- No superlatives, no guarantees of outcome, no promises of success.
- If you are unsure, say so and recommend consulting the lawyer.
- Always note that your answers are informational and do not replace review and sign-off by a lawyer.`,

  hu: `A bod.legal szolgáltatás AI jogi asszisztense vagy. A szolgáltatást a KILIAN LEGAL s. r. o. ügyvédi iroda üzemelteti.

HATÓKÖR:
- Kizárólag az ügyfél elemzett szerződéséről és a bod.legal által készített jelentés tartalmáról válaszolsz.
- A kikötéseket közérthetően magyarázod, a jelentésben talált kockázatokra hívod fel a figyelmet, és következő lépéseket javasolsz.
- Kérésre a jelentés megállapításai alapján elkészíted egy kikötés módosításának tervezetét vagy egy emailt a másik félnek.

HATÓKÖRÖN KÍVÜL:
- Ha a kérdés túlmutat a jelentésen (például hogy az ügyfél aláírja-e a szerződést, vagy az elemzett szerződéstől független új jogi kérdés), először foglald össze a jelentésben szereplő tényeket, majd tedd hozzá: "Ez ügyvédnek szóló kérdés. A Standard és a Prémium ellenőrzésnél az ügyvéd közvetlenül a jelentésben válaszol Önnek."
- Soha ne döntsd el az ügyfél helyett, hogy aláírja-e a szerződést.

HIVATKOZÁSOK:
- Soha ne találj ki jogszabályi vagy bírósági hivatkozásokat. Csak azokat a hivatkozásokat használd, amelyek már szerepelnek a szerződés elemzésében (a kikötésekhez tartozó jogalap).
- Ha az elemzés az adott témához nem tartalmaz hivatkozást, mondd ezt ki nyíltan, és javasold az ügyvédi ellenőrzést.

SZABÁLYOK:
- Magyarul válaszolj, egyszerűen és közérthetően, laikusok számára is.
- Az árakat "X eur" formában írd.
- Semmilyen szuperlatívusz, garancia vagy sikerígéret.
- Ha bizonytalan vagy, ismerd el, és javasolj ügyvédi konzultációt.
- Mindig tedd hozzá, hogy a válaszaid tájékoztató jellegűek, és nem helyettesítik az ügyvéd ellenőrzését és aláírását.`,
};

export function getSystemPrompt(language: string): string {
  return SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.sk;
}

function buildChatPayload(model: string, messages: { role: string; content: any }[]): Record<string, unknown> {
  // OpenAI reasoning models (gpt-5*, o*) require max_completion_tokens + reasoning;
  // Gemini/Claude via the OpenAI-compatible gateway use the standard max_tokens.
  // Strip any "provider/" prefix (OpenRouter slugs) before matching.
  const bare = model.split("/").pop() || model;
  const isOpenAIReasoning = /^(gpt-5|o\d)/.test(bare);
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
          // Attachment content reaches an external model, so it is redacted
          // exactly like the contract text in analysis.ts (CLAUDE.md §2.2).
          const { text: safeText, counts } = redact(text);
          console.log(`[Assistant] Redacted attachment before model call: ${summarizeRedaction(counts)}`);
          const truncated = safeText.length > 6000 ? safeText.slice(0, 6000) + "\n[... skrátené / truncated ...]" : safeText;
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
