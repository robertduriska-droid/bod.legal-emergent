// Local-disk storage fallback.
//
// Used automatically when Cloudflare R2 is not configured (no R2_* env vars),
// so the upload -> free scan -> report funnel works out of the box on a fresh
// deployment. Files live under DATA_DIR (default ./data/uploads) with a JSON
// sidecar holding the content type.
//
// CAVEAT: on PaaS hosts (Railway) the filesystem is ephemeral, files are lost
// on redeploy. That is acceptable for the scan-and-report flow (analysis runs
// minutes after upload) but NOT for long-term document retention. Configure R2
// for production persistence; when R2_* vars are present this module is not
// used at all.

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = process.env.UPLOADS_DIR || path.resolve(process.cwd(), "data", "uploads");

function safePath(key: string): string {
  // Normalize and confine the key inside DATA_DIR (no traversal).
  const cleaned = key.replace(/\\/g, "/").replace(/^\/+/, "");
  const full = path.resolve(DATA_DIR, cleaned);
  if (!full.startsWith(path.resolve(DATA_DIR))) {
    throw new Error("Invalid storage key");
  }
  return full;
}

export async function diskPutObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const file = safePath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
  await fs.writeFile(file + ".meta.json", JSON.stringify({ contentType }), "utf8");
}

export async function diskGetObject(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  const file = safePath(key);
  try {
    const body = await fs.readFile(file);
    let contentType = "application/octet-stream";
    try {
      const meta = JSON.parse(await fs.readFile(file + ".meta.json", "utf8"));
      if (typeof meta.contentType === "string") contentType = meta.contentType;
    } catch {
      // sidecar missing, keep the default
    }
    return { body, contentType };
  } catch {
    return null;
  }
}
