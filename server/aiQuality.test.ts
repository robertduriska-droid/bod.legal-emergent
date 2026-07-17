import { describe, expect, it } from "vitest";
import { deriveAiQuality } from "./db";

// AI quality is measured from the lawyer's own corrections on signed reports:
// kept = AI correct, risk overridden = AI right about the risk but wrong on the
// level, excluded = false positive. Precision counts everything the lawyer did
// NOT throw out.
describe("deriveAiQuality", () => {
  it("counts kept-as-is as total minus false positives and corrections", () => {
    const q = deriveAiQuality(10, 1, 2, 3);
    expect(q.reviewedClauses).toBe(10);
    expect(q.acceptedAsIs).toBe(7);
    expect(q.severityCorrected).toBe(2);
    expect(q.falsePositives).toBe(1);
    expect(q.signedReports).toBe(3);
  });

  it("treats a corrected severity as a hit, not a miss (precision counts it)", () => {
    // 10 clauses, 0 excluded, 4 severity-corrected: precision is still 100%
    // because the lawyer agreed every flag was a real risk.
    expect(deriveAiQuality(10, 0, 4, 2).precisionPct).toBe(100);
  });

  it("drops precision only for false positives (excluded clauses)", () => {
    expect(deriveAiQuality(10, 3, 0, 2).precisionPct).toBe(70);
  });

  it("returns zero precision on an empty sample without dividing by zero", () => {
    const q = deriveAiQuality(0, 0, 0, 0);
    expect(q.precisionPct).toBe(0);
    expect(q.acceptedAsIs).toBe(0);
  });

  it("never lets counts push acceptedAsIs negative", () => {
    expect(deriveAiQuality(5, 4, 4, 1).acceptedAsIs).toBe(0);
  });
});
