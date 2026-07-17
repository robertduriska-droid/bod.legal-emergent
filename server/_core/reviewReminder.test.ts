import { beforeEach, describe, expect, it, vi } from "vitest";

let rows: any[] = [];
const sent: Array<{ to: string; subject: string; html: string }> = [];
let dbAvailable = true;

vi.mock("../db", () => ({
  getDb: async () =>
    dbAvailable ? { select: () => ({ from: () => ({ where: async () => rows }) }) } : null,
}));

vi.mock("../email", () => ({
  sendEmail: async (m: { to: string; subject: string; html: string }) => {
    sent.push(m);
    return true;
  },
  escapeHtml: (s: string) => s,
  getAppBaseUrl: () => "https://app.bod.legal",
}));

vi.mock("./env", () => ({ ENV: { sendgridFromEmail: "info@bod.legal" } }));

import { sweepReviewQueue } from "./reviewReminder";

function inReview(id: number, fileName: string, hoursAgo: number, now: Date) {
  return {
    id,
    fileName,
    plan: "standard",
    status: "in_review",
    updatedAt: new Date(now.getTime() - hoursAgo * 3600000),
  };
}

beforeEach(() => {
  rows = [];
  sent.length = 0;
  dbAvailable = true;
  process.env.OWNER_EMAIL = "info@bod.legal";
});

describe("review reminder", () => {
  it("mails info@bod.legal a digest of contracts waiting for review", async () => {
    const now = new Date("2026-07-17T12:00:00Z");
    rows = [inReview(30, "zmluva-A.docx", 2, now), inReview(31, "zmluva-B.pdf", 5, now)];

    const waiting = await sweepReviewQueue(now);

    expect(waiting).toBe(2);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("info@bod.legal");
    expect(sent[0].subject).toContain("2");
    expect(sent[0].html).toContain("zmluva-A.docx");
    expect(sent[0].html).toContain("zmluva-B.pdf");
    expect(sent[0].html).toContain("/admin/review/30");
  });

  it("sends nothing when the queue is empty", async () => {
    rows = [];
    const waiting = await sweepReviewQueue(new Date("2026-07-17T12:00:00Z"));
    expect(waiting).toBe(0);
    expect(sent).toHaveLength(0);
  });

  // A contract past ~20 hours is at risk of breaching the 24h guarantee and
  // must stand out in the digest.
  it("flags a contract nearing the 24h guarantee", async () => {
    const now = new Date("2026-07-17T12:00:00Z");
    rows = [inReview(30, "urgent.docx", 21, now)];
    await sweepReviewQueue(now);
    expect(sent[0].html).toContain("urgent.docx");
    expect(sent[0].html).toContain("21 h");
  });

  it("survives an unavailable database", async () => {
    dbAvailable = false;
    const waiting = await sweepReviewQueue(new Date());
    expect(waiting).toBe(0);
    expect(sent).toHaveLength(0);
  });
});
