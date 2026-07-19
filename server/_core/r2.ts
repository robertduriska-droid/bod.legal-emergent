// Direct Cloudflare R2 (S3-compatible) object storage.
//
// This replaces the Manus "Forge" presign proxy. R2 speaks the S3 API, so we
// use the AWS SDK already bundled in this project (@aws-sdk/client-s3 +
// s3-request-presigner). Configure via the R2_* env vars (see .env.example).
//
// Keys are stored flat; downloads are served through /file-storage/{key}
// (see storageProxy.ts) which 307-redirects to a short-lived presigned GET URL,
// so the bucket itself stays private.

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./env";

let _s3: S3Client | null = null;

function getClient(): S3Client {
  if (!ENV.r2Endpoint || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey || !ENV.r2Bucket) {
    throw new Error(
      "R2 storage not configured: set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET",
    );
  }
  if (!_s3) {
    _s3 = new S3Client({
      region: "auto", // R2 ignores region but the SDK requires a value
      endpoint: ENV.r2Endpoint,
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretAccessKey,
      },
    });
  }
  return _s3;
}

export function isR2Configured(): boolean {
  return Boolean(
    ENV.r2Endpoint && ENV.r2AccessKeyId && ENV.r2SecretAccessKey && ENV.r2Bucket,
  );
}

export async function r2PutObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Permanently remove an object. Used by retention (see server/retention.ts) to
 * honour the 30-day deletion we promise clients in the FAQ, on the About page
 * and in the email they receive.
 *
 * S3 delete is idempotent: removing a key that is already gone succeeds, so a
 * retry after a partial run is safe.
 */
export async function r2DeleteObject(key: string): Promise<void> {
  const s3 = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: ENV.r2Bucket, Key: key }));
}

/** Short-lived presigned GET URL. Used both server-side (to read a file for
 *  analysis) and by the /file-storage proxy (307 redirect to the browser). */
export async function r2PresignGet(key: string, expiresInSeconds = 3600): Promise<string> {
  const s3 = getClient();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: ENV.r2Bucket, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}
