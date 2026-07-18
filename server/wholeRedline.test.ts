import { describe, expect, it } from "vitest";
import { applyRedlineSegments, generateWholeRedlineDocx } from "./wholeRedline";
import JSZip from "jszip";

// The redline places approved edits back into the client's own contract as
// tracked changes, so they forward one file instead of transplanting edits.
describe("applyRedlineSegments", () => {
  it("replaces a matched excerpt with a tracked change and keeps the rest", () => {
    const src = "Článok 1. Dodávateľ dodá tovar. Článok 2. Splatnosť je 90 dní. Koniec.";
    const { segments, unmatched } = applyRedlineSegments(src, [
      { excerpt: "Splatnosť je 90 dní.", suggestedEdit: "Splatnosť je 14 dní." },
    ]);
    expect(unmatched).toHaveLength(0);
    const change = segments.find(s => s.kind === "change");
    expect(change).toBeTruthy();
    expect(change).toMatchObject({ del: "Splatnosť je 90 dní.", ins: "Splatnosť je 14 dní." });
    // The text before and after the change is preserved.
    expect(segments[0]).toMatchObject({ kind: "keep" });
    expect((segments[0] as any).text).toContain("Dodávateľ dodá tovar");
    expect(segments.at(-1)).toMatchObject({ kind: "keep" });
    expect((segments.at(-1) as any).text).toContain("Koniec.");
  });

  // The AI excerpt rarely matches byte for byte; whitespace and case must not
  // break the match, or the whole feature fails on real contracts.
  it("matches across different whitespace and case", () => {
    const src = "Zmluvná   pokuta\nje 50 %\tz ceny.";
    const { segments, unmatched } = applyRedlineSegments(src, [
      { excerpt: "zmluvná pokuta je 50 % z ceny.", suggestedEdit: "Zmluvná pokuta je 10 % z ceny." },
    ]);
    expect(unmatched).toHaveLength(0);
    expect(segments.some(s => s.kind === "change")).toBe(true);
  });

  // Nothing the lawyer approved may be silently lost.
  it("returns edits it could not place as unmatched, never dropping them", () => {
    const src = "Toto je úplne iná zmluva bez tej klauzuly.";
    const { segments, unmatched } = applyRedlineSegments(src, [
      { excerpt: "klauzula ktorá tu nie je", suggestedEdit: "Nové znenie." },
    ]);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0].suggestedEdit).toBe("Nové znenie.");
    expect(segments.every(s => s.kind === "keep")).toBe(true);
  });

  it("applies several edits in document order", () => {
    const src = "A: staré A. B: staré B. C: staré C.";
    const { segments } = applyRedlineSegments(src, [
      { excerpt: "staré C", suggestedEdit: "nové C" },
      { excerpt: "staré A", suggestedEdit: "nové A" },
    ]);
    const changes = segments.filter(s => s.kind === "change") as any[];
    expect(changes.map(c => c.ins)).toEqual(["nové A", "nové C"]);
  });

  it("skips overlapping matches rather than corrupting the text", () => {
    const src = "platba do 30 dní od doručenia faktúry";
    const { segments } = applyRedlineSegments(src, [
      { excerpt: "do 30 dní", suggestedEdit: "do 14 dní" },
      { excerpt: "30 dní od doručenia", suggestedEdit: "14 dní od doručenia" },
    ]);
    // Only the first non-overlapping change is applied; the reconstructed text
    // (del + surrounding keeps) still equals the source.
    const rebuilt = segments.map(s => (s.kind === "keep" ? s.text : s.del)).join("");
    expect(rebuilt).toBe(src);
  });

  it("an edit with no excerpt is returned as unmatched, not applied blindly", () => {
    const { segments, unmatched } = applyRedlineSegments("nezmenený text", [
      { excerpt: "", suggestedEdit: "niečo" },
    ]);
    expect(unmatched).toHaveLength(1);
    expect(segments).toEqual([{ kind: "keep", text: "nezmenený text" }]);
  });
});

describe("generateWholeRedlineDocx", () => {
  it("produces a valid DOCX with tracked insert and delete and the source text", async () => {
    const src = "Článok 5. Splatnosť faktúr je 90 dní od doručenia. Ostatné ustanovenia platia.";
    const buf = await generateWholeRedlineDocx(src, [
      { excerpt: "Splatnosť faktúr je 90 dní od doručenia.", suggestedEdit: "Splatnosť faktúr je 14 dní od doručenia.", title: "Splatnosť" },
    ], "sk");
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.files["word/document.xml"].async("string");
    expect(xml).toContain("<w:ins");
    expect(xml).toContain("<w:del");
    expect(xml).toContain("14 dní");
    expect(xml).toContain("Ostatné ustanovenia platia");
  });

  it("appends unmatched edits instead of losing them", async () => {
    const buf = await generateWholeRedlineDocx("Krátky text bez tej klauzuly.", [
      { excerpt: "klauzula tu nie je", suggestedEdit: "Doplňte doložku o vyššej moci.", title: "Vyššia moc" },
    ], "sk");
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.files["word/document.xml"].async("string");
    expect(xml).toContain("Ďalšie navrhované úpravy");
    expect(xml).toContain("Doplňte doložku o vyššej moci.");
  });
});
