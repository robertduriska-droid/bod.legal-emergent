// Review reminders: contracts waiting for the advokát must not go quiet.
//
// The review alert used to be a single fire-and-forget e-mail at analysis
// completion. If that one message was lost (deploy mid-send, provider hiccup,
// misconfigured inbox), NOTHING ever mentioned the contract again while the
// public guarantee promises delivery within 24 hours. Two real contracts sat
// in review overnight with no alert delivered; that must be impossible.
//
// This job sweeps every half hour: while anything sits in "in_review", the
// shared inbox (OWNER_EMAIL) gets a digest, repeated every few hours until the
// queue is empty. The first sweep runs seconds after boot, so a redeploy also
// re-alerts any contracts whose original one-shot alert was lost.

import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { contracts } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendEmail, escapeHtml } from "../email";
import { ENV } from "./env";
import { getAppBaseUrl } from "../email";

const SWEEP_EVERY_MS = 30 * 60 * 1000;
const REMIND_EVERY_MS = 4 * 60 * 60 * 1000;
const FIRST_SWEEP_MS = 30 * 1000;

let lastRemindedAt = 0;

function hoursWaiting(since: Date, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - since.getTime()) / 3600000));
}

export async function sweepReviewQueue(now: Date = new Date()): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const waiting = await db.select().from(contracts).where(eq(contracts.status, "in_review"));
  if (!waiting.length) {
    lastRemindedAt = 0; // queue drained: the next arrival alerts immediately
    return 0;
  }
  if (now.getTime() - lastRemindedAt < REMIND_EVERY_MS) return waiting.length;

  const to = process.env.OWNER_EMAIL || ENV.sendgridFromEmail;
  if (!to) return waiting.length;

  const baseUrl = getAppBaseUrl();
  const rows = waiting
    .map(c => {
      const h = hoursWaiting(new Date(c.updatedAt), now);
      const urgent = h >= 20 ? " style=\"color:#b3432f;font-weight:bold\"" : "";
      return `<li${urgent}>${escapeHtml(c.fileName)} (${c.plan}) čaká ${h} h · <a href="${baseUrl}/admin/review/${c.id}">otvoriť kontrolu</a></li>`;
    })
    .join("");

  const ok = await sendEmail({
    to,
    subject: `bod.legal: na kontrolu čaká ${waiting.length} ${waiting.length === 1 ? "zmluva" : waiting.length < 5 ? "zmluvy" : "zmlúv"}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#111">
  <p style="font-weight:bold;margin:0 0 10px">Zmluvy čakajúce na kontrolu advokátom</p>
  <ul style="margin:0;padding-left:18px">${rows}</ul>
  <p style="color:#666;margin-top:14px">Garancia sľubuje report do 24 hodín. Táto pripomienka sa opakuje, kým je front prázdny.</p>
</div>`,
  });
  if (ok) lastRemindedAt = now.getTime();
  return waiting.length;
}

export function startReviewReminder(): void {
  const first = setTimeout(() => {
    sweepReviewQueue().catch(err => console.error("[ReviewReminder] failed:", err));
  }, FIRST_SWEEP_MS);
  const tick = setInterval(() => {
    sweepReviewQueue().catch(err => console.error("[ReviewReminder] failed:", err));
  }, SWEEP_EVERY_MS);
  first.unref?.();
  tick.unref?.();
}

/**
 * Manual flush endpoint. GET /api/debug/review-reminder resets the throttle
 * and sweeps immediately, so a waiting contract can be re-alerted on demand
 * (used to confirm delivery and to rescue a queue whose one-shot alert was
 * lost). Returns how many contracts are waiting.
 */
export function registerReviewReminderDebug(app: Express): void {
  app.get("/api/debug/review-reminder", async (_req: Request, res: Response) => {
    lastRemindedAt = 0;
    const waiting = await sweepReviewQueue().catch(() => -1);
    res.json({ waiting, sentTo: process.env.OWNER_EMAIL || ENV.sendgridFromEmail || null });
  });
}
