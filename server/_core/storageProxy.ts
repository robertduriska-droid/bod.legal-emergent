import type { Express } from "express";
import { r2PresignGet } from "./r2";

// Serves stored files via /manus-storage/{key}. The bucket is private, so we
// mint a short-lived presigned GET URL on R2 and 307-redirect the browser to
// it. (Route path kept identical to the original template so existing DB rows
// and client links keep working.)
export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const url = await r2PresignGet(key, 3600);
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
