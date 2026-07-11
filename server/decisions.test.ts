import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getDecisionsByContractAndUser: vi.fn(),
  upsertDecision: vi.fn(),
  bulkUpsertDecisions: vi.fn(),
  deleteDecision: vi.fn(),
  // Other exports that might be needed
  upsertUser: vi.fn(),
  getContractById: vi.fn(),
  getContractsByUserId: vi.fn(),
  getAllContracts: vi.fn(),
  createContract: vi.fn(),
  updateContractStatus: vi.fn(),
  createClauses: vi.fn(),
  getClausesByContractId: vi.fn(),
  updateClause: vi.fn(),
  createReport: vi.fn(),
  getReportByContractId: vi.fn(),
  updateReport: vi.fn(),
  createNotification: vi.fn(),
  getNotificationsByUserId: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

import { getDecisionsByContractAndUser, upsertDecision, bulkUpsertDecisions, deleteDecision } from "./db";

const mockGetDecisions = getDecisionsByContractAndUser as ReturnType<typeof vi.fn>;
const mockUpsert = upsertDecision as ReturnType<typeof vi.fn>;
const mockBulkUpsert = bulkUpsertDecisions as ReturnType<typeof vi.fn>;
const mockDelete = deleteDecision as ReturnType<typeof vi.fn>;

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

const caller = appRouter.createCaller;

describe("Decisions tRPC Procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("decisions.getByContract", () => {
    it("should return saved decisions as a map", async () => {
      mockGetDecisions.mockResolvedValue([
        { id: 1, userId: 1, contractId: 5, clauseId: 10, decision: "accepted", createdAt: new Date(), updatedAt: new Date() },
        { id: 2, userId: 1, contractId: 5, clauseId: 11, decision: "rejected", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const ctx = createUserContext();
      const result = await caller(ctx).decisions.getByContract({ contractId: 5 });

      expect(result).toEqual({ "10": "accepted", "11": "rejected" });
      expect(mockGetDecisions).toHaveBeenCalledWith(5, 1);
    });

    it("should return empty map when no decisions exist", async () => {
      mockGetDecisions.mockResolvedValue([]);

      const ctx = createUserContext();
      const result = await caller(ctx).decisions.getByContract({ contractId: 5 });

      expect(result).toEqual({});
    });

    it("should reject unauthenticated requests", async () => {
      const ctx = createUnauthenticatedContext();
      await expect(caller(ctx).decisions.getByContract({ contractId: 5 }))
        .rejects.toThrow();
    });
  });

  describe("decisions.save", () => {
    it("should save a single decision", async () => {
      mockUpsert.mockResolvedValue(undefined);

      const ctx = createUserContext();
      const result = await caller(ctx).decisions.save({
        contractId: 5,
        clauseId: 10,
        decision: "accepted",
      });

      expect(result).toEqual({ success: true });
      expect(mockUpsert).toHaveBeenCalledWith(1, 5, 10, "accepted");
    });

    it("should reject invalid decision values", async () => {
      const ctx = createUserContext();
      await expect(caller(ctx).decisions.save({
        contractId: 5,
        clauseId: 10,
        decision: "maybe" as any,
      })).rejects.toThrow();
    });
  });

  describe("decisions.saveAll", () => {
    it("should bulk save all decisions", async () => {
      mockBulkUpsert.mockResolvedValue(undefined);

      const ctx = createUserContext();
      const result = await caller(ctx).decisions.saveAll({
        contractId: 5,
        decisions: { "10": "accepted", "11": "rejected", "12": "accepted" },
      });

      expect(result).toEqual({ success: true });
      expect(mockBulkUpsert).toHaveBeenCalledWith(1, 5, { "10": "accepted", "11": "rejected", "12": "accepted" });
    });
  });

  describe("decisions.remove", () => {
    it("should remove a decision (undo)", async () => {
      mockDelete.mockResolvedValue(undefined);

      const ctx = createUserContext();
      const result = await caller(ctx).decisions.remove({ clauseId: 10 });

      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalledWith(1, 10);
    });
  });
});
