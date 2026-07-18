// Whole-contract redline: give the client back their OWN contract with the
// suggested edits marked as tracked changes, ready to forward to the other
// side. The report already lists edits clause by clause; this places them back
// into the full document so the client sends one file instead of transplanting
// edits by hand. That hand-work was the biggest reason a demanding customer
// hesitated to pay.
//
// The matching is whitespace- and case-tolerant because the AI excerpt rarely
// matches the source byte for byte (line breaks, spacing). An edit whose
// excerpt cannot be located is not dropped: it is returned in `unmatched` and
// appended to the document as an additional suggested change, so nothing the
// lawyer approved is ever lost.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  InsertedTextRun,
  DeletedTextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

export interface RedlineEdit {
  excerpt?: string | null;
  suggestedEdit?: string | null;
  title?: string | null;
}

export type RedlineSegment =
  | { kind: "keep"; text: string }
  | { kind: "change"; del: string; ins: string };

/** Normalized copy of `s` (whitespace collapsed, lowercased) plus a map from
 *  each normalized index back to the original index. */
function normalize(s: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  let prevSpace = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      if (!prevSpace) {
        norm += " ";
        map.push(i);
        prevSpace = true;
      }
    } else {
      norm += ch.toLowerCase();
      map.push(i);
      prevSpace = false;
    }
  }
  return { norm, map };
}

/**
 * Split `sourceText` into keep/change segments. Pure and unit-tested: no docx.
 */
export function applyRedlineSegments(
  sourceText: string,
  edits: RedlineEdit[],
): { segments: RedlineSegment[]; unmatched: RedlineEdit[] } {
  const { norm, map } = normalize(sourceText);
  const ranges: { start: number; end: number; ins: string }[] = [];
  const unmatched: RedlineEdit[] = [];

  for (const e of edits) {
    const excerpt = (e.excerpt || "").trim();
    const ins = (e.suggestedEdit || "").trim();
    if (!ins) continue; // nothing to propose
    if (!excerpt) {
      unmatched.push(e);
      continue;
    }
    const en = normalize(excerpt).norm.trim();
    const idx = en ? norm.indexOf(en) : -1;
    if (idx === -1) {
      unmatched.push(e);
      continue;
    }
    const start = map[idx];
    const end = map[idx + en.length - 1] + 1;
    ranges.push({ start, end, ins });
  }

  ranges.sort((a, b) => a.start - b.start);

  const segments: RedlineSegment[] = [];
  let pos = 0;
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start < lastEnd) continue; // overlapping match: keep the first, skip
    if (r.start > pos) segments.push({ kind: "keep", text: sourceText.slice(pos, r.start) });
    segments.push({ kind: "change", del: sourceText.slice(r.start, r.end), ins: r.ins });
    pos = r.end;
    lastEnd = r.end;
  }
  if (pos < sourceText.length) segments.push({ kind: "keep", text: sourceText.slice(pos) });

  return { segments, unmatched };
}

const AUTHOR = "bod.legal";
const REV_DATE = "2026-01-01T00:00:00Z"; // fixed so exports are deterministic

const L = {
  sk: {
    title: "Zmluva s navrhovanými zmenami",
    subtitle: "Sledované zmeny (Track Changes) | bod.legal",
    intro:
      "Tento dokument je vaša pôvodná zmluva s navrhovanými úpravami vyznačenými ako sledované zmeny. Otvorte ho v Microsoft Word, cez Revízie prijmite alebo odmietnite jednotlivé zmeny a dokument pošlite druhej strane.",
    additional: "Ďalšie navrhované úpravy",
    additionalNote:
      "Tieto úpravy sa nedali automaticky umiestniť do textu zmluvy. Zapracujte ich ručne na príslušné miesto.",
  },
  en: {
    title: "Contract with proposed changes",
    subtitle: "Track Changes | bod.legal",
    intro:
      "This is your original contract with the proposed edits marked as tracked changes. Open it in Microsoft Word, accept or reject each change under Review, and send it to the other side.",
    additional: "Additional proposed edits",
    additionalNote:
      "These edits could not be placed into the contract text automatically. Apply them manually at the right place.",
  },
};

/**
 * Render the whole-contract redline DOCX from the stored source text and the
 * (lawyer-approved) edits.
 */
export async function generateWholeRedlineDocx(
  sourceText: string,
  edits: RedlineEdit[],
  lang: "sk" | "en" = "sk",
): Promise<Buffer> {
  const t = L[lang];
  const { segments, unmatched } = applyRedlineSegments(sourceText, edits);
  let revId = 1;

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: t.title, bold: true, size: 40, font: "Georgia" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: t.subtitle, size: 18, color: "888888" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: t.intro, italics: true, size: 20, color: "555555" })],
      spacing: { after: 300 },
    }),
  ];

  // Body: walk segments, splitting kept text on line breaks into paragraphs and
  // rendering changes inline (delete original + insert suggested).
  let runs: (TextRun | InsertedTextRun | DeletedTextRun)[] = [];
  const flush = () => {
    children.push(new Paragraph({ children: runs.length ? runs : [new TextRun({ text: "" })], spacing: { after: 80 } }));
    runs = [];
  };
  for (const seg of segments) {
    if (seg.kind === "keep") {
      const lines = seg.text.split(/\n/);
      lines.forEach((line, i) => {
        if (i > 0) flush();
        if (line) runs.push(new TextRun({ text: line }));
      });
    } else {
      runs.push(
        new DeletedTextRun({ text: seg.del, id: revId++, author: AUTHOR, date: REV_DATE, color: "CC0000" }),
        new InsertedTextRun({ text: seg.ins, id: revId++, author: AUTHOR, date: REV_DATE, color: "006600" }),
      );
    }
  }
  flush();

  if (unmatched.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: t.additional })],
        spacing: { before: 300, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: t.additionalNote, italics: true, size: 18, color: "888888" })],
        spacing: { after: 150 },
      }),
    );
    for (const e of unmatched) {
      if (e.title) {
        children.push(new Paragraph({ children: [new TextRun({ text: e.title, bold: true })], spacing: { after: 40 } }));
      }
      children.push(
        new Paragraph({
          children: [
            new InsertedTextRun({ text: (e.suggestedEdit || "").trim(), id: revId++, author: AUTHOR, date: REV_DATE, color: "006600" }),
          ],
          spacing: { after: 150 },
        }),
      );
    }
  }

  const doc = new Document({
    title: "bod.legal redline",
    creator: "bod.legal (KILIAN LEGAL s. r. o.)",
    features: { trackRevisions: true },
    sections: [{ children }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
