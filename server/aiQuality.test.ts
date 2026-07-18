import { describe, expect, it } from "vitest";
import { deriveAiQuality } from "./db";

// Two orthogonal metrics from the lawyer's own review of signed reports:
//  - precision: of what the AI flagged, how much survived (excluded = wrong).
//  - recall: of the real risks in the contract, how many the AI caught. The
//    lawyer-added findings (lawyerAdded=1) are the misses.
// deriveAiQuality(totalAiClauses, falsePositives, severityCorrected, misses, signedReports)
describe("deriveAiQuality", () => {
  it("counts kept-as-is as AI total minus false positives and corrections", () => {
    const q = deriveAiQuality(10, 1, 2, 0, 3);
    expect(q.reviewedClauses).toBe(10);
    expect(q.acceptedAsIs).toBe(7);
    expect(q.severityCorrected).toBe(2);
    expect(q.falsePositives).toBe(1);
    expect(q.signedReports).toBe(3);
  });

  it("treats a corrected severity as a precision hit", () => {
    expect(deriveAiQuality(10, 0, 4, 0, 2).precisionPct).toBe(100);
  });

  it("drops precision only for false positives", () => {
    expect(deriveAiQuality(10, 3, 0, 0, 2).precisionPct).toBe(70);
  });

  // Recall: 8 real risks the AI caught (10 flagged minus 2 false positives),
  // 2 the lawyer added as missed → 8/(8+2) = 80%.
  it("computes recall from lawyer-added misses", () => {
    const q = deriveAiQuality(10, 2, 0, 2, 1);
    expect(q.misses).toBe(2);
    expect(q.recallPct).toBe(80);
  });

  it("is 100% recall when the lawyer added nothing", () => {
    expect(deriveAiQuality(10, 1, 1, 0, 1).recallPct).toBe(100);
  });

  it("never divides by zero on an empty sample", () => {
    const q = deriveAiQuality(0, 0, 0, 0, 0);
    expect(q.precisionPct).toBe(0);
    expect(q.recallPct).toBe(0);
    expect(q.acceptedAsIs).toBe(0);
  });

  it("never lets counts push acceptedAsIs negative", () => {
    expect(deriveAiQuality(5, 4, 4, 0, 1).acceptedAsIs).toBe(0);
  });
});
