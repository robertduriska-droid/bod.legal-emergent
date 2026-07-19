// PII redaction: strip personal and identifying data BEFORE any external model call.
//
// This is a non-negotiable of the service (see CLAUDE.md §2.2): bod.legal runs
// under KILIAN LEGAL s. r. o. and its advokat is bound by mlcanlivost (§ 23
// zakona c. 586/2003 Z. z.), so client contracts must never reach a third-party
// model with personal data intact.
//
// The patterns are ported verbatim from the predecessor tool
// (~/Dolozka/dolozka_engine.py), where they were already tuned against real
// Slovak contracts. Two families:
//   PATTERNS  - the match itself is the secret, replace the whole match.
//   LABELLED  - a label precedes the value ("ICO: 12345678"); keep the label so
//               the model still understands the sentence, redact only the value.
//
// Redaction is deliberately conservative: over-redacting costs a little context,
// under-redacting leaks client data. When in doubt, redact.

/** Replace-the-whole-match patterns. */
const PATTERNS: { label: string; re: RegExp }[] = [
  { label: "IBAN", re: /\b[A-Z]{2}\d{2}(?: ?\w{4}){2,7}\b/g },
  { label: "RODNÉ ČÍSLO", re: /\b\d{6}\/\d{3,4}\b/g },
  { label: "EMAIL", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  // Slovak numbers with or without country code. The lookarounds stop it from
  // eating a longer digit run (e.g. an amount) that merely starts like a phone.
  { label: "TELEFÓN", re: /(?<!\d)(?:\+421|00421|0)[ ]?\d{2,3}[ /]?\d{3}[ ]?\d{2,3}(?!\d)/g },
];

/** Keep-the-label patterns: capture group 1 is the label, the value is redacted. */
const LABELLED: { label: string; re: RegExp }[] = [
  { label: "IČ DPH", re: /(IČ\s*DPH[:\s]*)[A-Z]{2}[\d ]{10,13}/g },
  { label: "DIČ", re: /(DIČ[:\s]*)\d[\d ]{7,11}\d/g },
  { label: "IČO", re: /(IČO[:\s]*)\d[\d ]{4,9}\d/g },
];

export type RedactionCounts = Record<string, number>;

export interface RedactionResult {
  /** Text safe to send to an external model. */
  text: string;
  /** How many values were redacted, per label. Empty when nothing matched. */
  counts: RedactionCounts;
  /** Total redacted values, for logging and the client-facing trust note. */
  total: number;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Redact personal data from contract text.
 *
 * @param text        raw extracted contract text
 * @param extraNames  optional party names to scrub as well (e.g. the client's
 *                    own name), matched case-insensitively
 */
export function redact(text: string, extraNames: string[] = []): RedactionResult {
  const counts: RedactionCounts = {};
  let out = text;

  const bump = (label: string, n: number) => {
    if (n > 0) counts[label] = (counts[label] || 0) + n;
  };

  // LABELLED runs FIRST, deliberately. A Slovak "IČ DPH: SK2121545919" also
  // matches the IBAN shape (two letters, two digits, then 4-char blocks), so if
  // IBAN ran first it would swallow the VAT number and mislabel it [IBAN]. The
  // value would still be redacted, but the model would be told the wrong thing.
  // Claiming the labelled values by their own label first avoids that.
  for (const { label, re } of LABELLED) {
    let n = 0;
    out = out.replace(new RegExp(re.source, re.flags), (_m, prefix: string) => {
      n++;
      return `${prefix}[${label}]`;
    });
    bump(label, n);
  }

  for (const { label, re } of PATTERNS) {
    let n = 0;
    out = out.replace(new RegExp(re.source, re.flags), () => {
      n++;
      return `[${label}]`;
    });
    bump(label, n);
  }

  for (const raw of extraNames) {
    const name = raw.trim();
    if (!name) continue;
    let n = 0;
    out = out.replace(new RegExp(escapeRegExp(name), "gi"), () => {
      n++;
      return "[MENO]";
    });
    bump("MENO", n);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { text: out, counts, total };
}

/** Compact "IBAN x2, EMAIL x1" summary for logs. Never log the values themselves. */
export function summarizeRedaction(counts: RedactionCounts): string {
  const parts = Object.entries(counts).map(([label, n]) => `${label} x${n}`);
  return parts.length ? parts.join(", ") : "nothing matched";
}
