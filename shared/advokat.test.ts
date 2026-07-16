import { describe, it, expect } from "vitest";
import { ADVOKAT, KONCIPIENT, isAdvokatConfigured, resolveSigner, signOffLine, signOffLines } from "./advokat";

describe("advokát sign-off", () => {
  it("stamps the SAK number when the advokát signs", () => {
    expect(signOffLines("JUDr. Michal Kilian, LL.M.")).toEqual([
      "JUDr. Michal Kilian, LL.M., SAK reg. č. 7185",
    ]);
  });

  it("falls back to the configured advokát when the report stores no name", () => {
    expect(signOffLines(null)[0]).toContain("7185");
    expect(signOffLines("  ")[0]).toContain("Kilian");
  });

  // lawyerName comes from the signer's Google profile, so it arrives without
  // titles and often without diacritics; the surname must be enough.
  it("recognises signers by surname, títles and diacritics aside", () => {
    expect(resolveSigner("Michal Kilian")).toBe("advokat");
    expect(resolveSigner("Robert Duriska")).toBe("koncipient");
    expect(resolveSigner("JUDr. Róbert Ďuriška")).toBe("koncipient");
    expect(resolveSigner("JUDr. Iný Advokát")).toBe("other");
  });

  // The koncipient reviews under the advokát's supervision (zákon č. 586/2003
  // Z. z.): the deliverable must show who reviewed AND who answers for it.
  it("signs the koncipient with the responsible advokát on a second line", () => {
    const sk = signOffLines("Robert Duriska", "sk");
    expect(sk).toHaveLength(2);
    expect(sk[0]).toBe("JUDr. Róbert Ďuriška, advokátsky koncipient");
    expect(sk[1]).toContain("Za správnosť zodpovedá");
    expect(sk[1]).toContain("Kilian");
    expect(sk[1]).toContain("7185");

    const en = signOffLines("Robert Duriska", "en");
    expect(en[0]).toContain("trainee lawyer");
    expect(en[1]).toContain("Responsible attorney");
  });

  // The SAK number belongs to the advokát. The koncipient's own line must not
  // carry it, and an unknown signer gets no number at all.
  it("never lets the SAK number sit next to anyone else's bare name", () => {
    expect(signOffLines("Robert Duriska")[0]).not.toContain("7185");
    expect(signOffLines("JUDr. Iný Advokát")).toEqual(["JUDr. Iný Advokát"]);
  });

  it("keeps the single-line variant for narrow layouts", () => {
    expect(signOffLine("Michal Kilian")).toBe("JUDr. Michal Kilian, LL.M., SAK reg. č. 7185");
    expect(signOffLine("Robert Duriska")).toContain(" · Za správnosť zodpovedá");
  });

  it("carries real identities, not placeholders", () => {
    expect(isAdvokatConfigured()).toBe(true);
    expect(ADVOKAT.sakId).toBe("7185");
    expect(KONCIPIENT.name).toBe("JUDr. Róbert Ďuriška");
  });
});
