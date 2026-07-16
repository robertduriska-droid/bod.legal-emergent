import { describe, it, expect, afterEach } from "vitest";
import {
  getAppBaseUrl,
  escapeHtml,
  emailReportReady,
  emailAnalysisAwaitingReview,
  emailNewContractForReview,
  emailReviewCompleted,
  emailFreeScanFollowUp,
} from "./email";

// ─── Pure template tests: run WITHOUT any API keys ───────────────────────────

const DASH_RE = /[–—]/; // en dash, em dash: forbidden in SK/CZ copy
const RAILWAY_FALLBACK = "https://app.bod.legal";

const ORIGINAL_APP_BASE_URL = process.env.APP_BASE_URL;
afterEach(() => {
  if (ORIGINAL_APP_BASE_URL === undefined) delete process.env.APP_BASE_URL;
  else process.env.APP_BASE_URL = ORIGINAL_APP_BASE_URL;
});

describe("getAppBaseUrl", () => {
  it("reads APP_BASE_URL from the environment", () => {
    process.env.APP_BASE_URL = "https://staging.example.com";
    expect(getAppBaseUrl()).toBe("https://staging.example.com");
  });

  it("strips trailing slashes", () => {
    process.env.APP_BASE_URL = "https://staging.example.com/";
    expect(getAppBaseUrl()).toBe("https://staging.example.com");
  });

  it("falls back to the Railway production URL when unset", () => {
    delete process.env.APP_BASE_URL;
    expect(getAppBaseUrl()).toBe(RAILWAY_FALLBACK);
  });
});

const SAMPLE_FINDINGS = [
  { title: "Zmluvná pokuta", riskLevel: "high", finding: "Pokuta 50000 eur je neprimeraná." },
  { title: "Doba mlčanlivosti", riskLevel: "medium", finding: "Mlčanlivosť bez časového obmedzenia." },
  { title: "Definícia dôverných informácií", riskLevel: "low", finding: "Chýbajú obvyklé výnimky." },
];
const SAMPLE_RISK_SUMMARY = { high: 1, medium: 1, low: 1 };

function allTemplates(): { name: string; subject: string; html: string }[] {
  const base = { contractName: "zmluva.pdf", reportUrl: "https://app.example.com/report/9", recipientName: "Jana" };
  return [
    { name: "emailReportReady", ...emailReportReady({ ...base, topFindings: SAMPLE_FINDINGS, riskSummary: SAMPLE_RISK_SUMMARY }) },
    { name: "emailAnalysisAwaitingReview", ...emailAnalysisAwaitingReview({ ...base, topFindings: SAMPLE_FINDINGS, riskSummary: SAMPLE_RISK_SUMMARY }) },
    { name: "emailNewContractForReview", ...emailNewContractForReview({ contractName: "zmluva.pdf", reviewUrl: "https://app.example.com/admin/review/9", uploaderName: "Jana" }) },
    { name: "emailReviewCompleted", ...emailReviewCompleted({ ...base, lawyerName: "JUDr. Vzor" }) },
    { name: "emailFreeScanFollowUp", ...emailFreeScanFollowUp({ id: 9, fileName: "zmluva.pdf" }, SAMPLE_FINDINGS) },
  ];
}

