// Object storage helpers — self-hosted on Cloudflare R2 (S3-compatible).
//
// Public API is unchanged from the original Manus template (storagePut /
// storageGet / storageGetSignedUrl) so nothing downstream had to change. The
// only difference is the backend: instead of asking a Manus Forge server for a
// presigned URL, we talk to R2 directly via the AWS S3 SDK (see _core/r2.ts).
//
// Download URLs are returned as /manus-storage/{key}; that route (storageProxy)
// 307-redirects to a short-lived presigned GET so the bucket stays private.

import { randomUUID } from "crypto";
import { r2PutObject, r2PresignGet } from "./_core/r2";

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

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  await r2PutObject(key, toBuffer(data), contentType);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return r2PresignGet(key, 3600);
}
