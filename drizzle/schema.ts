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
  plan: mysqlEnum("plan", ["basic", "standard", "premium", "audit"]).notNull(),
  /** Express add-on: priority delivery within 4 hours */
  expressAddon: int("expressAddon").default(0).notNull(),
  /** Workflow status */
  status: mysqlEnum("status", ["pending", "analyzing", "in_review", "completed"]).default("pending").notNull(),
  /** Language for analysis output */
  language: varchar("language", { length: 5 }).default("sk").notNull(),
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
