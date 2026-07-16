/**
 * Advokat identity config, the single source of truth for the lawyer shown
 * on the landing page (and reused by About). Nothing here is invented: until
 * the real identity is filled in, all fields stay empty and the UI renders
 * only the generic wording ("advokát zapísaný v SAK, prevádzkuje KILIAN
 * LEGAL s.r.o.").
 *
 * To activate the personal trust block, fill in:
 *  - name: full name incl. titles, e.g. "JUDr. Meno Priezvisko"
 *  - sakId: SAK registration number, e.g. "1234"
 *  - photoUrl: path to a real photo, e.g. "/img/advokat.jpg"
 *  - sakRegisterUrl: direct link to the lawyer's entry in the SAK register
 */
export const ADVOKAT = {
  name: "",
  sakId: "",
  photoUrl: "",
  sakRegisterUrl: "",
};

/** Public search page of the Slovak Bar Association register (generic fallback link). */
export const SAK_REGISTER_SEARCH_URL = "https://www.sak.sk/web/sk/cms/lawyer/list";

/** True only when a real advokat identity has been configured (no placeholders). */
export function isAdvokatConfigured(): boolean {
  return ADVOKAT.name.trim().length > 0 && ADVOKAT.sakId.trim().length > 0;
}
