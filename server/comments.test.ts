import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getCommentsByContract: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  // Other exports that might be needed
  getDecisionsByContractAndUser: vi.fn(),
  upsertDecision: vi.fn(),
  bulkUpsertDecisions: vi.fn(),
  deleteDecision: vi.fn(),
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

import { getCommentsByContract, createComment, deleteComment, getContractById } from "./db";

const mockGetComments = getCommentsByContract as ReturnType<typeof vi.fn>;
const mockCreateComment = createComment as ReturnType<typeof vi.fn>;
const mockDeleteComment = deleteComment as ReturnType<typeof vi.fn>;
const mockGetContractById = getContractById as ReturnType<typeof vi.fn>;

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

describe("Comments tRPC Procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("comments.getByContract", () => {
    it("should return all comments for contract owner", async () => {
      mockGetContractById.mockResolvedValue({ id: 5, userId: 1 });
      const mockComments = [
        { id: 1, contractId: 5, clauseId: 10, userId: 1, userName: "Test User", content: "This clause is unclear", createdAt: new Date() },
        { id: 2, contractId: 5, clauseId: 11, userId: 1, userName: "Test User", content: "Please clarify", createdAt: new Date() },
      ];
      mockGetComments.mockResolvedValue(mockComments);

      const ctx = createUserContext(1);
      const result = await caller(ctx).comments.getByContract({ contractId: 5 });

      expect(result).toEqual(mockComments);
      expect(mockGetComments).toHaveBeenCalledWith(5);
    });

    it("should return empty array for non-owner non-admin", async () => {
      mockGetContractById.mockResolvedValue({ id: 5, userId: 99 });

      const ctx = createUserContext(1);
      const result = await caller(ctx).comments.getByContract({ contractId: 5 });

      expect(result).toEqual([]);
      expect(mockGetComments).not.toHaveBeenCalled();
    });

    it("should return empty array when contract not found", async () => {
      mockGetContractById.mockResolvedValue(undefined);

      const ctx = createUserContext();
      const result = await caller(ctx).comments.getByContract({ contractId: 999 });

      expect(result).toEqual([]);
    });

    it("should reject unauthenticated requests", async () => {
      const ctx = createUnauthenticatedContext();
      await expect(caller(ctx).comments.getByContract({ contractId: 5 }))
        .rejects.toThrow();
    });
  });

  describe("comments.add", () => {
    it("should create a comment and return its id for contract owner", async () => {
      mockGetContractById.mockResolvedValue({ id: 5, userId: 1 });
      mockCreateComment.mockResolvedValue(42);

      const ctx = createUserContext();
      const result = await caller(ctx).comments.add({
        contractId: 5,
        clauseId: 10,
        content: "This clause needs revision",
      });

      expect(result).toEqual({ id: 42, success: true });
      expect(mockCreateComment).toHaveBeenCalledWith({
        contractId: 5,
        clauseId: 10,
        userId: 1,
        userName: "Test User",
        content: "This clause needs revision",
      });
    });

    it("should reject non-owner adding comments", async () => {
      mockGetContractById.mockResolvedValue({ id: 5, userId: 99 });

      const ctx = createUserContext(1);
      await expect(caller(ctx).comments.add({
        contractId: 5,
        clauseId: 10,
        content: "test",
      })).rejects.toThrow('Unauthorized');
    });

    it("should reject empty content", async () => {
      const ctx = createUserContext();
      await expect(caller(ctx).comments.add({
        contractId: 5,
        clauseId: 10,
        content: "",
      })).rejects.toThrow();
    });

    it("should reject content exceeding 2000 characters", async () => {
      const ctx = createUserContext();
      await expect(caller(ctx).comments.add({
        contractId: 5,
        clauseId: 10,
        content: "x".repeat(2001),
      })).rejects.toThrow();
    });

    it("should reject unauthenticated requests", async () => {
      const ctx = createUnauthenticatedContext();
      await expect(caller(ctx).comments.add({
        contractId: 5,
        clauseId: 10,
        content: "test",
      })).rejects.toThrow();
    });
  });

  describe("comments.delete", () => {
    it("should delete a comment by id", async () => {
      mockDeleteComment.mockResolvedValue(undefined);

      const ctx = createUserContext();
      const result = await caller(ctx).comments.delete({ id: 42 });

      expect(result).toEqual({ success: true });
      expect(mockDeleteComment).toHaveBeenCalledWith(42, 1);
    });

    it("should reject unauthenticated requests", async () => {
      const ctx = createUnauthenticatedContext();
      await expect(caller(ctx).comments.delete({ id: 42 }))
        .rejects.toThrow();
    });
  });
});
