import { describe, it, expect } from "vitest";
import { ADVOKAT, isAdvokatConfigured, signOffLine } from "./advokat";

describe("advokát sign-off", () => {
  it("stamps the SAK number of the configured advokát", () => {
    expect(signOffLine("JUDr. Michal Kilian, LL.M.")).toBe("JUDr. Michal Kilian, LL.M., SAK reg. 7185");
  });

  it("falls back to the configured advokát when the report stores no name", () => {
    expect(signOffLine(null)).toBe("JUDr. Michal Kilian, LL.M., SAK reg. 7185");
    expect(signOffLine("  ")).toBe("JUDr. Michal Kilian, LL.M., SAK reg. 7185");
  });

  // The number belongs to a person, not to the product. A report signed by
  // anyone else must never inherit Kilian's registration number.
  it("never attaches the SAK number to a different lawyer", () => {
    expect(signOffLine("JUDr. Iný Advokát")).toBe("JUDr. Iný Advokát");
  });

  it("carries a real SAK identity, not a placeholder", () => {
    expect(isAdvokatConfigured()).toBe(true);
    expect(ADVOKAT.sakId).toBe("7185");
  });
});
