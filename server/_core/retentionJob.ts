// Scheduler for the retention pass (server/retention.ts).
//
// Railway gives no cron, so the app schedules itself: one pass shortly after
// boot, then once a day. A missed day is harmless because the pass is a sweep
// over everything expired, not a queue of due items: whatever a skipped run
// would have deleted, the next run deletes.
//
// Nothing here is allowed to take the server down. A retention failure must
// never stop the app from serving reports, so every error is logged and
// swallowed, and the pass runs after listen(), not before it.

import { purgeExpiredUploads, RETENTION_DAYS } from "../retention";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Long enough for boot to settle, short enough to see the result in the logs
 *  of the deploy that shipped it. */
const FIRST_RUN_DELAY_MS = 60 * 1000;

async function runOnce(): Promise<void> {
  try {
    const { purged, failed, held } = await purgeExpiredUploads();
    if (purged || failed || held) {
      console.log(
        `[Retention] Pass complete: ${purged} file(s) deleted, ${failed} failed, ${held} held in review (period: ${RETENTION_DAYS} days).`,
      );
    }
    if (held > 0) {
      console.warn(
        `[Retention] ${held} contract(s) are past ${RETENTION_DAYS} days and still awaiting lawyer review. Their files are kept so the review can happen, but a client is waiting.`,
      );
    }
  } catch (err) {
    console.error("[Retention] Pass failed (will retry on the next run):", err);
  }
}

export function startRetentionJob(): void {
  const first = setTimeout(runOnce, FIRST_RUN_DELAY_MS);
  const daily = setInterval(runOnce, DAY_MS);
  // Do not hold the process open just for retention.
  first.unref?.();
  daily.unref?.();
}
