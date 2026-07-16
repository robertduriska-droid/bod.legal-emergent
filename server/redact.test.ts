import { describe, it, expect } from "vitest";
import { redact, summarizeRedaction } from "./redact";
import { buildAnalysisRequest } from "./analysis";

// Sensitive values used only as test fixtures. They must never survive redaction.
const IBAN = "SK31 1200 0000 1987 4263 7541";
const RODNE = "850615/1234";
const EMAIL = "jan.novak@example.sk";
const PHONE = "+421 905 123 456";

describe("redact", () => {
  it("removes IBAN, rodné číslo, e-mail and telefón", () => {
    const src = `Účet: ${IBAN}, r. č. ${RODNE}, kontakt ${EMAIL}, tel. ${PHONE}.`;
    const { text, counts, total } = redact(src);

    expect(text).not.toContain("1987");
    expect(text).not.toContain(RODNE);
    expect(text).not.toContain(EMAIL);
    expect(text).not.toContain("905 123 456");

    expect(text).toContain("[IBAN]");
    expect(text).toContain("[RODNÉ ČÍSLO]");
    expect(text).toContain("[EMAIL]");
    expect(text).toContain("[TELEFÓN]");

    expect(counts["IBAN"]).toBe(1);
    expect(total).toBe(4);
  });

  it("keeps the label but redacts the value for IČO, DIČ and IČ DPH", () => {
    const src = "IČO: 53957008, DIČ: 2121545919, IČ DPH: SK2121545919";
    const { text } = redact(src);

    // The model still needs to know an identifier was there.
    expect(text).toContain("IČO:");
    expect(text).toContain("DIČ:");
    expect(text).toContain("[IČO]");
    expect(text).toContain("[DIČ]");
    expect(text).toContain("[IČ DPH]");
    // The actual numbers are gone.
    expect(text).not.toContain("53957008");
    expect(text).not.toContain("2121545919");
  });

  it("scrubs supplied party names case-insensitively", () => {
    const { text, counts } = redact("Zmluva medzi JANOM NOVÁKOM a Jan Novák s.r.o.", ["Jan Novák"]);
    expect(text).toContain("[MENO]");
    expect(counts["MENO"]).toBeGreaterThan(0);
  });

  it("leaves ordinary contract text untouched", () => {
    const src = "Zmluvná pokuta je 50.000 eur podľa § 300 Obchodného zákonníka.";
    const { text, total } = redact(src);
    expect(text).toBe(src);
    expect(total).toBe(0);
  });

  it("counts multiple occurrences and never logs values", () => {
    const { counts } = redact(`${EMAIL} a ${EMAIL}`);
    expect(counts["EMAIL"]).toBe(2);
    const summary = summarizeRedaction(counts);
    expect(summary).toContain("EMAIL x2");
    expect(summary).not.toContain("example.sk");
  });
});

// The guarantee that matters: personal data must be gone by the time the text
// is inside a model request. buildAnalysisRequest is the only path there.
describe("buildAnalysisRequest redacts before the model sees anything", () => {
  const contractText = `ZMLUVA
Predávajúci: Jan Novák, r. č. ${RODNE}, ${EMAIL}, tel. ${PHONE}
IČO: 53957008
Platba na účet ${IBAN}.
Zmluvná pokuta 50.000 eur za každé porušenie.`;

  it("strips every PII value from the outgoing prompt", () => {
    const { messages, redaction } = buildAnalysisRequest({
      language: "sk",
      contractText,
      plan: "basic",
    });
    const wire = JSON.stringify(messages);

    for (const secret of [RODNE, EMAIL, "1987 4263 7541", "905 123 456", "53957008"]) {
      expect(wire).not.toContain(secret);
    }
    // The contract itself still reaches the model.
    expect(wire).toContain("Zmluvná pokuta");
    expect(redaction["RODNÉ ČÍSLO"]).toBe(1);
  });

  it("reports what it redacted so the caller can log it", () => {
    const { redaction } = buildAnalysisRequest({ language: "sk", contractText, plan: "standard" });
    expect(Object.keys(redaction).sort()).toEqual(
      ["EMAIL", "IBAN", "IČO", "RODNÉ ČÍSLO", "TELEFÓN"].sort()
    );
  });
});
