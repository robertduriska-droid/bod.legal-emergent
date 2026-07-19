// Object storage helpers — Cloudflare R2 when configured, local-disk fallback
// otherwise.
//
// Public API is unchanged from the original Manus template (storagePut /
// storageGet / storageGetSignedUrl) so nothing downstream had to change.
// Backend selection is automatic:
//   - R2_* env vars present  -> Cloudflare R2 via the AWS S3 SDK (_core/r2.ts)
//   - otherwise              -> local disk (_core/diskStorage.ts), so a fresh
//     deployment works end to end before any storage keys exist.
//
// Download URLs are returned as /file-storage/{key}; that route (storageProxy)
// 307-redirects to a short-lived presigned GET on R2, or streams from disk in
// fallback mode.

import { randomUUID } from "crypto";
import { r2PutObject, r2PresignGet, r2DeleteObject, isR2Configured } from "./_core/r2";
import { diskPutObject, diskDeleteObject } from "./_core/diskStorage";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function toBuffer(data: Buffer | Uint8Array | string): Buffer {
  if (typeof data === "string") return Buffer.from(data);
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(data);
}

/** Base URL this server is reachable at, for self-referencing download URLs
 *  in disk-fallback mode (analysis downloads the file over HTTP). */
function selfBaseUrl(): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return `http://localhost:${process.env.PORT || 3000}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = toBuffer(data);
  if (isR2Configured()) {
    await r2PutObject(key, body, contentType);
  } else {
    console.warn(
      `[Storage] R2 not configured, storing "${key}" on local disk (ephemeral). Set R2_* env vars for persistence.`,
    );
    await diskPutObject(key, body, contentType);
  }
  return { key, url: `/file-storage/${key}` };
}

/**
 * Permanently delete a stored object, whichever backend holds it.
 *
 * Retention calls this to honour the 30-day deletion promised to clients. Both
 * backends treat an already-missing key as success, so a re-run after a partial
 * pass is safe.
 */
export async function storageDelete(relKey: string): Promise<void> {
  const key = normalizeKey(relKey);
  if (isR2Configured()) {
    await r2DeleteObject(key);
  } else {
    await diskDeleteObject(key);
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/file-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  if (isR2Configured()) {
    return r2PresignGet(key, 3600);
  }
  // Disk fallback: the proxy route streams the file; absolute URL so server-side
  // consumers (analysis text extraction) can fetch it too.
  return `${selfBaseUrl()}/file-storage/${key}`;
}
