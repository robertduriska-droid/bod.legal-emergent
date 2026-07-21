import type { Express, Request, Response, NextFunction } from "express";

// Maintenance switch for the whole service: both the root marketing site
// (bod.legal) and the app (app.bod.legal) answer every public request with a
// holding page. Nothing is deleted, no data is touched, the domain and mailbox
// keep working.
//
// To bring the site back WITHOUT a code change: set MAINTENANCE_MODE=0 in
// Railway Variables and redeploy. Or flip MAINTENANCE_DEFAULT to false here.
const MAINTENANCE_DEFAULT = true;

export function isMaintenance(): boolean {
  const v = (process.env.MAINTENANCE_MODE || "").trim().toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return MAINTENANCE_DEFAULT;
}

// Paths that must keep working even while the site is down:
//  - the Stripe webhook, so an in flight payment is still recorded and Stripe
//    does not retry it into oblivion,
//  - the read only debug endpoints, so the service can be inspected.
function isExempt(path: string): boolean {
  return path.startsWith("/api/stripe/webhook") || path.startsWith("/api/debug/");
}

const PAGE = `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>bod.legal | Dočasne nedostupné</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #FAF7F1; color: #1c2420; padding: 24px;
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .box { max-width: 520px; text-align: center; }
  .logo { font-family: Georgia, "Times New Roman", serif; font-size: 30px; letter-spacing: .01em; margin-bottom: 28px; }
  .logo span { color: #15803d; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 25px; font-weight: 400; margin: 0 0 14px; }
  p { font-size: 15px; line-height: 1.65; color: #55605a; margin: 0 0 12px; }
  a { color: #15803d; }
  .foot { margin-top: 28px; font-size: 13px; color: #8a938e; }
</style>
</head>
<body>
  <div class="box">
    <div class="logo">bod<span>.</span>legal</div>
    <h1>Služba je dočasne nedostupná</h1>
    <p>Pracujeme na kontrole a vylepšení služby. Nové zmluvy teraz neprijímame.</p>
    <p>Ak potrebujete čokoľvek vybaviť, napíšte nám na <a href="mailto:info@bod.legal">info@bod.legal</a> a ozveme sa.</p>
    <div class="foot">Prevádzkuje advokátska kancelária KILIAN LEGAL s. r. o.</div>
  </div>
</body>
</html>`;

export function registerMaintenance(app: Express) {
  if (!isMaintenance()) return;
  console.log("[Maintenance] MAINTENANCE MODE IS ON: serving the holding page for all public requests.");
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isExempt(req.path)) return next();
    // 503 tells search engines this is temporary, so rankings are kept.
    res.status(503);
    res.set("Retry-After", "3600");
    res.set("Cache-Control", "no-store");
    if (req.path.startsWith("/api/")) {
      res.type("application/json").send(
        JSON.stringify({ error: "maintenance", message: "Služba je dočasne nedostupná." })
      );
      return;
    }
    res.type("html").send(PAGE);
  });
}
