import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contracts, clauses, reports, notifications, clauseDecisions, feedback, playbookRules, PlaybookRule, InsertContract, InsertClause, InsertReport, InsertNotification, InsertFeedback, Contract, Clause, Report, Notification, ClauseDecision, Feedback } from "../drizzle/schema";
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

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
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

/** Upgrade a contract's plan and/or adopt an anonymous contract to a real user
 *  (free-scan upsell: the claim-holder signs in and pays for an upgrade). */
export async function updateContractPlanAndOwner(
  id: number,
  data: Partial<Pick<Contract, "plan" | "userId">>,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (Object.keys(data).length === 0) return;
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

// ─── Clause Helpers ─────────────────────────────────────────────────────────

export async function createClauses(data: InsertClause[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.length === 0) return;
  await db.insert(clauses).values(data);
}

/** Findings the advokát excluded during review (AdminReview stores them as
 *  lawyerApproved 0 + a "Vyradené advokátom" annotation prefix). Excluded
 *  findings never reach client-facing surfaces (report page, PDF, DOCX). */
export function isClauseExcluded(clause: Pick<Clause, "lawyerApproved" | "lawyerAnnotation">): boolean {
  return clause.lawyerApproved === 0 && (clause.lawyerAnnotation || "").startsWith("Vyradené advokátom");
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

// ─── Clause Comments Helpers ────────────────────────────────────────────────

import { clauseComments, ClauseComment, InsertClauseComment } from "../drizzle/schema";

export async function getCommentsByContract(contractId: number): Promise<ClauseComment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clauseComments)
    .where(eq(clauseComments.contractId, contractId))
    .orderBy(desc(clauseComments.createdAt));
}

export async function createComment(data: Omit<InsertClauseComment, 'parentId' | 'isLawyer'> & { parentId?: number | null; isLawyer?: number }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clauseComments).values(data);
  return Number(result[0].insertId);
}

export async function deleteComment(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clauseComments)
    .where(and(eq(clauseComments.id, id), eq(clauseComments.userId, userId)));
}


// ─── Feedback Helpers ────────────────────────────────────────────────────────

export async function createFeedback(data: InsertFeedback): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(feedback).values(data);
}

export async function getFeedbackByContract(contractId: number, userId: number): Promise<Feedback | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(feedback)
    .where(and(eq(feedback.contractId, contractId), eq(feedback.userId, userId)))
    .limit(1);
  return rows[0] || null;
}

// ─── Chat / AI Assistant Helpers ─────────────────────────────────────────────

import { sql, isNull } from "drizzle-orm";
import { chatMessages, ChatMessage, InsertChatMessage } from "../drizzle/schema";

let _chatTableReady = false;

/** Idempotently ensure the chat_messages table exists (avoids a migration step). */
export async function ensureChatTable(): Promise<void> {
  if (_chatTableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      contractId INT NULL,
      role ENUM('user','assistant') NOT NULL,
      content TEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  _chatTableReady = true;
}

function chatScope(userId: number, contractId: number | null) {
  return contractId === null
    ? and(eq(chatMessages.userId, userId), isNull(chatMessages.contractId))
    : and(eq(chatMessages.userId, userId), eq(chatMessages.contractId, contractId));
}

export async function getChatMessages(userId: number, contractId: number | null): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];
  await ensureChatTable();
  return db.select().from(chatMessages).where(chatScope(userId, contractId)).orderBy(chatMessages.createdAt);
}

export async function createChatMessage(data: InsertChatMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureChatTable();
  const result = await db.insert(chatMessages).values(data);
  return Number(result[0].insertId);
}

export async function clearChatMessages(userId: number, contractId: number | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureChatTable();
  await db.delete(chatMessages).where(chatScope(userId, contractId));
}

// ─── Attachments (file & media storage) ──────────────────────────────────────

import { attachments, Attachment, InsertAttachment } from "../drizzle/schema";

let _attachmentsTableReady = false;

