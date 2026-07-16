// Marketing site on the root domain, served by the same process as the app.
//
// bod.legal (root) is the marketing site in /marketing; app.bod.legal is the
// product. Instead of a second hosting product with its own account, deploy
// pipeline and failure modes, the one server we already run routes by Host
// header. The root domain just needs a DNS record pointing at this service.
//
// The middleware touches ONLY requests whose host is a marketing host, so the
// app, the API, the Stripe webhook and OAuth callbacks (all on app.bod.legal)
// never pass through it.

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

const MARKETING_HOSTS = new Set(["bod.legal", "www.bod.legal"]);

function requestHost(req: Request): string {
  const raw = ((req.headers["x-forwarded-host"] as string) || req.headers.host || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return raw.replace(/:\d+$/, "");
}

export function registerMarketingSite(app: Express) {
  const dir = path.resolve(process.cwd(), "marketing");
  if (!fs.existsSync(path.join(dir, "index.html"))) {
    console.warn(`[Marketing] ${dir} missing, root-domain site disabled.`);
    return;
  }

  // HTML is revalidated on every visit so a deploy shows up immediately;
  // fonts and styles carry a hash-free name, so keep their cache short too.
  const serve = express.static(dir, {
    maxAge: "10m",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".woff2")) res.setHeader("Cache-Control", "public, max-age=86400");
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const host = requestHost(req);
    if (!MARKETING_HOSTS.has(host)) {
      next();
      return;
    }

    // One canonical origin: www redirects to the apex.
    if (host === "www.bod.legal") {
      res.redirect(301, `https://bod.legal${req.originalUrl}`);
      return;
    }

    serve(req, res, () => {
      // Unknown path on the marketing site: send the visitor to the landing
      // page rather than a bare 404. There is nothing else to find here.
      res.redirect(302, "/");
    });
  });

  console.log(`[Marketing] Root-domain site enabled from ${dir}`);
}
