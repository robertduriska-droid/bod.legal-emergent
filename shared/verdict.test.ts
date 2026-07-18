import { describe, expect, it } from "vitest";
import { computeVerdict } from "./verdict";

// The verdict is the one answer a non-lawyer opens the report for: can I sign?
describe("computeVerdict", () => {
  it("says do-not-sign when there is any critical finding", () => {
    const v = computeVerdict({ high: 1, medium: 0 });
    expect(v.level).toBe("stop");
    expect(v.titleSk).toContain("nepodpisujte");
    expect(v.detailSk).toContain("1 kritický bod");
  });

  it("says do-not-sign when a deal-breaker exists even with no high count", () => {
    const v = computeVerdict({ high: 0, medium: 3, dealBreakers: 2 });
    expect(v.level).toBe("stop");
    expect(v.detailSk).toContain("2 kritické body");
  });

  it("says sign-after-edits when only important findings exist", () => {
    const v = computeVerdict({ high: 0, medium: 4 });
    expect(v.level).toBe("caution");
    expect(v.titleSk).toContain("po úpravách");
    expect(v.detailSk).toContain("4 dôležité body");
  });

  it("says no-serious-risk when nothing critical or important", () => {
    const v = computeVerdict({ high: 0, medium: 0 });
    expect(v.level).toBe("go");
    expect(v.titleSk).toContain("Nenašli");
  });

  it("uses correct Slovak plurals across ranges", () => {
    expect(computeVerdict({ high: 1, medium: 0 }).detailSk).toContain("1 kritický bod");
    expect(computeVerdict({ high: 3, medium: 0 }).detailSk).toContain("3 kritické body");
    expect(computeVerdict({ high: 7, medium: 0 }).detailSk).toContain("7 kritických bodov");
    expect(computeVerdict({ high: 0, medium: 1 }).detailSk).toContain("1 dôležitý bod");
    expect(computeVerdict({ high: 0, medium: 5 }).detailSk).toContain("5 dôležitých bodov");
  });

  it("clamps negative inputs", () => {
    expect(computeVerdict({ high: -3, medium: -1 }).level).toBe("go");
  });
});
