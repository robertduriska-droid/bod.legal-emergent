import { beforeEach, describe, expect, it, vi } from "vitest";

const deleted: string[] = [];
const updated: Array<{ id: number; fileDeletedAt: Date }> = [];
let rows: any[] = [];
let deleteFails = false;
let dbAvailable = true;

vi.mock("./storage", () => ({
  storageDelete: async (key: string) => {
    if (deleteFails) throw new Error("R2 is down");
    deleted.push(key);
  },
}));

vi.mock("./db", () => ({
  getDb: async () =>
    dbAvailable
      ? {
          select: () => ({ from: () => ({ where: async () => rows }) }),
          update: () => ({
            set: (values: { fileDeletedAt: Date }) => ({
              where: async (cond: any) => {
                updated.push({ id: cond.__id, fileDeletedAt: values.fileDeletedAt });
              },
            }),
          }),
        }
      : null,
}));

// eq(contracts.id, contract.id) is opaque to the fake db above, so carry the id
// through in a shape the update mock can read back.
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, eq: (_col: unknown, value: number) => ({ __id: value }) };
});

import { purgeExpiredUploads, retentionCutoff, RETENTION_DAYS } from "./retention";

function contract(over: Partial<any> = {}) {
  return { id: 1, fileKey: "uploads/a.pdf", status: "completed", fileDeletedAt: null, ...over };
}

beforeEach(() => {
  deleted.length = 0;
  updated.length = 0;
  rows = [];
  deleteFails = false;
  dbAvailable = true;
});

describe("retention period", () => {
  // The whole point of this module: the number here must match what the FAQ,
  // the About page, the GDPR page and the client's email all say.
  it("is the 30 days we promise clients in writing", () => {
    expect(RETENTION_DAYS).toBe(30);
  });

  it("counts back exactly 30 days from now", () => {
    const now = new Date("2026-07-16T12:00:00Z");
    expect(retentionCutoff(now).toISOString()).toBe("2026-06-16T12:00:00.000Z");
  });
});

describe("purgeExpiredUploads", () => {
  it("deletes the file and marks the row", async () => {
    rows = [contract({ id: 7, fileKey: "uploads/zmluva.pdf" })];
    const now = new Date("2026-07-16T12:00:00Z");

    const result = await purgeExpiredUploads(now);

    expect(deleted).toEqual(["uploads/zmluva.pdf"]);
    expect(updated).toEqual([{ id: 7, fileDeletedAt: now }]);
    expect(result).toEqual({ purged: 1, failed: 0, held: 0 });
  });

  // A file still under review must survive: the lawyer cannot review a document
  // we deleted underneath them.
  it("holds back contracts still awaiting lawyer review", async () => {
    rows = [contract({ id: 3, status: "in_review" })];

    const result = await purgeExpiredUploads();

    expect(deleted).toEqual([]);
    expect(updated).toEqual([]);
    expect(result).toEqual({ purged: 0, failed: 0, held: 1 });
  });

  it("purges abandoned uploads that never finished analysing", async () => {
    rows = [contract({ id: 4, status: "pending" }), contract({ id: 5, status: "analyzing" })];

    const result = await purgeExpiredUploads();

    expect(result.purged).toBe(2);
  });

  // Marking a row whose file is still in the bucket would be a lie recorded in
  // the database, so a failed delete must leave fileDeletedAt NULL to retry.
  it("does not mark the row when the file could not be deleted", async () => {
    rows = [contract({ id: 8 })];
    deleteFails = true;

    const result = await purgeExpiredUploads();

    expect(updated).toEqual([]);
    expect(result).toEqual({ purged: 0, failed: 1, held: 0 });
  });

  it("survives an unavailable database", async () => {
    dbAvailable = false;

    const result = await purgeExpiredUploads();

    expect(result).toEqual({ purged: 0, failed: 0, held: 0 });
  });

  it("processes every expired contract even when one fails", async () => {
    rows = [contract({ id: 1 }), contract({ id: 2, status: "in_review" }), contract({ id: 3 })];

    const result = await purgeExpiredUploads();

    expect(result).toEqual({ purged: 2, failed: 0, held: 1 });
  });
});
