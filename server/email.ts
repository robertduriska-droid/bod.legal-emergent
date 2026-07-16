import { ENV } from "./_core/env";

/**
 * Base URL for all deep links in outgoing messages (emails, SMS). Reads the
 * APP_BASE_URL env var; falls back to the documented Railway production URL.
 * Never hardcode https://bod.legal here, the domain may not be attached yet.
 */
export function getAppBaseUrl(): string {
  const fromEnv = (process.env.APP_BASE_URL || "").trim();
  const base = fromEnv || "https://app.bod.legal";
  return base.replace(/\/+$/, "");
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  if (!ENV.sendgridApiKey) {
    console.warn("[Email] SendGrid API key not configured, skipping email");
    return false;
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: ENV.sendgridFromEmail, name: "bod.legal" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (res.status === 202) {
      console.log(`[Email] Sent to ${to}: "${subject}"`);
      return true;
    } else {
      const body = await res.text();
      console.error(`[Email] Failed (${res.status}): ${body}`);
      return false;
    }
  } catch (err) {
    console.error("[Email] Error:", err);
    return false;
  }
}

// --- Template building blocks ------------------------------------------------
// House rules for every SK/CZ string below: no em or en dashes, plain Slovak,
// prices written as "X eur", no superlatives, no outcome guarantees. Every
// template renders the operator footer (KILIAN LEGAL s.r.o.) plus the 30 day
// deletion note.

/** Escape user or model supplied text before interpolating into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const RISK_COLORS: Record<string, string> = { high: "#dc2626", medium: "#f59e0b", low: "#16a34a" };
const RISK_LABELS: Record<string, string> = { high: "Vysoké riziko", medium: "Stredné riziko", low: "Nízke riziko" };
/** Finding severity words used in client facing SK copy. */
const SEVERITY_LABELS: Record<string, string> = { high: "kritické", medium: "dôležité", low: "drobné" };

/** Shared operator footer: identity + 30 day deletion note, in every email. */
function emailFooter(): string {
  return `
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; margin: 0 0 4px 0;">Prevádzkovateľ: KILIAN LEGAL s.r.o.</p>
        <p style="color: #999; font-size: 12px; margin: 0 0 4px 0;">Nahraté dokumenty mažeme do 30 dní od dokončenia kontroly.</p>
        <p style="color: #999; font-size: 12px; margin: 0;">bod.legal, AI kontrola zmlúv podľa slovenského práva</p>`;
}

