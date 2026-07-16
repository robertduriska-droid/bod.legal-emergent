// Watchdog for analyses orphaned mid-run.
//
// Analysis runs in-process, so every deploy kills whatever was analyzing at
// that moment: the work is gone but the row still says "analyzing" and the
// client watches a spinner that will never resolve. Boot-time recovery
// (migrate.ts) only helps at the NEXT boot, which may be days away; tonight a
// contract sat dead for 40 minutes because nothing rebooted after the deploy
// that killed it.
//
// This job runs for the whole life of the process: every few minutes it finds
// contracts stuck in "analyzing" far longer than a real run takes and restarts
// them directly. Restarting is safe because a contract only ever reaches
// "analyzing" after the payment and permission gates in the normal flow, and
// analysis is idempotent: it rebuilds clauses and the report from the stored
// file. A per-process retry cap keeps a genuinely poisoned contract from
// looping forever; beyond the cap it is parked in "pending", where the client
// UI offers a manual retry.

import { and, eq, lt } from "drizzle-orm";
import { contracts } from "../../drizzle/schema";
import { getDb } from "../db";
import { analyzeContract } from "../analysis";

const SWEEP_EVERY_MS = 3 * 60 * 1000;
/** A real analysis finishes in single-digit minutes; ten is already a corpse. */
const STUCK_AFTER_MS = 10 * 60 * 1000;
const MAX_AUTO_RESTARTS = 2;

const restarts = new Map<number, number>();

async function sweep(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
    const stuck = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.status, "analyzing"), lt(contracts.updatedAt, cutoff)));

    for (const contract of stuck) {
      const attempts = restarts.get(contract.id) ?? 0;
      if (attempts >= MAX_AUTO_RESTARTS) {
        // Park it for a human; the client UI shows a retry button on pending.
        console.error(
          `[Watchdog] Contract ${contract.id} stuck after ${attempts} auto-restarts, parking as pending.`,
        );
        await db.update(contracts).set({ status: "pending" }).where(eq(contracts.id, contract.id));
        restarts.delete(contract.id);
        continue;
      }
      restarts.set(contract.id, attempts + 1);
      console.warn(
        `[Watchdog] Contract ${contract.id} orphaned mid-analysis, restarting (attempt ${attempts + 1}/${MAX_AUTO_RESTARTS}).`,
      );
      await db.update(contracts).set({ status: "pending" }).where(eq(contracts.id, contract.id));
      analyzeContract(contract.id).catch(err =>
        console.error(`[Watchdog] Restart of contract ${contract.id} failed:`, err),
      );
    }
  } catch (err) {
    console.error("[Watchdog] Sweep failed (will retry):", err);
  }
}

export function startAnalysisWatchdog(): void {
  // First sweep soon after boot so a deploy-killed analysis resumes in
  // seconds, not minutes; then keep watching.
  const first = setTimeout(sweep, 20 * 1000);
  const interval = setInterval(sweep, SWEEP_EVERY_MS);
  first.unref?.();
  interval.unref?.();
}
