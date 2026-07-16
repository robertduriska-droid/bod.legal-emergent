/**
 * Advokát identity: the single source of truth for the lawyer who verifies and
 * signs paid reports. Lives in shared/ because both sides need it: the client
 * renders the trust block and the report card, and the server stamps the PDF
 * and DOCX the client actually keeps.
 *
 * Nothing here may be invented. Every value below is confirmed against the SAK
 * register. Report.tsx once carried a hardcoded "SAK č. 19668", which was not
 * this lawyer's number: a wrong registration number on a signed legal document
 * is exactly the kind of claim this config exists to prevent.
 *
 * Verified 2026-07-16 against the SAK register of advokáti:
 *   reg. č. 7185 · KILIAN Michal JUDr., LL.M. · Chorvátsky Grob · Advokát
 * Firm: KILIAN LEGAL s. r. o., IČO 53 957 008, SAK entry /osp/904263.
 */
export const ADVOKAT = {
  name: "JUDr. Michal Kilian, LL.M.",
  sakId: "7185",
  /** No photo yet. The trust block renders without one; add a real file, never a stock face. */
  photoUrl: "",
  sakRegisterUrl: "https://www.sak.sk/web/sk/cms/lawyer/list",
};

/** Public search page of the Slovak Bar Association register (generic fallback link). */
export const SAK_REGISTER_SEARCH_URL = "https://www.sak.sk/web/sk/cms/lawyer/list";

/** True only when a real advokát identity is configured (no placeholders). */
export function isAdvokatConfigured(): boolean {
  return ADVOKAT.name.trim().length > 0 && ADVOKAT.sakId.trim().length > 0;
}

/**
 * The sign-off line for a signed deliverable, e.g.
 * "JUDr. Michal Kilian, LL.M., SAK reg. 7185".
 *
 * @param lawyerName the name stored on the report at signing time. It wins over
 *   the config, so a report signed by someone else keeps their name; the SAK
 *   number is only appended when the name matches the configured advokát.
 */
export function signOffLine(lawyerName: string | null | undefined): string {
  const name = (lawyerName || "").trim() || ADVOKAT.name;
  const sameLawyer = name === ADVOKAT.name;
  return sameLawyer && ADVOKAT.sakId ? `${name}, SAK reg. ${ADVOKAT.sakId}` : name;
}