/** Idempotently ensure the attachments table exists (avoids a migration step). */
export async function ensureAttachmentsTable(): Promise<void> {
  if (_attachmentsTableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contractId INT NOT NULL,
      userId INT NOT NULL,
      fileName VARCHAR(512) NOT NULL,
      mimeType VARCHAR(128) NOT NULL,
      fileKey VARCHAR(512) NOT NULL,
      fileUrl VARCHAR(512) NOT NULL,
      size INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  _attachmentsTableReady = true;
}

export async function createAttachment(data: InsertAttachment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureAttachmentsTable();
  const result = await db.insert(attachments).values(data);
  return Number(result[0].insertId);
}

export async function getAttachmentsByContract(contractId: number): Promise<Attachment[]> {
  const db = await getDb();
  if (!db) return [];
  await ensureAttachmentsTable();
  return db.select().from(attachments).where(eq(attachments.contractId, contractId)).orderBy(desc(attachments.createdAt));
}

export async function getAttachmentById(id: number): Promise<Attachment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await ensureAttachmentsTable();
  const rows = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
  return rows[0];
}

export async function deleteAttachment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureAttachmentsTable();
  await db.delete(attachments).where(eq(attachments.id, id));
}

// ─── Notify prefs (Twilio SMS/WhatsApp recipient per contract) ────────────────

import { notifyPrefs } from "../drizzle/schema";

let _notifyPrefsTableReady = false;

export async function ensureNotifyPrefsTable(): Promise<void> {
  if (_notifyPrefsTableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notify_prefs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contractId INT NOT NULL,
      userId INT NOT NULL,
      phone VARCHAR(32) NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  _notifyPrefsTableReady = true;
}

export async function setNotifyPhone(contractId: number, userId: number, phone: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureNotifyPrefsTable();
  await db.insert(notifyPrefs).values({ contractId, userId, phone });
}

export async function getNotifyPhone(contractId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  await ensureNotifyPrefsTable();
  const rows = await db.select().from(notifyPrefs)
    .where(eq(notifyPrefs.contractId, contractId))
    .orderBy(desc(notifyPrefs.createdAt))
    .limit(1);
  return rows[0]?.phone || null;
}

// ─── Email credentials (classic email+password login) ────────────────────────

import { emailCredentials, EmailCredential, InsertEmailCredential } from "../drizzle/schema";

let _emailCredTableReady = false;

export async function ensureEmailCredentialsTable(): Promise<void> {
  if (_emailCredTableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_credentials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      email VARCHAR(320) NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      failedAttempts INT NOT NULL DEFAULT 0,
      lockedUntil TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NULL,
      UNIQUE KEY uq_email_credentials_email (email)
    )
  `);
  _emailCredTableReady = true;
}

export async function getEmailCredentialByEmail(email: string): Promise<EmailCredential | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await ensureEmailCredentialsTable();
  const rows = await db.select().from(emailCredentials).where(eq(emailCredentials.email, email)).limit(1);
  return rows[0];
}

export async function createEmailCredential(data: InsertEmailCredential): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureEmailCredentialsTable();
  await db.insert(emailCredentials).values(data);
}

export async function setEmailCredentialLock(email: string, failedAttempts: number, lockedUntil: Date | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureEmailCredentialsTable();
  await db.update(emailCredentials)
    .set({ failedAttempts, lockedUntil, updatedAt: new Date() })
    .where(eq(emailCredentials.email, email));
}

// ─── Deep analysis (Mike OS) ──────────────────────────────────────────────────

import { deepAnalysis, DeepAnalysis, InsertDeepAnalysis } from "../drizzle/schema";

let _deepAnalysisTableReady = false;

export async function ensureDeepAnalysisTable(): Promise<void> {
  if (_deepAnalysisTableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS deep_analysis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contractId INT NOT NULL,
      riskScore INT NOT NULL DEFAULT 3,
      dealBreakers JSON NULL,
      missingProvisions JSON NULL,
      verificationNotes TEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  _deepAnalysisTableReady = true;
}

export async function createDeepAnalysis(data: InsertDeepAnalysis): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureDeepAnalysisTable();
  // Replace any prior deep analysis for this contract (idempotent re-analysis).
  await db.delete(deepAnalysis).where(eq(deepAnalysis.contractId, data.contractId));
  await db.insert(deepAnalysis).values(data);
}

export async function getDeepAnalysisByContract(contractId: number): Promise<DeepAnalysis | null> {
  const db = await getDb();
  if (!db) return null;
  await ensureDeepAnalysisTable();
  const rows = await db.select().from(deepAnalysis)
    .where(eq(deepAnalysis.contractId, contractId))
    .orderBy(desc(deepAnalysis.createdAt))
    .limit(1);
  return rows[0] || null;
}

// ─── Contract claims (anonymous free-scan ownership tokens) ──────────────────

import { contractClaims, ContractClaim } from "../drizzle/schema";

let _contractClaimsTableReady = false;

/** Idempotently ensure the contract_claims table exists (avoids a migration step). */
export async function ensureContractClaimsTable(): Promise<void> {
  if (_contractClaimsTableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS contract_claims (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contractId INT NOT NULL,
      token VARCHAR(64) NOT NULL,
      email VARCHAR(320) NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_contract_claims_contract (contractId)
    )
  `);
  _contractClaimsTableReady = true;
}

