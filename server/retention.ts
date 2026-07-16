// Retention: delete uploaded contract files once the promised period is up.
//
// We tell clients, in the FAQ, on the About page and in the email they actually
// receive, that uploaded documents are deleted within 30 days. Until this file
// existed that was simply untrue: nothing in the codebase deleted anything, and
// every contract ever uploaded was still sitting in the bucket. The GDPR page
// meanwhile claimed one year, so the two documents also contradicted each other.
// 30 days won, because it is what three of the four places said and it is what
// went out in writing to clients.
//
// What is deleted: the uploaded source file only. The promise covers the
// uploaded document, and the client paid for the report, so the report, the
// clauses and the findings stay.

import { and, eq, isNull, lt } from "drizzle-orm";
import { contracts } from "../drizzle/schema";
import { getDb } from "./db";
import { storageDelete } from "./storage";

/**
 * The promise, in one place. If this number ever changes, the client-facing
 * text in client/src/i18n/*.ts, client/src/pages/GDPR.tsx and server/email.ts
 * has to change with it: a retention period the client was not told about is
 * the same defect as no retention at all, just quieter.
 */
export const RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type PurgeResult = {
  /** Files deleted and marked on this pass. */
  purged: number;
  /** Files that errored; they keep fileDeletedAt NULL and retry next pass. */
  failed: number;
  /** Contracts past the period but deliberately kept (see below). */
  held: number;
};

export function retentionCutoff(now: Date, days = RETENTION_DAYS): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

/**
 * Delete every uploaded file whose retention period has elapsed.
 *
 * The cutoff runs from upload, not from completion, even though the promise
 * says "within 30 days of completion". Analysis finishes within a day, so 30
 * days from upload always lands at or before 30 days from completion: erring
 * early keeps the promise, erring late breaks it.
 *
 * Contracts still sitting in review are held back, whatever their age. The
 * lawyer cannot review a document we deleted underneath them, and a contract in
 * review for a month is an operational failure that should be fixed rather than
 * papered over by destroying the evidence. Those are counted and logged.
 */
export async function purgeExpiredUploads(now: Date = new Date()): Promise<PurgeResult> {
  const result: PurgeResult = { purged: 0, failed: 0, held: 0 };

  const db = await getDb();
  if (!db) {
    console.warn("[Retention] Database not available, skipping this pass.");
    return result;
  }

  const cutoff = retentionCutoff(now);

  const expired = await db
    .select()
    .from(contracts)
    .where(and(isNull(contracts.fileDeletedAt), lt(contracts.createdAt, cutoff)));

  for (const contract of expired) {
    // A file still under review is kept: see the note above.
    if (contract.status === "in_review") {
      result.held++;
      continue;
    }

    try {
      // Delete first, mark second. If the mark fails the next pass retries the
      // delete, which S3 treats as a no-op. Marking first would risk claiming a
      // file was deleted while it is still in the bucket.
      await storageDelete(contract.fileKey);
      await db.update(contracts).set({ fileDeletedAt: now }).where(eq(contracts.id, contract.id));
      result.purged++;
    } catch (err) {
      // Leave fileDeletedAt NULL so the next pass retries this one.
      console.error(`[Retention] Failed to delete file for contract ${contract.id}:`, err);
      result.failed++;
    }
  }

  return result;
}
