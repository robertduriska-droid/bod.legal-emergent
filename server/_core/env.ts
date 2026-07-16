export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL ?? "",
  // ── Self-host: direct Cloudflare R2 (S3-compatible) object storage ──────────
  // Replaces the Manus Forge presign proxy. Set all four to enable uploads.
  r2Endpoint: process.env.R2_ENDPOINT ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2Bucket: process.env.R2_BUCKET ?? "",
  // ── Self-host: LLM model overrides (base URL/key reuse the FORGE vars, which
  // you point at OpenRouter). Leave blank to use the defaults in shared/const. ─
  analysisModel: process.env.ANALYSIS_MODEL ?? "",
};
