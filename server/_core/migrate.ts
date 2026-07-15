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
