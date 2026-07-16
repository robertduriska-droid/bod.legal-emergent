import { describe, expect, it } from "vitest";
import { aiOutputStatement, AI_MARKING_KEYWORDS, AI_MARKING_CREATOR } from "./aiMarking";

// Article 50(2) of Regulation (EU) 2024/1689 applies from 2 August 2026 and our
// Transparentnost AI document promises machine-readable marking. These tests
// keep the marking honest and machine-safe.
describe("AI output marking", () => {
  it("names the regulation in both variants", () => {
    expect(aiOutputStatement(true)).toContain("2024/1689");
    expect(aiOutputStatement(false)).toContain("2024/1689");
  });

  it("only claims lawyer verification on signed outputs", () => {
    expect(aiOutputStatement(true)).toContain("overeny advokatom");
    expect(aiOutputStatement(false)).toContain("bez overenia advokatom");
    expect(aiOutputStatement(false)).not.toContain(" a overeny advokatom");
  });

  // PDF metadata encoding varies by viewer; a marking some tool cannot read
  // defeats its purpose, so the machine-facing layer stays ASCII.
  it("is pure ASCII so every metadata reader can parse it", () => {
    for (const s of [aiOutputStatement(true), aiOutputStatement(false), AI_MARKING_KEYWORDS, AI_MARKING_CREATOR]) {
      expect(/^[\x20-\x7E]+$/.test(s), `non-ASCII in: ${s}`).toBe(true);
    }
  });

  it("keywords flag the content as AI generated", () => {
    expect(AI_MARKING_KEYWORDS).toContain("AI-generated");
  });
});
