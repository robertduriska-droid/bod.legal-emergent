# Deploying bod.legal (self-hosted)

This app was built on Emergent/Manus. This `selfhost` branch cuts the Manus
coupling so it runs on ordinary infrastructure:

- **Host:** Railway (one Node service: Express serves both the API and the SPA)
- **Database:** MySQL (Railway plugin)
- **File storage:** Cloudflare R2 (S3-compatible) — replaces the Manus storage proxy
- **AI:** OpenRouter (frontier Claude / GPT-5) via the OpenAI-compatible gateway
- **Login:** Sign in with Google + email/password (Manus OAuth no longer needed)
- **Domain/DNS:** Cloudflare → `bod.legal`

Legend: 🔑 = **you must do this** (needs your credentials/accounts — Claude cannot
enter secrets or create accounts). 🤝 = Claude can prepare/guide.

---

## What already changed in the code (done, verified)
- `server/_core/r2.ts` (new) + rewritten `server/storage.ts` & `storageProxy.ts`
  → uploads/downloads go straight to R2 (bucket stays private via presigned GET).
- `server/analysis.ts` → analysis model is env-driven (`ANALYSIS_MODEL`); PDFs are
  now text-extracted server-side (pdf.js) instead of the Manus-only `file_url`.
- `shared/const.ts` → model catalog = frontier OpenRouter slugs; defaults to Claude.
- `server/assistant.ts` + `analysis.ts` → payloads work for both Claude (`max_tokens`)
  and GPT reasoning models (`max_completion_tokens` + `reasoning`).
- `server/_core/notification.ts` → owner push degrades gracefully when unconfigured.
- Verified: `pnpm check` (types) ✓, `pnpm build` ✓, server boots & serves ✓.

**Still needs a live test pass (against your real keys):** R2 upload/download,
OpenRouter model calls (payload shape / JSON schema / PDF text quality), Stripe
webhook, SendGrid send, Google login redirect. These can't be tested without the
real services — we'll run one pass together after the accounts exist.

---

## Step 1 — Accounts & keys (🔑 you)
Create/collect these. Put each value into Railway Variables (Step 3).

1. **Railway** account + new project.
2. **Cloudflare R2**: create bucket `bod-legal`; create an R2 API token
   (Object Read & Write). Note Account ID, Access Key ID, Secret.
   Endpoint = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
3. **OpenRouter**: create an API key, add credit. (Base URL is already set.)
4. **Stripe**: get the Secret key. (Webhook secret comes in Step 6.)
5. **SendGrid**: API key + verify the sender `robert.duriska@kilian.legal`.
6. **Google Cloud**: OAuth 2.0 Web client → Client ID + Secret (redirect URI in Step 7).
7. **JWT_SECRET**: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

## Step 2 — Get the code onto Railway (🤝 + 🔑)
Option A (recommended): push this branch and connect the repo in Railway.
```
git push -u origin selfhost
```
Then in Railway: New → Deploy from GitHub repo → pick `bod.legal-emergent`,
branch `selfhost`. Add the **MySQL** plugin to the project.

Build/start are already correct in `package.json`:
- Build: `pnpm build`   Start: `pnpm start`  (Railway auto-detects pnpm)

## Step 3 — Environment variables (🔑 you paste, 🤝 I map)
Copy every key from `.env.example` into Railway → service → Variables.
`DATABASE_URL` is provided by the Railway MySQL plugin (reference it).
Do **not** set `VITE_APP_ID` / `OAUTH_SERVER_URL` (Manus-only).

## Step 4 — Create the database tables (🤝)
Once `DATABASE_URL` is set, run migrations once:
```
pnpm db:push
```
(from Railway shell, or locally with the same `DATABASE_URL`). Several small
tables also self-create on first use.

## Step 5 — First deploy (🤝)
Trigger a deploy. Confirm logs show `Server running on ...` and the Railway URL
loads the homepage. (The `OAUTH_SERVER_URL is not configured` log line is
expected and harmless.)

## Step 6 — Stripe webhook (🔑 you)
Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://bod.legal/api/stripe/webhook`
- Events: `checkout.session.completed` (plus any others the app listens for)
Copy the signing secret → set `STRIPE_WEBHOOK_SECRET` in Railway → redeploy.

## Step 7 — Google login redirect (🔑 you)
In the Google OAuth client, add Authorized redirect URI:
- `https://bod.legal/api/auth/google/callback`
(add the Railway URL variant too while testing before DNS cutover).

## Step 8 — Point bod.legal at Railway (🔑 you, 🤝 I give exact records)
1. Railway → service → Settings → Networking → **Custom Domain** → add `bod.legal`
   (and `www.bod.legal`). Railway shows a target host.
2. Cloudflare → DNS for bod.legal:
   - `CNAME  @    <target>.up.railway.app`   (or the exact target Railway shows)
   - `CNAME  www  <target>.up.railway.app`
   - Proxy status: start **DNS only (grey cloud)** until TLS is verified, then you
     may switch to proxied. SSL/TLS mode: **Full (strict)**.
3. Wait for Railway to issue the certificate, then load `https://bod.legal`.

## Step 9 — Make yourself admin (🔑 you)
Sign in once with Google. Find your `openId` (`google:...`) in the `users` table
or logs. Set `OWNER_OPEN_ID=google:<sub>` in Railway → redeploy → sign in again.
You now have the lawyer-review dashboard.

## Step 10 — Live smoke test (🤝 together)
Upload a sample PDF and a DOCX, run the free scan, confirm: file lands in R2,
analysis returns clauses (OpenRouter), report + PDF/DOCX export work, a test
Stripe checkout completes, and a SendGrid email arrives.

---

### Notes / gotchas
- **Stripe key is required at boot** — the server will not start without
  `STRIPE_SECRET_KEY`.
- **Model slugs** (`anthropic/claude-opus-4.8`, etc.) may need adjusting to the
  exact IDs OpenRouter lists — change them in `shared/const.ts` / `ANALYSIS_MODEL`.
- **EU data residency:** choose an EU region for the R2 bucket and MySQL, and
  prefer EU-hosted models on OpenRouter, for GDPR/attorney confidentiality.
- **Manus extras not ported** (maps, image-gen, voice, push) are off the core
  flow and simply no-op when unconfigured.
