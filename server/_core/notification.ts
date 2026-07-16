// Owner notifications: tell the advokát that something needs their attention.
//
// This used to POST to the Manus notification service, which does not exist on
// a self-hosted deployment, so every alert silently went nowhere. That matters:
// these are the messages that tell the advokát a contract is waiting, and the
// 24h promise depends on them being seen.
//
// It now sends an ordinary email through SendGrid. The signature is unchanged,
// so the six call sites did not have to move.

import { sendEmail, escapeHtml } from "../email";
import { ENV } from "./env";

export interface NotificationPayload {
  title: string;
  content: string;
}

/** Where owner alerts go. OWNER_EMAIL wins; otherwise the verified sender. */
function ownerEmail(): string {
  return process.env.OWNER_EMAIL || ENV.sendgridFromEmail || "";
}

/**
 * Notify the owner/advokát. Returns true when the message was accepted for
 * delivery, false when notifications are not configured or delivery failed.
 * Never throws: an alert failing must not break the flow that triggered it.
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const title = (payload.title || "").trim();
  const content = (payload.content || "").trim();
  if (!title && !content) {
    console.warn("[Notification] Empty payload, nothing sent.");
    return false;
  }

  const to = ownerEmail();
  if (!to || !ENV.sendgridApiKey) {
    console.warn(
      `[Notification] Not configured (need SENDGRID_API_KEY and OWNER_EMAIL or SENDGRID_FROM_EMAIL), skipping: ${title}`,
    );
    return false;
  }

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111">
  <p style="font-weight:bold;margin:0 0 12px">${escapeHtml(title)}</p>
  <p style="white-space:pre-line;margin:0">${escapeHtml(content)}</p>
</div>`;

  try {
    return await sendEmail({ to, subject: `bod.legal: ${title}`, html });
  } catch (err) {
    console.error("[Notification] Owner email failed:", err);
    return false;
  }
}