/** Shared outer layout so every template has the same header and footer. */
function emailLayout(body: string): string {
  return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0a0a0a; margin-bottom: 16px;">bod.legal</h2>
        ${body}
        ${emailFooter()}
      </div>
    `;
}

function buttonHtml(url: string, label: string): string {
  return `
        <p style="margin: 24px 0;">
          <a href="${url}" style="background: #0a0a0a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${label}</a>
        </p>`;
}

function findingsListHtml(topFindings?: { title: string; riskLevel: string; finding: string }[]): string {
  if (!topFindings || topFindings.length === 0) return "";
  return `
    <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <p style="font-weight: 600; margin: 0 0 12px 0; font-size: 14px; color: #374151;">Top ${topFindings.length} nálezy:</p>
      ${topFindings.map(f => `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; background: ${RISK_COLORS[f.riskLevel] || RISK_COLORS.low};">${RISK_LABELS[f.riskLevel] || escapeHtml(f.riskLevel)}</span>
            <span style="font-weight: 500; font-size: 13px; color: #1f2937;">${escapeHtml(f.title)}</span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.4;">${escapeHtml(f.finding)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function riskSummaryHtml(riskSummary?: { high: number; medium: number; low: number }): string {
  if (!riskSummary) return "";
  return `
    <p style="font-size: 13px; color: #6b7280; margin: 8px 0 16px 0;">
      Celkové riziká: <span style="color: ${RISK_COLORS.high}; font-weight: 600;">${riskSummary.high} vysoké</span> ·
      <span style="color: ${RISK_COLORS.medium}; font-weight: 600;">${riskSummary.medium} stredné</span> ·
      <span style="color: ${RISK_COLORS.low}; font-weight: 600;">${riskSummary.low} nízke</span>
    </p>
  `;
}

// --- Email Templates ----------------------------------------------------------

/**
 * Report ready (basic plan: the AI report itself is the deliverable). Honest
 * wording: no claim of lawyer verification, the free and basic output is an
 * AI analysis only.
 */
export function emailReportReady(params: {
  contractName: string;
  reportUrl: string;
  recipientName?: string;
  topFindings?: { title: string; riskLevel: string; finding: string }[];
  riskSummary?: { high: number; medium: number; low: number };
}) {
  const { contractName, reportUrl, recipientName, topFindings, riskSummary } = params;

  return {
    subject: `[bod.legal] Report pripravený: ${contractName}`,
    html: emailLayout(`
        <p>Dobrý deň${recipientName ? ` ${escapeHtml(recipientName)}` : ""},</p>
        <p>AI analýza vašej zmluvy <strong>${escapeHtml(contractName)}</strong> je dokončená.</p>
        ${riskSummaryHtml(riskSummary)}
        ${findingsListHtml(topFindings)}
        ${buttonHtml(reportUrl, "Zobraziť report")}
        <p style="color: #666; font-size: 14px;">Tento report vygenerovala AI systému bod.legal. Pri Štandardnej a Prémiovej kontrole nálezy overuje a podpisuje advokát.</p>
        <p style="color: #666; font-size: 14px;">Platíte pevnú cenu vopred. Žiadna hodinová sadzba, žiadne prekvapenie na faktúre.</p>`),
  };
}

/**
 * Paid plan, in_review state: the AI pass is done and the lawyer has not
 * signed yet. Never claims verification before signature.
 */
export function emailAnalysisAwaitingReview(params: {
  contractName: string;
  reportUrl: string;
  recipientName?: string;
  topFindings?: { title: string; riskLevel: string; finding: string }[];
  riskSummary?: { high: number; medium: number; low: number };
}) {
  const { contractName, reportUrl, recipientName, topFindings, riskSummary } = params;

  return {
    subject: `[bod.legal] AI analýza je hotová, advokát ju overuje: ${contractName}`,
    html: emailLayout(`
        <p>Dobrý deň${recipientName ? ` ${escapeHtml(recipientName)}` : ""},</p>
        <p>AI analýza vašej zmluvy <strong>${escapeHtml(contractName)}</strong> je hotová.</p>
        <p>Advokát report zatiaľ nepodpísal. Nálezy teraz overuje a môžu sa ešte doplniť alebo zmeniť. O podpise reportu vás budeme informovať ďalším emailom.</p>
        ${riskSummaryHtml(riskSummary)}
        ${findingsListHtml(topFindings)}
        ${buttonHtml(reportUrl, "Zobraziť predbežné nálezy")}`),
  };
}

/** Admin notice: a new contract finished AI analysis and needs lawyer review. */
export function emailNewContractForReview(params: {
  contractName: string;
  reviewUrl: string;
  uploaderName?: string;
}) {
  const { contractName, reviewUrl, uploaderName } = params;
  return {
    subject: `[bod.legal] Nová zmluva na kontrolu: ${contractName}`,
    html: emailLayout(`
        <p>Nová zmluva bola nahraná a AI analýza je dokončená. Čaká na kontrolu advokátom.</p>
        <table style="margin: 16px 0; border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0; color: #666;">Zmluva:</td><td style="padding: 4px 0;"><strong>${escapeHtml(contractName)}</strong></td></tr>
          ${uploaderName ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Nahral:</td><td style="padding: 4px 0;">${escapeHtml(uploaderName)}</td></tr>` : ""}
        </table>
        ${buttonHtml(reviewUrl, "Otvoriť kontrolu")}`),
  };
}

/**
 * Signed report: sent by the existing sign flow (routers.ts) after the lawyer
 * signs. This is the only template that may claim verification.
 */
export function emailReviewCompleted(params: {
  contractName: string;
  reportUrl: string;
  recipientName?: string;
  lawyerName?: string;
}) {
  const { contractName, reportUrl, recipientName, lawyerName } = params;
  return {
    subject: `[bod.legal] Advokát overil a podpísal váš report: ${contractName}`,
    html: emailLayout(`
        <p>Dobrý deň${recipientName ? ` ${escapeHtml(recipientName)}` : ""},</p>
        <p>Advokát${lawyerName ? ` ${escapeHtml(lawyerName)}` : ""} overil a podpísal váš report k zmluve <strong>${escapeHtml(contractName)}</strong>.</p>
        <p>Podpísaný report obsahuje overené právne posúdenie každej klauzuly.</p>
        ${buttonHtml(reportUrl, "Zobraziť podpísaný report")}`),
  };
}

/**
 * Free scan follow up: sent when the anonymous free scan funnel captures an
 * email address. Lists the top findings (title + severity only) and links to
 * the contract page. Never claims lawyer verification for the free tier.
 * Wiring to the send trigger stays behind the existing email key gate.
 */
export function emailFreeScanFollowUp(
  contract: { id: number; fileName: string },
  topFindings: { title: string; riskLevel: string }[],
) {
  const findingsHtml = topFindings.slice(0, 3).map(f => `
        <li style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; background: ${RISK_COLORS[f.riskLevel] || RISK_COLORS.low};">${SEVERITY_LABELS[f.riskLevel] || escapeHtml(f.riskLevel)}</span>
          <span style="font-weight: 500;"> ${escapeHtml(f.title)}</span>
        </li>`).join("");

  const contractUrl = `${getAppBaseUrl()}/contract/${contract.id}`;

  return {
    subject: "Vaša zmluva: 3 riziká, ktoré našla AI",
    html: emailLayout(`
        <p>Dobrý deň,</p>
        <p>AI systému bod.legal skontrolovala vašu zmluvu <strong>${escapeHtml(contract.fileName)}</strong> a našla tieto riziká:</p>
        <ul style="margin: 16px 0; padding-left: 20px; list-style: none;">
          ${findingsHtml}
        </ul>
        <p>Plný report so všetkými nálezmi a overením advokáta získate za pevnú cenu.</p>
        ${buttonHtml(contractUrl, "Zobraziť moju zmluvu")}`),
  };
}
