import { ENV } from "./_core/env";

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

// --- Email Templates ---

export function emailReportReady(params: {
  contractName: string;
  reportUrl: string;
  recipientName?: string;
  topFindings?: { title: string; riskLevel: string; finding: string }[];
  riskSummary?: { high: number; medium: number; low: number };
}) {
  const { contractName, reportUrl, recipientName, topFindings, riskSummary } = params;

  const riskColors: Record<string, string> = { high: "#dc2626", medium: "#f59e0b", low: "#16a34a" };
  const riskLabels: Record<string, string> = { high: "Vysoké riziko", medium: "Stredné riziko", low: "Nízke riziko" };

  const findingsHtml = topFindings && topFindings.length > 0 ? `
    <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <p style="font-weight: 600; margin: 0 0 12px 0; font-size: 14px; color: #374151;">Top ${topFindings.length} nálezy:</p>
      ${topFindings.map(f => `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; background: ${riskColors[f.riskLevel] || riskColors.low};">${riskLabels[f.riskLevel] || f.riskLevel}</span>
            <span style="font-weight: 500; font-size: 13px; color: #1f2937;">${f.title}</span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.4;">${f.finding}</p>
        </div>
      `).join("")}
    </div>
  ` : "";

  const summaryHtml = riskSummary ? `
    <p style="font-size: 13px; color: #6b7280; margin: 8px 0 16px 0;">
      Celkové riziká: <span style="color: ${riskColors.high}; font-weight: 600;">${riskSummary.high} vysoké</span> · 
      <span style="color: ${riskColors.medium}; font-weight: 600;">${riskSummary.medium} stredné</span> · 
      <span style="color: ${riskColors.low}; font-weight: 600;">${riskSummary.low} nízke</span>
    </p>
  ` : "";

  return {
    subject: `[bod.legal] Report pripravený: ${contractName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0a0a0a; margin-bottom: 16px;">bod.legal</h2>
        <p>Dobrý deň${recipientName ? ` ${recipientName}` : ""},</p>
        <p>AI analýza vašej zmluvy <strong>${contractName}</strong> je dokončená.</p>
        ${summaryHtml}
        ${findingsHtml}
        <p style="margin: 24px 0;">
          <a href="${reportUrl}" style="background: #0a0a0a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Zobraziť kompletný report</a>
        </p>
        <p style="color: #666; font-size: 14px;">Každý report overuje advokát. O dokončení revízie vás budeme informovať.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">bod.legal — AI kontrola zmlúv podľa slovenského práva</p>
      </div>
    `,
  };
}

export function emailNewContractForReview(params: {
  contractName: string;
  reviewUrl: string;
  uploaderName?: string;
}) {
  const { contractName, reviewUrl, uploaderName } = params;
  return {
    subject: `[bod.legal] Nová zmluva na review: ${contractName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0a0a0a; margin-bottom: 16px;">bod.legal — Admin</h2>
        <p>Nová zmluva bola nahraná a AI analýza je dokončená.</p>
        <table style="margin: 16px 0; border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0; color: #666;">Zmluva:</td><td style="padding: 4px 0;"><strong>${contractName}</strong></td></tr>
          ${uploaderName ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Nahral:</td><td style="padding: 4px 0;">${uploaderName}</td></tr>` : ""}
        </table>
        <p style="margin: 24px 0;">
          <a href="${reviewUrl}" style="background: #0a0a0a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Otvoriť review</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">bod.legal — AI kontrola zmlúv podľa slovenského práva</p>
      </div>
    `,
  };
}

export function emailReviewCompleted(params: {
  contractName: string;
  reportUrl: string;
  recipientName?: string;
  lawyerName?: string;
}) {
  const { contractName, reportUrl, recipientName, lawyerName } = params;
  return {
    subject: `[bod.legal] Revízia dokončená: ${contractName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0a0a0a; margin-bottom: 16px;">bod.legal</h2>
        <p>Dobrý deň${recipientName ? ` ${recipientName}` : ""},</p>
        <p>Advokát${lawyerName ? ` ${lawyerName}` : ""} dokončil revíziu vašej zmluvy <strong>${contractName}</strong>.</p>
        <p>Report teraz obsahuje overené právne posúdenie každej klauzuly.</p>
        <p style="margin: 24px 0;">
          <a href="${reportUrl}" style="background: #0a0a0a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Zobraziť finálny report</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">bod.legal — AI kontrola zmlúv podľa slovenského práva</p>
      </div>
    `,
  };
}
