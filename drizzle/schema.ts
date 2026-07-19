import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Stripe customer ID for payment tracking */
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contracts table - stores uploaded contract metadata and status
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Original filename */
  fileName: varchar("fileName", { length: 512 }).notNull(),
  /** MIME type: application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document */
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  /** S3 storage key */
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  /** Served URL path */
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  /** Number of pages (if detected) */
  pageCount: int("pageCount"),
  /** Selected pricing plan: basic, standard, premium */
  plan: mysqlEnum("plan", ["basic", "standard", "premium"]).notNull(),
  /** Express add-on: priority delivery within 4 hours */
  expressAddon: int("expressAddon").default(0).notNull(),
  /** Workflow status */
  status: mysqlEnum("status", ["pending", "analyzing", "in_review", "completed"]).default("pending").notNull(),
  /** Language for analysis output */
  language: varchar("language", { length: 5 }).default("sk").notNull(),
  /**
   * Which party the client represents (e.g. "objednávateľ", "nájomca",
   * "Alfa s. r. o."). Risk is directional: a liability cap is great for the
   * side that wrote it and terrible for the other, so the analysis has to
   * know whose side it is on. NULL means the client did not say; the
   * analysis then assesses both ways and labels who each risk burdens.
   */
  clientParty: varchar("clientParty", { length: 200 }),
  /**
   * When the uploaded source file was purged from object storage.
   *
   * We promise clients, in the FAQ, on the About page and in the email they
   * actually receive, that uploaded documents are deleted within 30 days. NULL
   * means the file is still in the bucket; a timestamp means retention has run
   * and fileKey no longer resolves. The report is deliberately kept: the
   * promise covers the uploaded document, and the client paid for the report.
   */
  fileDeletedAt: timestamp("fileDeletedAt"),
  /**
   * Extracted plain text of the uploaded contract, kept so the whole-contract
   * redline can be rebuilt on download without re-fetching the file (which
   * retention deletes after 30 days). It IS the document content, so retention
   * clears it together with the file; a signed report keeps its findings, not
   * the source text.
   */
  sourceText: text("sourceText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Clauses table - individual clause analysis results from AI
 */
export const clauses = mysqlTable("clauses", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  /** Clause number/order */
  clauseNumber: int("clauseNumber").notNull(),
  /** Clause title/heading */
  title: varchar("title", { length: 512 }).notNull(),
  /** Original clause text excerpt */
  excerpt: text("excerpt"),
  /** Risk level assigned by AI */
  riskLevel: mysqlEnum("riskLevel", ["high", "medium", "low"]).notNull(),
  /** AI finding/recommendation */
  finding: text("finding").notNull(),
  /** Suggested redline edit */
  suggestedEdit: text("suggestedEdit"),
  /** Legal basis citation (e.g. "§ 536 Obchodného zákonníka") */
  legalBasis: text("legalBasis"),
  /** URL to Slov-Lex or EUR-Lex */
  legalSourceUrl: varchar("legalSourceUrl", { length: 512 }),
  /** Risk category from taxonomy */
  riskCategory: varchar("riskCategory", { length: 128 }),
  /** Lawyer annotation (added during review) */
  lawyerAnnotation: text("lawyerAnnotation"),
  /** Whether lawyer approved this finding */
  lawyerApproved: int("lawyerApproved").default(0),
  /** Whether lawyer overrode the risk level */
  overriddenRiskLevel: mysqlEnum("overriddenRiskLevel", ["high", "medium", "low"]),
  /**
   * 1 when the lawyer ADDED this finding because the AI missed it. These
   * clauses power the recall (completeness) metric: they are the misses. They
   * are excluded from precision counting, since the AI never flagged them.
   */
  lawyerAdded: int("lawyerAdded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clause = typeof clauses.$inferSelect;
export type InsertClause = typeof clauses.$inferInsert;

/**
 * Reports table - final lawyer-signed reports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  /** Reviewing lawyer user ID */
  lawyerId: int("lawyerId"),
  /** Summary of the analysis */
  summary: text("summary"),
  /** Risk counts JSON: { high: number, medium: number, low: number } */
  riskSummary: json("riskSummary"),
  /** Overall recommendation */
  recommendation: text("recommendation"),
  /** Whether the report is signed by a lawyer */
  isSigned: int("isSigned").default(0).notNull(),
  /** Timestamp when lawyer signed */
  signedAt: timestamp("signedAt"),
  /** Lawyer's name for the signature */
  lawyerName: varchar("lawyerName", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Notifications table - in-app notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Notification title */
  title: varchar("title", { length: 512 }).notNull(),
  /** Notification message body */
  message: text("message").notNull(),
  /** Type: contract_completed, contract_submitted, payment_received, system */
  type: varchar("type", { length: 64 }).default("system").notNull(),
  /** Related contract ID (if applicable) */
  contractId: int("contractId"),
  /** Whether the user has read this notification */
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Clause decisions table - stores user accept/reject decisions for clause suggested edits
 */
export const clauseDecisions = mysqlTable("clause_decisions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contractId: int("contractId").notNull(),
  clauseId: int("clauseId").notNull(),
  /** Decision: accepted or rejected */
  decision: mysqlEnum("decision", ["accepted", "rejected"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClauseDecision = typeof clauseDecisions.$inferSelect;
export type InsertClauseDecision = typeof clauseDecisions.$inferInsert;

/**
 * Clause comments table - free-text comments on individual clauses for user-lawyer discussion
 */
export const clauseComments = mysqlTable("clause_comments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  clauseId: int("clauseId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 256 }).notNull(),
  /** Comment content */
  content: text("content").notNull(),
  /** Parent comment ID for threaded replies (null = top-level) */
  parentId: int("parentId"),
  /** Whether this comment was posted by a lawyer/admin */
  isLawyer: int("isLawyer").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClauseComment = typeof clauseComments.$inferSelect;
export type InsertClauseComment = typeof clauseComments.$inferInsert;

/**
 * Feedback table - satisfaction micro-survey responses
 */
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contractId: int("contractId").notNull(),
  /** Rating: positive or negative */
  rating: mysqlEnum("rating", ["positive", "negative"]).notNull(),
  /** Optional free-text comment */
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

/**
 * Chat messages table - AI legal assistant conversation history.
 * contractId is nullable: null = general assistant, set = grounded on that contract.
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contractId: int("contractId"),
  /** Who authored the message */
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  /** Message content */
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Attachments table - supporting files & media uploaded against a contract
 * (stored via the Forge/S3 storage layer; fileUrl is a /file-storage/ path).
 */
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  size: int("size").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

/**
 * Notify prefs - optional SMS/WhatsApp recipient phone per contract (Twilio).
 */
export const notifyPrefs = mysqlTable("notify_prefs", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  userId: int("userId").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotifyPref = typeof notifyPrefs.$inferSelect;
export type InsertNotifyPref = typeof notifyPrefs.$inferInsert;

/**
 * Email credentials - classic email+password login. Kept separate from the
 * users table so it layers on top of the existing OAuth-based user records.
 */
export const emailCredentials = mysqlTable("email_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  failedAttempts: int("failedAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt"),
});

export type EmailCredential = typeof emailCredentials.$inferSelect;
export type InsertEmailCredential = typeof emailCredentials.$inferInsert;

/**
 * Deep analysis (Mike OS) — richer second-pass analysis stored per contract:
 * deal-breaker pass, missing-provisions check, verification pass, 1-5 risk score.
 */
export const deepAnalysis = mysqlTable("deep_analysis", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  /** Overall risk score 1 (safe) - 5 (critical) */
  riskScore: int("riskScore").default(3).notNull(),
  /** Critical issues that should block signing: [{title, detail}] */
  dealBreakers: json("dealBreakers"),
  /** Important clauses that are absent but expected: [{title, detail}] */
  missingProvisions: json("missingProvisions"),
  /** Verification pass notes (self-check of the findings) */
  verificationNotes: text("verificationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeepAnalysis = typeof deepAnalysis.$inferSelect;
export type InsertDeepAnalysis = typeof deepAnalysis.$inferInsert;

/**
 * Contract claims — anonymous free-scan ownership. A random claim token is
 * minted at upload time for contracts uploaded without a session; the token is
 * stored here and mirrored into an httpOnly cookie so only the uploading
 * browser can read the preview. Kept in its own table (CREATE TABLE IF NOT
 * EXISTS at runtime) to avoid ALTERing the contracts table.
 */
export const contractClaims = mysqlTable("contract_claims", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull().unique(),
  /** Random UUID claim token (httpOnly cookie holds the same value) */
  token: varchar("token", { length: 64 }).notNull(),
  /** Optional e-mail captured on the free-scan preview page */
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractClaim = typeof contractClaims.$inferSelect;
export type InsertContractClaim = typeof contractClaims.$inferInsert;

/**
 * Free trials — 15-day trial with one free contract analysis. A card is saved
 * (no charge) via Stripe Checkout in setup mode (SetupIntent). Kept in its own
 * table to avoid ALTERing the existing users table.
 */
export const trials = mysqlTable("trials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  paymentMethodId: varchar("paymentMethodId", { length: 128 }),
  setupSessionId: varchar("setupSessionId", { length: 256 }),
  status: mysqlEnum("status", ["pending", "active", "expired", "converted"]).default("pending").notNull(),
  startedAt: timestamp("startedAt"),
  endsAt: timestamp("endsAt"),
  freeAnalysisUsed: int("freeAnalysisUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trial = typeof trials.$inferSelect;
export type InsertTrial = typeof trials.$inferInsert;

/**
 * Firm playbook: durable rules the lawyer teaches the analysis. Every active
 * rule is injected into the system prompt of every future analysis, so the
 * product compounds on the lawyer's own corrections. A competitor can copy the
 * app but not KILIAN LEGAL's accumulated rules. Kept human-in-the-loop: a rule
 * exists only because the lawyer wrote or promoted it, never silently.
 */
export const playbookRules = mysqlTable("playbook_rules", {
  id: int("id").autoincrement().primaryKey(),
  /** The instruction, e.g. "Vždy skontroluj doložku o vyššej moci." */
  text: text("text").notNull(),
  /** Only active rules reach the prompt. */
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlaybookRule = typeof playbookRules.$inferSelect;
export type InsertPlaybookRule = typeof playbookRules.$inferInsert;