describe("house rules for every template", () => {
  it.each(allTemplates().map(t => [t.name, t] as const))("%s carries the operator footer and the 30-day deletion note", (_name, t) => {
    expect(t.html).toContain("KILIAN LEGAL s.r.o.");
    expect(t.html).toContain("do 30 dní");
  });

  it.each(allTemplates().map(t => [t.name, t] as const))("%s contains no em or en dashes", (_name, t) => {
    expect(t.subject).not.toMatch(DASH_RE);
    expect(t.html).not.toMatch(DASH_RE);
  });

  it("escapes HTML in interpolated values", () => {
    const { html } = emailReportReady({
      contractName: "<script>alert(1)</script>.pdf",
      reportUrl: "https://app.example.com/report/9",
      topFindings: [{ title: "<b>x</b>", riskLevel: "high", finding: "<i>y</i>" }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<b>x</b>");
  });

  it("escapeHtml handles all special characters", () => {
    expect(escapeHtml(`<a href="x" & 'y'>`)).toBe("&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;");
  });
});

describe("emailReportReady (basic plan deliverable)", () => {
  const rendered = emailReportReady({
    contractName: "zmluva.pdf",
    reportUrl: "https://app.example.com/report/9",
    recipientName: "Jana",
    topFindings: SAMPLE_FINDINGS,
    riskSummary: SAMPLE_RISK_SUMMARY,
  });

  it("never claims blanket lawyer verification", () => {
    expect(rendered.html).not.toContain("Každý report overuje advokát");
    expect(rendered.html).toContain("Pri Štandardnej a Prémiovej kontrole nálezy overuje a podpisuje advokát.");
  });

  it("carries the fixed-price ROI line without fabricated comparisons", () => {
    expect(rendered.html).toContain("Platíte pevnú cenu vopred. Žiadna hodinová sadzba, žiadne prekvapenie na faktúre.");
    expect(rendered.html).not.toMatch(/ušetríte|najlepš/i);
  });

  it("renders findings and risk summary", () => {
    expect(rendered.html).toContain("Zmluvná pokuta");
    expect(rendered.html).toContain("Vysoké riziko");
    expect(rendered.html).toContain("1 vysoké");
  });
});

describe("emailAnalysisAwaitingReview (in_review, honest state)", () => {
  const rendered = emailAnalysisAwaitingReview({
    contractName: "zmluva.pdf",
    reportUrl: "https://app.example.com/report/9",
    topFindings: SAMPLE_FINDINGS,
  });

  it("has the honest subject and preliminary-findings button", () => {
    expect(rendered.subject).toContain("AI analýza je hotová, advokát ju overuje");
    expect(rendered.html).toContain("Zobraziť predbežné nálezy");
  });

  it("states plainly that the lawyer has not signed yet", () => {
    expect(rendered.html).toContain("Advokát report zatiaľ nepodpísal");
    expect(rendered.html).toContain("môžu sa ešte doplniť alebo zmeniť");
  });

  it("no longer sells the unsigned state as the complete report", () => {
    expect(rendered.html).not.toContain("kompletný report");
    expect(rendered.subject).not.toContain("kompletný report");
  });
});

describe("emailReviewCompleted (signed report)", () => {
  const rendered = emailReviewCompleted({
    contractName: "zmluva.pdf",
    reportUrl: "https://app.example.com/report/9",
    recipientName: "Jana",
    lawyerName: "JUDr. Vzor",
  });

  it("announces verification and signature only here", () => {
    expect(rendered.subject).toContain("Advokát overil a podpísal váš report");
    expect(rendered.html).toContain("overil a podpísal váš report");
    expect(rendered.html).toContain("Zobraziť podpísaný report");
    expect(rendered.html).toContain("JUDr. Vzor");
  });
});

describe("emailFreeScanFollowUp (anonymous funnel)", () => {
  it("lists exactly the top findings with severity words, title only", () => {
    const { subject, html } = emailFreeScanFollowUp({ id: 5, fileName: "najomna.pdf" }, SAMPLE_FINDINGS);
    expect(subject).toBe("Vaša zmluva: 3 riziká, ktoré našla AI");
    expect(html).toContain("Zmluvná pokuta");
    expect(html).toContain("Doba mlčanlivosti");
    expect(html).toContain("Definícia dôverných informácií");
    expect(html).toContain("kritické");
    expect(html).toContain("dôležité");
    expect(html).toContain("drobné");
    // Title + severity only: the finding detail text must not leak into the teaser
    expect(html).not.toContain("Pokuta 50000 eur je neprimeraná.");
  });

  it("links to the contract page under the env base URL", () => {
    process.env.APP_BASE_URL = "https://staging.example.com";
    const { html } = emailFreeScanFollowUp({ id: 5, fileName: "najomna.pdf" }, SAMPLE_FINDINGS);
    expect(html).toContain("https://staging.example.com/contract/5");
  });

  it("upsells the paid tier without claiming the free scan is verified", () => {
    const { html } = emailFreeScanFollowUp({ id: 5, fileName: "najomna.pdf" }, SAMPLE_FINDINGS);
    expect(html).toContain("Plný report so všetkými nálezmi a overením advokáta získate za pevnú cenu.");
    expect(html).not.toContain("overený advokátom");
    expect(html).not.toContain("podpísal");
  });

  it("renders at most 3 findings", () => {
    const many = [...SAMPLE_FINDINGS, { title: "Štvrtý nález", riskLevel: "low" }];
    const { html } = emailFreeScanFollowUp({ id: 5, fileName: "najomna.pdf" }, many);
    expect(html).not.toContain("Štvrtý nález");
  });
});

// ─── Live SendGrid checks (optional, skipped without keys) ───────────────────

describe("SendGrid Email Integration", () => {
  it("should have SendGrid API key configured", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn("Skipping: no API key");
      return;
    }
    expect(apiKey.startsWith("SG.")).toBe(true);
  });

  it("should have SendGrid from email configured", () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) {
      console.warn("Skipping: no from email");
      return;
    }
    expect(fromEmail).toContain("@");
  });

  it("should validate SendGrid API key with a dry-run request", async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn("Skipping: no API key");
      return;
    }

    // Use the SendGrid API to check key validity (get sender identities)
    const res = await fetch("https://api.sendgrid.com/v3/marketing/senders", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // 200 = valid key, 401/403 = invalid key
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
