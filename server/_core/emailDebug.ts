// Email diagnostics endpoint.
//
// When a send fails in production the exact SendGrid response lands only in
// the Railway logs, which makes every debugging round-trip a screenshot
// exchange. This endpoint performs one real test send to the owner inbox and
// returns SendGrid's raw verdict as JSON, so "mail does not arrive" can be
// diagnosed with a single GET.
//
// Deliberately unauthenticated: it accepts no input, reveals only which
// addresses are configured (they are printed in every site footer anyway) and
// SendGrid's response to a fixed test message. The only abuse it enables is
// mailing the owner a test notice, which the throttle caps at one per five
// minutes per process.

import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import { getEmailSendLog } from "../email";

let lastSendAt = 0;
const THROTTLE_MS = 5 * 60 * 1000;

export function registerEmailDebug(app: Express) {
  app.get("/api/debug/email", async (_req: Request, res: Response) => {
    const to = process.env.OWNER_EMAIL || ENV.sendgridFromEmail || "";
    const diag: Record<string, unknown> = {
      sendgridKeySet: Boolean(ENV.sendgridApiKey),
      fromEmail: ENV.sendgridFromEmail || null,
      ownerEmail: process.env.OWNER_EMAIL || null,
      // Newest first; survives until the next deploy restarts the process.
      recentSends: getEmailSendLog(),
    };

    if (!ENV.sendgridApiKey) {
      diag.verdict = "SENDGRID_API_KEY chyba: appka posielanie preskakuje";
      res.json(diag);
      return;
    }
    if (!to) {
      diag.verdict = "niet komu poslat: OWNER_EMAIL aj SENDGRID_FROM_EMAIL su prazdne";
      res.json(diag);
      return;
    }

    const now = Date.now();
    if (now - lastSendAt < THROTTLE_MS) {
      diag.verdict = "test uz bezal pred chvilou, skus o par minut";
      res.json(diag);
      return;
    }
    lastSendAt = now;

    try {
      const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: ENV.sendgridFromEmail, name: "bod.legal" },
          subject: "Skuska e-mailov bod.legal",
          content: [
            {
              type: "text/plain",
              value:
                "Testovaci e-mail diagnostiky /api/debug/email. Ak ho citate, odosielanie cez SendGrid funguje.",
            },
          ],
        }),
      });
      diag.testSend = {
        to,
        status: r.status,
        // 202 = accepted; anything else carries SendGrid's error JSON.
        detail: r.status === 202 ? "prijate SendGridom" : (await r.text()).slice(0, 600),
      };
      diag.verdict =
        r.status === 202
          ? "SendGrid prijal, pozri dorucene aj spam"
          : "SendGrid ODMIETOL, dovod je v detail";
    } catch (err) {
      diag.testSend = { to, error: String(err).slice(0, 300) };
      diag.verdict = "siet zlyhala pri volani SendGridu";
    }
    res.json(diag);
  });
}
