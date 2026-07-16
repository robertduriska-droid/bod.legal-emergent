import { beforeEach, describe, expect, it, vi } from "vitest";

let rows: any[] = [];
const statusUpdates: Array<{ id: number; status: string }> = [];
const restartedIds: number[] = [];
let dbAvailable = true;

vi.mock("../db", () => ({
  getDb: async () =>
    dbAvailable
      ? {
          // Mirror the real filter: only rows still in "analyzing" come back.
          select: () => ({
            from: () => ({ where: async () => rows.filter(r => r.status === "analyzing") }),
          }),
          update: () => ({
            set: (values: { status: string }) => ({
              where: async (cond: any) => {
                statusUpdates.push({ id: cond.__id, status: values.status });
                const row = rows.find(r => r.id === cond.__id);
                if (row) row.status = values.status;
              },
            }),
          }),
        }
      : null,
}));

vi.mock("../analysis", () => ({
  // Simulates a poisoned run: it starts (status back to analyzing) and dies,
  // leaving the row stuck again for the next sweep to find.
  analyzeContract: async (id: number) => {
    restartedIds.push(id);
    const row = rows.find(r => r.id === id);
    if (row) row.status = "analyzing";
  },
}));

vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    // eq(contracts.id, value) must carry the id through the fake db above;
    // other eq() uses in the module (status filter) pass strings, kept as is.
    eq: (_col: unknown, value: unknown) =>
      typeof value === "number" ? { __id: value } : actual.eq(_col as any, value as any),
  };
});

// The sweep loop is not exported; drive it through startAnalysisWatchdog with
// fake timers so the test controls time instead of waiting minutes.
import { startAnalysisWatchdog } from "./analysisWatchdog";

function stuckContract(id: number) {
  return { id, status: "analyzing", updatedAt: new Date(0) };
}

beforeEach(() => {
  rows = [];
  statusUpdates.length = 0;
  restartedIds.length = 0;
  dbAvailable = true;
  vi.useFakeTimers();
});

describe("analysis watchdog", () => {
  it("restarts a contract orphaned mid-analysis", async () => {
    rows = [stuckContract(7)];
    startAnalysisWatchdog();
    await vi.advanceTimersByTimeAsync(21 * 1000);

    expect(statusUpdates).toEqual([{ id: 7, status: "pending" }]);
    expect(restartedIds).toEqual([7]);
  });

  // A poisoned contract that dies on every run must not loop forever: after
  // the cap it is parked in pending, where the client UI offers manual retry.
  it("parks a contract after the auto-restart cap", async () => {
    rows = [stuckContract(9)];
    startAnalysisWatchdog();
    await vi.advanceTimersByTimeAsync(21 * 1000); // attempt 1
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000); // attempt 2
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000); // cap reached: park
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000); // stays parked

    expect(restartedIds).toEqual([9, 9]);
    const parked = statusUpdates.filter(u => u.status === "pending");
    expect(parked.length).toBeGreaterThanOrEqual(3);
  });

  it("survives an unavailable database", async () => {
    dbAvailable = false;
    startAnalysisWatchdog();
    await vi.advanceTimersByTimeAsync(21 * 1000);

    expect(statusUpdates).toEqual([]);
    expect(restartedIds).toEqual([]);
  });
});
