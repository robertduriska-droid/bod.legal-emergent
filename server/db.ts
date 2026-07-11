import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contracts, clauses, reports, notifications, clauseDecisions, InsertContract, InsertClause, InsertReport, InsertNotification, Contract, Clause, Report, Notification, ClauseDecision } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Contract Helpers ───────────────────────────────────────────────────────

export async function createContract(data: InsertContract): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contracts).values(data);
  return Number(result[0].insertId);
}

export async function getContractById(id: number): Promise<Contract | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function getContractsByUserId(userId: number): Promise<Contract[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(contracts).where(eq(contracts.userId, userId)).orderBy(desc(contracts.createdAt));
}

export async function getAllContracts(): Promise<Contract[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(contracts).orderBy(desc(contracts.createdAt));
}

export async function updateContractStatus(id: number, status: Contract["status"]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contracts).set({ status }).where(eq(contracts.id, id));
}

// ─── Clause Helpers ─────────────────────────────────────────────────────────

export async function createClauses(data: InsertClause[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.length === 0) return;
  await db.insert(clauses).values(data);
}

export async function getClausesByContractId(contractId: number): Promise<Clause[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(clauses).where(eq(clauses.contractId, contractId));
}

export async function updateClause(id: number, data: Partial<Pick<Clause, "lawyerAnnotation" | "lawyerApproved" | "overriddenRiskLevel">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clauses).set(data).where(eq(clauses.id, id));
}

// ─── Report Helpers ─────────────────────────────────────────────────────────

export async function createReport(data: InsertReport): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reports).values(data);
  return Number(result[0].insertId);
}

export async function getReportByContractId(contractId: number): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.contractId, contractId)).limit(1);
  return result[0];
}

export async function updateReport(id: number, data: Partial<Pick<Report, "summary" | "riskSummary" | "recommendation" | "isSigned" | "signedAt" | "lawyerName" | "lawyerId">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reports).set(data).where(eq(reports.id, id));
}

// ─── Notification Helpers ──────────────────────────────────────────────────

export async function createNotification(data: InsertNotification): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  return Number(result[0].insertId);
}

export async function getNotificationsByUserId(userId: number, limit = 20): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
  return result.length;
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notifications).set({ isRead: 1 })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 })
    .where(eq(notifications.userId, userId));
}

// ─── Clause Decisions Helpers ────────────────────────────────────────────────

export async function getDecisionsByContractAndUser(contractId: number, userId: number): Promise<ClauseDecision[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clauseDecisions)
    .where(and(eq(clauseDecisions.contractId, contractId), eq(clauseDecisions.userId, userId)));
}

export async function upsertDecision(userId: number, contractId: number, clauseId: number, decision: "accepted" | "rejected"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Try to find existing
  const existing = await db.select().from(clauseDecisions)
    .where(and(eq(clauseDecisions.userId, userId), eq(clauseDecisions.clauseId, clauseId)));
  if (existing.length > 0) {
    await db.update(clauseDecisions).set({ decision })
      .where(and(eq(clauseDecisions.userId, userId), eq(clauseDecisions.clauseId, clauseId)));
  } else {
    await db.insert(clauseDecisions).values({ userId, contractId, clauseId, decision });
  }
}

export async function bulkUpsertDecisions(userId: number, contractId: number, decisions: Record<string, "accepted" | "rejected">): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const [clauseIdStr, decision] of Object.entries(decisions)) {
    const clauseId = parseInt(clauseIdStr);
    if (isNaN(clauseId)) continue;
    await upsertDecision(userId, contractId, clauseId, decision);
  }
}

export async function deleteDecision(userId: number, clauseId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clauseDecisions)
    .where(and(eq(clauseDecisions.userId, userId), eq(clauseDecisions.clauseId, clauseId)));
}
