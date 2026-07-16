/**
 * Machine-readable AI marking for exported deliverables.
 *
 * Article 50(2) of Regulation (EU) 2024/1689 (the AI Act) requires providers
 * of generative AI systems to mark outputs as artificially generated in a
 * machine-readable way; the transparency obligations apply from 2 August 2026.
 * Our own Transparentnost AI document (marketing/transparentnost-ai.html)
 * promises this marking, so the exports have to actually carry it.
 *
 * The strings are deliberately ASCII-only: PDF metadata encoding varies by
 * viewer, and a marking that some tool cannot read defeats its purpose. The
 * human-facing disclaimers inside the documents stay in full Slovak; this is
 * the machine-facing layer.
 */

/** Metadata subject/description line, honest about whether a lawyer verified it. */
export function aiOutputStatement(isSigned: boolean): string {
  return isSigned
    ? "Obsah vytvoreny systemom umelej inteligencie (AI) a overeny advokatom. AI-assisted output, verified by a lawyer. Nariadenie (EU) 2024/1689 cl. 50."
    : "Obsah vytvoreny systemom umelej inteligencie (AI), bez overenia advokatom. AI-generated output, not verified by a lawyer. Nariadenie (EU) 2024/1689 cl. 50.";
}

/** Keyword tokens for metadata scanners. */
export const AI_MARKING_KEYWORDS = "AI-generated, umela inteligencia, bod.legal, Regulation-EU-2024-1689-Art-50";

/** Producer/creator identification. */
export const AI_MARKING_CREATOR = "bod.legal (KILIAN LEGAL s. r. o.)";
