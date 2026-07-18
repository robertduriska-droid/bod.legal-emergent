/**
 * The one answer a non-lawyer opens the report for: can I sign this?
 *
 * The report already lists risks and counts them, but a business owner wants a
 * decision before the detail. This turns the numbers we already have into a
 * single traffic-light verdict with a plain-language sentence.
 *
 * Honest by construction: it reports what the analysis found, never a
 * guarantee. The report page and exports carry the signed/unsigned state and
 * the standing disclaimers around this; the verdict does not restate them.
 */
export type VerdictLevel = "stop" | "caution" | "go";

export interface Verdict {
  level: VerdictLevel;
  titleSk: string;
  titleEn: string;
  detailSk: string;
  detailEn: string;
}

export function computeVerdict(input: {
  high: number;
  medium: number;
  dealBreakers?: number;
}): Verdict {
  const high = Math.max(0, input.high || 0);
  const medium = Math.max(0, input.medium || 0);
  const dealBreakers = Math.max(0, input.dealBreakers || 0);

  // A deal-breaker or any critical (high) finding means: do not sign yet.
  if (dealBreakers > 0 || high > 0) {
    const n = dealBreakers > 0 ? dealBreakers : high;
    return {
      level: "stop",
      titleSk: "Zmluvu zatiaľ nepodpisujte",
      titleEn: "Do not sign yet",
      detailSk: `Našli sme ${n} ${n === 1 ? "kritický bod" : n < 5 ? "kritické body" : "kritických bodov"}, ktoré vás môžu vážne poškodiť. Pred podpisom ich treba vyriešiť.`,
      detailEn: `We found ${n} critical ${n === 1 ? "issue" : "issues"} that could seriously harm you. Resolve them before signing.`,
    };
  }

  // Only important (medium) findings: usable, but negotiate the edits first.
  if (medium > 0) {
    return {
      level: "caution",
      titleSk: "Podpíšte až po úpravách",
      titleEn: "Sign after edits",
      detailSk: `Nenašli sme kritické riziká, ale ${medium} ${medium === 1 ? "dôležitý bod" : medium < 5 ? "dôležité body" : "dôležitých bodov"} odporúčame upraviť pred podpisom. Návrhy úprav sú v reporte.`,
      detailEn: `No critical risks, but ${medium} important ${medium === 1 ? "point" : "points"} should be edited before signing. Suggested wording is in the report.`,
    };
  }

  return {
    level: "go",
    titleSk: "Nenašli sme zásadné riziká",
    titleEn: "No serious risks found",
    detailSk: "V zmluve sme nenašli kritické ani dôležité riziká. Z pohľadu rizík ju môžete podpísať.",
    detailEn: "We found no critical or important risks in this contract. From a risk standpoint you can sign it.",
  };
}
