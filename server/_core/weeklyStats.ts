// Weekly funnel numbers to the shared inbox.
//
// The growth loop is "measure scan-to-paid, change one thing a week". A
// measurement nobody looks at does not exist, so the numbers arrive where the
// review work already lives (OWNER_EMAIL) every Monday morning, and
// GET /api/debug/stats serves the same numbers on demand for the weekly
// decision meeting.

import type { Express, Request, Response } from "express";
import { and, gte, sql } from "drizzle-orm";
import { contracts } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendEmail } from "../email";
import { ENV } from "./env";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type FunnelStats = {
  since: string;
  uploadsTotal: number;
  byPlan: Record<string, number>;
  completed: number;
  /** basic uploads that later carry a paid plan cannot be told apart from
   *  direct paid uploads without an event log, so the honest v1 metric is the
   *  plan mix plus the paid share, reviewed week over week. */
  paidShare: number;
};

export async function computeWeeklyStats(now: Date = new Date()): Promise<FunnelStats | null> {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(now.getTime() - WEEK_MS);

  const rows = await db
    .select({ plan: contracts.plan, status: contracts.status, n: sql<number>`count(*)` })
    .from(contracts)
    .where(and(gte(contracts.createdAt, since)))
    .groupBy(contracts.plan, contracts.status);

  const byPlan: Record<string, number> = {};
  let total = 0;
  let completed = 0;
  for (const r of rows) {
    const n = Number(r.n) || 0;
    total += n;
    byPlan[r.plan] = (byPlan[r.plan] || 0) + n;
    if (r.status === "completed" || r.status === "in_review") completed += n;
  }
  const paid = (byPlan.standard || 0) + (byPlan.premium || 0);

  return {
    since: since.toISOString().slice(0, 10),
    uploadsTotal: total,
    byPlan,
    completed,
    paidShare: total ? Math.round((paid / total) * 100) : 0,
  };
}

function statsHtml(s: FunnelStats): string {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#111">
  <p style="font-weight:bold">bod.legal: čísla za týždeň od ${s.since}</p>
  <p>Nahraté zmluvy spolu: <b>${s.uploadsTotal}</b><br>
  Bezplatný sken: <b>${s.byPlan.basic || 0}</b> · Štandardná: <b>${s.byPlan.standard || 0}</b> · Prémiová: <b>${s.byPlan.premium || 0}</b><br>
  Dokončené alebo u advokáta: <b>${s.completed}</b><br>
  Podiel platených: <b>${s.paidShare} %</b></p>
  <p style="color:#666">Týždenný rytmus: pozri čísla, zmeň jednu vec, o týždeň porovnaj.</p>
</div>`;
}

let lastMailedWeek = "";

async function maybeMailWeekly(now: Date): Promise<void> {
  // Monday 05:00-06:59 UTC, once per ISO week per process. A deploy inside
  // the window can duplicate the mail; a duplicate internal digest is cheaper
  // than the state table that would prevent it.
  if (now.getUTCDay() !== 1 || now.getUTCHours() < 5 || now.getUTCHours() > 6) return;
  const week = `${now.getUTCFullYear()}-${Math.ceil((now.getTime() / WEEK_MS) % 53)}`;
  if (week === lastMailedWeek) return;

  const stats = await computeWeeklyStats(now);
  if (!stats) return;
  const to = process.env.OWNER_EMAIL || ENV.sendgridFromEmail;
  if (!to) return;
  lastMailedWeek = week;
  await sendEmail({
    to,
    subject: `bod.legal: týždenné čísla (${stats.uploadsTotal} zmlúv, ${stats.paidShare} % platených)`,
    html: statsHtml(stats),
  });
}

export function startWeeklyStats(app: Express): void {
  app.get("/api/debug/stats", async (_req: Request, res: Response) => {
    const stats = await computeWeeklyStats();
    if (!stats) {
      res.status(503).json({ error: "databaza nedostupna" });
      return;
    }
    res.json(stats);
  });

  const tick = setInterval(() => {
    maybeMailWeekly(new Date()).catch(err => console.error("[WeeklyStats] failed:", err));
  }, 60 * 60 * 1000);
  tick.unref?.();
}
