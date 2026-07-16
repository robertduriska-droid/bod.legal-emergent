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
 * The advokátsky koncipient who performs reviews under the advokát's
 * supervision (zákon č. 586/2003 Z. z.). The employment relationship is what
 * makes this lawful: the koncipient reviews, the advokát answers for it, and
 * every deliverable the koncipient signs must say both things.
 */
export const KONCIPIENT = {
  name: "JUDr. Róbert Ďuriška",
  titleSk: "advokátsky koncipient",
  titleEn: "trainee lawyer (advokátsky koncipient)",
};

/**
 * Signer resolution is diacritics- and title-insensitive because lawyerName is
 * stored from the signer's Google profile at signing time ("Robert Duriska"),
 * not from this config ("JUDr. Róbert Ďuriška"). Matching on the bare surname
 * survives both spellings.
 */
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export type Signer = "advokat" | "koncipient" | "other";

export function resolveSigner(lawyerName: string | null | undefined): Signer {
  const n = normalize((lawyerName || "").trim());
  if (!n) return "advokat"; // legacy rows with no name: the configured advokát signed
  if (n.includes("kilian")) return "advokat";
  if (n.includes("duriska")) return "koncipient";
  return "other";
}

/**
 * The sign-off block for a signed deliverable, one string per line.
 *
 * - the advokát signs alone: name + SAK number;
 * - the koncipient signs: their own name and title on line one, the
 *   responsible advokát with the SAK number on line two. The number belongs
 *   to the advokát, so it may never sit next to anyone else's bare name;
 * - anyone else: their name only, no number, no borrowed authority.
 */
export function signOffLines(
  lawyerName: string | null | undefined,
  lang: "sk" | "en" = "sk",
): string[] {
  switch (resolveSigner(lawyerName)) {
    case "advokat":
      return [`${ADVOKAT.name}, SAK reg. č. ${ADVOKAT.sakId}`];
    case "koncipient":
      return lang === "en"
        ? [
            `${KONCIPIENT.name}, ${KONCIPIENT.titleEn}`,
            `Responsible attorney: ${ADVOKAT.name}, SAK reg. no. ${ADVOKAT.sakId}`,
          ]
        : [
            `${KONCIPIENT.name}, ${KONCIPIENT.titleSk}`,
            `Za správnosť zodpovedá: ${ADVOKAT.name}, advokát, SAK reg. č. ${ADVOKAT.sakId}`,
          ];
    default:
      return [(lawyerName || "").trim()];
  }
}

/** Single-line variant for narrow layouts; joins the block with a separator. */
export function signOffLine(lawyerName: string | null | undefined): string {
  return signOffLines(lawyerName).join(" · ");
}
