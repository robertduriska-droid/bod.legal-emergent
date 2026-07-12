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
}) {
  const { contractName, reportUrl, recipientName } = params;
  return {
    subject: `[bod.legal] Report pripravený: ${contractName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0a0a0a; margin-bottom: 16px;">bod.legal</h2>
        <p>Dobrý deň${recipientName ? ` ${recipientName}` : ""},</p>
        <p>AI analýza vašej zmluvy <strong>${contractName}</strong> je dokončená. Report je pripravený na preskúmanie.</p>
        <p style="margin: 24px 0;">
          <a href="${reportUrl}" style="background: #0a0a0a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Zobraziť report</a>
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
