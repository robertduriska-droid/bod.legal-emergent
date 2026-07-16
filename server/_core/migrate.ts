// Auto-migration on boot (self-host convenience).
//
// Railway (and most PaaS) give no easy one-off shell, so instead of requiring
// a manual `pnpm db:push`, the server applies any pending Drizzle migrations
// from ./drizzle at startup. Drizzle's migrator is idempotent: it records
// applied migrations in the __drizzle_migrations table and re-running is a
// no-op, so this is safe on every boot and with multiple replicas (InnoDB
// locks make concurrent runs serialize; a loser may log a duplicate-key
// warning which we tolerate).
//
// Failures are logged but do NOT crash the server: the app already degrades
// gracefully without a database, and a migration hiccup should not take the
// marketing pages down.

import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[Migrate] DATABASE_URL not set, skipping migrations.");
    return;
  }
  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(url);
    const db = drizzle(connection);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Migrate] Database migrations up to date.");
    await recoverOrphanedAnalyses(connection);
  } catch (err) {
    console.error("[Migrate] Migration failed (continuing to boot):", err);
  } finally {
    try {
      await connection?.end();
    } catch {
      // ignore close errors
    }
  }
}

/**
 * Analysis runs in-process, so a deploy or crash mid-analysis leaves the
 * contract stuck on "analyzing" forever: the work is gone but the status says
 * it is still running, and the client sees a spinner that never resolves.
 *
 * On boot, nothing can legitimately be analyzing yet, so any such row is an
 * orphan from the previous container. Send it back to "pending", which is the
 * state the retry path already understands.
 *
 * Only rows older than a couple of minutes are touched, so a rolling deploy
 * where the old container is still finishing a contract cannot be disturbed.
 */
async function recoverOrphanedAnalyses(connection: mysql.Connection): Promise<void> {
  try {
    const [res] = await connection.execute(
      "UPDATE contracts SET status = 'pending' WHERE status = 'analyzing' AND updatedAt < (NOW() - INTERVAL 2 MINUTE)",
    );
    const n = (res as { affectedRows?: number }).affectedRows ?? 0;
    if (n > 0) {
      console.warn(`[Migrate] Recovered ${n} contract(s) orphaned mid-analysis, reset to pending.`);
    }
  } catch (err) {
    console.error("[Migrate] Orphan recovery failed (continuing to boot):", err);
  }
}