export async function createContractClaim(contractId: number, token: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureContractClaimsTable();
  await db.insert(contractClaims).values({ contractId, token });
}

export async function getContractClaimByContractId(contractId: number): Promise<ContractClaim | null> {
  const db = await getDb();
  if (!db) return null;
  await ensureContractClaimsTable();
  const rows = await db.select().from(contractClaims)
    .where(eq(contractClaims.contractId, contractId))
    .limit(1);
  return rows[0] || null;
}

export async function setContractClaimEmail(contractId: number, email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureContractClaimsTable();
  await db.update(contractClaims).set({ email })
    .where(eq(contractClaims.contractId, contractId));
}

// ─── Free trials (15-day trial + one free analysis, Stripe SetupIntent) ────────

import { trials, Trial } from "../drizzle/schema";

let _trialsTableReady = false;

export async function ensureTrialsTable(): Promise<void> {
  if (_trialsTableReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      stripeCustomerId VARCHAR(128) NULL,
      paymentMethodId VARCHAR(128) NULL,
      setupSessionId VARCHAR(256) NULL,
      status ENUM('pending','active','expired','converted') NOT NULL DEFAULT 'pending',
      startedAt TIMESTAMP NULL,
      endsAt TIMESTAMP NULL,
      freeAnalysisUsed INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_trials_userId (userId)
    )
  `);
  _trialsTableReady = true;
}

export async function getTrialByUserId(userId: number): Promise<Trial | null> {
  const db = await getDb();
  if (!db) return null;
  await ensureTrialsTable();
  const rows = await db.select().from(trials).where(eq(trials.userId, userId)).limit(1);
  return rows[0] || null;
}

export async function upsertTrialPending(userId: number, stripeCustomerId: string, setupSessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureTrialsTable();
  const existing = await getTrialByUserId(userId);
  if (existing) {
    await db.update(trials).set({ stripeCustomerId, setupSessionId }).where(eq(trials.userId, userId));
  } else {
    await db.insert(trials).values({ userId, stripeCustomerId, setupSessionId, status: "pending", freeAnalysisUsed: 0 });
  }
}

export async function activateTrial(userId: number, paymentMethodId: string | null, days = 15): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureTrialsTable();
  const now = new Date();
  const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const set: Record<string, unknown> = { status: "active", startedAt: now, endsAt };
  if (paymentMethodId) set.paymentMethodId = paymentMethodId;
  await db.update(trials).set(set).where(eq(trials.userId, userId));
}

export async function markTrialAnalysisUsed(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureTrialsTable();
  await db.update(trials).set({ freeAnalysisUsed: 1 }).where(eq(trials.userId, userId));
}

/**
 * AI quality from the lawyer's own corrections. On a signed report every clause
 * was reviewed (signing is gated on a full pass), so signed reports are a clean
 * sample. For each reviewed clause the lawyer either kept it (AI correct),
 * changed its risk level (AI right that it is a risk, wrong on the level), or
 * excluded it (AI flagged a non-issue: a false positive).
 *
 * MEASURES PRECISION, NOT RECALL: this cannot see what the AI MISSED, because
 * the review flow has no way to add a finding. Adding that is how recall would
 * later be measured.
 */
/**
 * Pure derivation of the quality figures from raw counts, extracted so the
 * arithmetic is unit-tested without a database.
 */
/**
 * Insert a finding the lawyer noticed but the AI missed. Marked lawyerAdded=1
 * and pre-approved, it counts toward recall, never toward precision.
 */
export async function createManualFinding(data: {
  contractId: number;
  title: string;
  finding: string;
  riskLevel: "high" | "medium" | "low";
  excerpt?: string | null;
  legalBasis?: string | null;
  suggestedEdit?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(clauses).where(eq(clauses.contractId, data.contractId));
  const nextNumber = existing.reduce((m, c) => Math.max(m, c.clauseNumber), 0) + 1;
  await db.insert(clauses).values({
    contractId: data.contractId,
    clauseNumber: nextNumber,
    title: data.title,
    excerpt: data.excerpt ?? null,
    riskLevel: data.riskLevel,
    finding: data.finding,
    suggestedEdit: data.suggestedEdit ?? null,
    legalBasis: data.legalBasis ?? null,
    lawyerAdded: 1,
    lawyerApproved: 1,
  });
}

export function deriveAiQuality(total: number, falsePositives: number, severityCorrected: number, misses: number, signedReports: number) {
  const fp = Math.max(0, falsePositives);
  const corrected = Math.max(0, severityCorrected);
  const miss = Math.max(0, misses);
  const acceptedAsIs = Math.max(0, total - fp - corrected);
  // Real risks the AI flagged and the lawyer kept (as-is or with the level
  // corrected). These are the recall numerator; the lawyer-added findings are
  // the misses the AI should have caught.
  const aiRealHits = acceptedAsIs + corrected;
  return {
    signedReports,
    reviewedClauses: total,
    acceptedAsIs,
    severityCorrected: corrected,
    falsePositives: fp,
    misses: miss,
    precisionPct: total ? Math.round(((total - fp) / total) * 100) : 0,
    recallPct: (aiRealHits + miss) ? Math.round((aiRealHits / (aiRealHits + miss)) * 100) : 0,
  };
}

export async function getAiQualityStats(): Promise<{
  signedReports: number;
  reviewedClauses: number;
  acceptedAsIs: number;
  severityCorrected: number;
  falsePositives: number;
  misses: number;
  precisionPct: number;
  recallPct: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const excludedExpr = sql`(${clauses.lawyerApproved} = 0 and ${clauses.lawyerAnnotation} like 'Vyradené advokátom%')`;
  const overriddenExpr = sql`(${clauses.overriddenRiskLevel} is not null and ${clauses.overriddenRiskLevel} <> ${clauses.riskLevel})`;

  const rows = await db
    .select({
      total: sql<number>`sum(case when ${clauses.lawyerAdded} = 0 then 1 else 0 end)`,
      fp: sql<number>`sum(case when ${clauses.lawyerAdded} = 0 and ${excludedExpr} then 1 else 0 end)`,
      corrected: sql<number>`sum(case when ${clauses.lawyerAdded} = 0 and not ${excludedExpr} and ${overriddenExpr} then 1 else 0 end)`,
      misses: sql<number>`sum(case when ${clauses.lawyerAdded} = 1 then 1 else 0 end)`,
    })
    .from(clauses)
    .innerJoin(reports, eq(reports.contractId, clauses.contractId))
    .where(eq(reports.isSigned, 1));

  const signedRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(reports)
    .where(eq(reports.isSigned, 1));

  return deriveAiQuality(
    Number(rows[0]?.total) || 0,
    Number(rows[0]?.fp) || 0,
    Number(rows[0]?.corrected) || 0,
    Number(rows[0]?.misses) || 0,
    Number(signedRows[0]?.n) || 0,
  );
}

// ─── Firm playbook ──────────────────────────────────────────────────────────

/** Active playbook rules, newest first; injected into every analysis prompt. */
export async function getActivePlaybookRules(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(playbookRules).where(eq(playbookRules.active, 1)).orderBy(desc(playbookRules.createdAt));
  return rows.map(r => r.text).filter(t => t && t.trim());
}

/** All rules for the admin manager. */
export async function listPlaybookRules(): Promise<PlaybookRule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playbookRules).orderBy(desc(playbookRules.createdAt));
}

export async function createPlaybookRule(text: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(playbookRules).values({ text: text.trim(), active: 1 });
}

export async function setPlaybookRuleActive(id: number, active: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(playbookRules).set({ active: active ? 1 : 0 }).where(eq(playbookRules.id, id));
}

export async function deletePlaybookRule(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(playbookRules).where(eq(playbookRules.id, id));
}

/** Store the extracted contract text (capped to fit a TEXT column ~64KB). */
export async function setContractSourceText(id: number, text: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const capped = text.length > 60000 ? text.slice(0, 60000) : text;
  await db.update(contracts).set({ sourceText: capped }).where(eq(contracts.id, id));
}
