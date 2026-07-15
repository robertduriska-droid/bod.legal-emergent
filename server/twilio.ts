import twilio from "twilio";

/**
 * Twilio SMS + WhatsApp notifications.
 * All sends are best-effort: they never throw to the caller, and if the required
 * credentials are not configured the functions simply no-op (logged once).
 *
 * Env vars (set in the app's environment / Manus dashboard):
 *   TWILIO_ACCOUNT_SID     - Twilio account SID
 *   TWILIO_AUTH_TOKEN      - Twilio auth token
 *   TWILIO_PHONE_NUMBER    - SMS "from" number in E.164 (e.g. +421...)
 *   TWILIO_WHATSAPP_FROM   - WhatsApp "from" (e.g. whatsapp:+14155238886)
 *   TWILIO_ADMIN_PHONE     - admin/lawyer SMS recipient (E.164)
 *   TWILIO_ADMIN_WHATSAPP  - admin/lawyer WhatsApp recipient
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SMS_FROM = process.env.TWILIO_PHONE_NUMBER;
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const ADMIN_PHONE = process.env.TWILIO_ADMIN_PHONE;
const ADMIN_WHATSAPP = process.env.TWILIO_ADMIN_WHATSAPP;

let _client: ReturnType<typeof twilio> | null = null;
function getClient() {
  if (!ACCOUNT_SID || !AUTH_TOKEN) return null;
  if (!_client) _client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  return _client;
}

export function isTwilioConfigured(): boolean {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN);
}

function normalizeE164(num: string): string {
  const trimmed = num.trim();
  if (trimmed.startsWith("+")) return trimmed;
  return `+${trimmed.replace(/[^\d]/g, "")}`;
}

export async function sendSms(to: string, body: string): Promise<boolean> {
  const client = getClient();
  if (!client || !SMS_FROM || !to) return false;
  try {
    await client.messages.create({ from: SMS_FROM, to: normalizeE164(to), body });
    return true;
  } catch (err) {
    console.error("[Twilio] SMS send failed:", err);
    return false;
  }
}

export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const client = getClient();
  if (!client || !WHATSAPP_FROM || !to) return false;
  try {
    const toAddr = to.startsWith("whatsapp:") ? to : `whatsapp:${normalizeE164(to)}`;
    const fromAddr = WHATSAPP_FROM.startsWith("whatsapp:") ? WHATSAPP_FROM : `whatsapp:${WHATSAPP_FROM}`;
    await client.messages.create({ from: fromAddr, to: toAddr, body });
    return true;
  } catch (err) {
    console.error("[Twilio] WhatsApp send failed:", err);
    return false;
  }
}

/** Notify a client on both channels (SMS + WhatsApp) if a phone is provided. */
export async function notifyClient(phone: string | null | undefined, body: string): Promise<void> {
  if (!phone) return;
  await Promise.allSettled([sendSms(phone, body), sendWhatsApp(phone, body)]);
}

/** Notify the configured admin/lawyer number(s) on both channels. */
export async function notifyAdmins(body: string): Promise<void> {
  const tasks: Promise<boolean>[] = [];
  if (ADMIN_PHONE) tasks.push(sendSms(ADMIN_PHONE, body));
  if (ADMIN_WHATSAPP) tasks.push(sendWhatsApp(ADMIN_WHATSAPP, body));
  if (tasks.length > 0) await Promise.allSettled(tasks);
}
