import type { Express } from "express";
import { r2PresignGet, isR2Configured } from "./r2";
import { diskGetObject } from "./diskStorage";

// Serves stored files via /manus-storage/{key}. With R2 configured the bucket
// stays private and we 307-redirect to a short-lived presigned GET URL; in
// disk-fallback mode (no R2_* env vars) the file streams straight from disk.
// (Route path kept identical to the original template so existing DB rows and
// client links keep working.)
export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      if (isR2Configured()) {
        const url = await r2PresignGet(key, 3600);
        res.set("Cache-Control", "no-store");
        res.redirect(307, url);
        return;
      }

      const obj = await diskGetObject(key);
      if (!obj) {
        res.status(404).send("File not found");
        return;
      }
      res.set("Content-Type", obj.contentType);
      res.set("Cache-Control", "no-store");
      res.send(obj.body);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
