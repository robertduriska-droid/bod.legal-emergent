# bod.legal — PRD / Working Notes

> **Current state (2026-07):** operator **KILIAN LEGAL s. r. o.**; Manus fully removed (now Railway + Cloudflare R2 + OpenRouter/Claude Opus). Live pricing: Bezplatný sken 0 · Štandardná 249 (do 20 strán) · Prémiová 490 (do 50 strán) · Express +127. Single source of truth = `shared/types.ts` (PRICING_PLANS) and `CLAUDE.md`. The notes below are dated working history — figures in older entries (e.g. 197/297/497, 149/249/399, page limits) record past states, not current pricing.

## Original request
- "https://github.com/Open-Legal-Products/mike integrate to my website bod.legal"
- Follow-up (current task): "Add the Sign in with Google integration to my app."

## App reality (important context)
bod.legal is an existing, mature AI contract-review platform built for the **Manus platform**:
- Stack: Vite + React 19 + tRPC + Express (single Node server) + Drizzle ORM on **MySQL**
- Auth: Manus OAuth (session = JWT in `app_session_id` cookie, users keyed by `openId`)
- LLM: Manus Forge gateway; Storage/notifications via Manus proxies
- i18n: SK / CZ / EN; Stripe + SendGrid integrated
- It does NOT run inside the Emergent pod as-is (Emergent expects FastAPI:8001 + React:3000,
  no MySQL here, `/api/*` ingress routing collides with the Node monolith's `/api/trpc`).

## Implemented (2026-07-15)
### Sign in with Google (standard OAuth 2.0, owner's own Google Cloud creds — portable)
- Backend: `server/_core/googleAuth.ts` — `registerGoogleAuthRoutes(app)`
  - `GET /api/auth/google/login` builds Google consent URL, sets CSRF nonce cookie, 302 redirect
  - `GET /api/auth/google/callback` verifies CSRF nonce, exchanges code, fetches userinfo,
    upserts user (`openId = google:<sub>`, loginMethod "google"), mints the existing session JWT,
    sets `app_session_id` cookie, redirects to `/`
  - Self-contained: no dependency on Manus OAuth server. Reuses `sdk.createSessionToken` + `db.upsertUser`.
- Registered in `server/_core/index.ts` (before Vite).
- Frontend: `startGoogleLogin()` in `client/src/const.ts` (derives URLs from window.location.origin).
- Header buttons (desktop + mobile) in `client/src/components/Header.tsx` with Google icon.
  test-ids: `google-signin-button`, `google-signin-button-mobile`, `signin-button`, `signin-button-mobile`.
- Dashboard login gate (`client/src/components/DashboardLayout.tsx`) also offers Google.
  test-ids: `dashboard-signin-button`, `dashboard-google-signin-button`.
- i18n label `header.signInGoogle` added to types.ts + sk/cz/en.
- `.env.example` documents required vars.

### Verification done
- `tsc --noEmit` → 0 errors.
- Local boot: `/api/auth/google/login` → 302 to accounts.google.com (correct params + CSRF cookie);
  forged-state callback → 403. Full live click-test not possible in Emergent pod (Manus stack).

### Mike integration → AI Legal Assistant ("chat with your contract") (2026-07-15)
Mike (OSS AI legal platform) rebuilt as a native feature in bod.legal's own stack.
- Backend:
  - `drizzle/schema.ts`: new `chat_messages` table (userId, nullable contractId, role, content, createdAt).
  - `server/db.ts`: `ensureChatTable()` (idempotent CREATE TABLE IF NOT EXISTS — no migration step needed),
    `getChatMessages`, `createChatMessage`, `clearChatMessages`.
  - `server/assistant.ts`: `runAssistant()` — grounds answers on the contract's clauses/findings/legal basis +
    report summary, multilingual (SK/CZ/EN), can draft clauses/emails; uses Manus Forge `gpt-5-mini`.
  - `server/routers.ts`: `assistant` tRPC router — `history`, `send`, `clear` (all protected + ownership-checked).
- Frontend:
  - `client/src/components/ContractAssistant.tsx` (wraps existing `AIChatBox`), SK/CZ/EN copy + suggested prompts.
    test-ids: `contract-assistant`, `assistant-clear-button`.
  - Mounted on the Report page for full reports only (`!isLimited`), so it's gated behind payment.
- Verified: `tsc` 0 errors; server boots; `assistant.history` returns UNAUTHORIZED (registered/protected),
  unknown path returns NOT_FOUND. Live LLM reply + DB write require MySQL + Manus Forge (deployed site only).
- Skipped: Mike's CourtListener US case-law (US-only; bod.legal is SK/CZ jurisdiction).

### Gemini + Anthropic chat models (2026-07-15)
Multi-provider model support for the AI assistant, routed through the existing Manus Forge
(OpenAI-compatible) gateway — no new API keys (user chose "route through Forge").
- `shared/const.ts`: `ASSISTANT_MODELS` (OpenAI gpt-5-mini [default] / gpt-5 / gpt-4o, Gemini 2.5 Flash / 3.1 Pro,
  Claude Sonnet 4.6 / Haiku 4.5), `DEFAULT_ASSISTANT_MODEL`, `ASSISTANT_MODEL_IDS`.
- `server/assistant.ts`: `buildChatPayload()` branches params by provider (gpt-5*/o* use
  max_completion_tokens + reasoning; Gemini/Claude use max_tokens). `runAssistant` takes a
  validated `model` and, if a non-default model errors on Forge, retries with gpt-5-mini so
  the user still gets an answer.
- `server/routers.ts`: `assistant.send` accepts optional `model` (whitelisted).
- `client/src/components/ContractAssistant.tsx`: provider/model dropdown (test-id
  `assistant-model-select`, items `assistant-model-<id>`); selected model sent with each message.
- Verified: `tsc` 0 errors; server boots; route accepts `model`. Whether Forge actually serves
  Gemini/Claude IDs is a Manus-side dependency — the default-model fallback covers unsupported IDs.

### File & media storage → contract attachments (2026-07-15)
Reusable file/media upload built on the app's existing Forge/S3 storage (`server/storage.ts`).
- `drizzle/schema.ts`: `attachments` table (contractId, userId, fileName, mimeType, fileKey, fileUrl, size).
- `server/db.ts`: `ensureAttachmentsTable()` (idempotent CREATE TABLE), `createAttachment`,
  `getAttachmentsByContract`, `getAttachmentById`, `deleteAttachment`.
- `shared/const.ts`: `ATTACHMENT_MAX_BYTES` (20MB), `ATTACHMENT_ALLOWED_MIME` (pdf, doc/docx, png/jpeg/webp/gif).
- `server/routers.ts`: `attachments` router — `list`, `upload` (base64 → storagePut → row), `remove`
  (all protected + ownership-checked; server validates mime + size).
- `client/src/components/ContractAttachments.tsx`: upload button (multi-file), list with download +
  delete, SK/CZ/EN copy. test-ids: `contract-attachments`, `attachment-upload-button`,
  `attachment-input`, `attachment-item-<id>`, `attachment-download-<id>`, `attachment-delete-<id>`.
- Mounted on the Report page for full (paid) reports.
- Verified: `tsc` 0 errors; server boots; `attachments.list`/`upload` → UNAUTHORIZED (registered/protected).
  Live upload/download needs MySQL + Forge storage (deployed site only).

### Assistant ⇄ attachments wiring + ContractDetail mount (2026-07-15)
- Attachment-aware assistant: `assistant.send` accepts optional `attachmentId`; `runAssistant`
  loads the chosen attachment and feeds it to the LLM — PDFs/images as multimodal
  `file_url`/`image_url` parts, DOCX via `extractDocxText` (exported from `analysis.ts`).
  callChatLLM/buildChatPayload now accept multimodal `content`.
- `ContractAssistant.tsx`: "Attach file" dropdown (from `attachments.list`) so a client can ask
  about a specific uploaded draft; resets after each send. test-ids: `assistant-attach-select`,
  `assistant-attach-none`, `assistant-attach-<id>`, `assistant-attach-row`.
- `ContractDetail.tsx`: mounts `ContractAssistant` + `ContractAttachments` for
  `in_review`/`completed` contracts (analysis available).
- Verified: `tsc` 0 errors; server boots (no circular import); `assistant.send` accepts `attachmentId`.

### Twilio SMS + WhatsApp notifications (2026-07-15)
Extra notification channel alongside existing in-app + SendGrid email, using the `twilio` Node SDK.
- `server/twilio.ts`: `sendSms`, `sendWhatsApp`, `notifyClient` (both channels), `notifyAdmins`
  (env-configured recipients). Lazy client; best-effort (never throws); no-ops without creds.
- `drizzle/schema.ts` + `server/db.ts`: `notify_prefs` table (idempotent auto-create) +
  `setNotifyPhone`/`getNotifyPhone` — stores the client's optional notify phone per contract
  (avoids ALTERing the existing contracts table).
- Hooks: contract upload → `notifyAdmins`; analysis completion (`analysis.ts`) → client + admins;
  lawyer sign-off (`routers.ts signReport`) → client. Messages localized SK/CZ/EN.
- `contracts.upload` accepts optional `phone`; `Upload.tsx` adds an optional phone input
  (test-id `upload-phone-input`).
- Env (Manus): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_FROM,
  TWILIO_ADMIN_PHONE, TWILIO_ADMIN_WHATSAPP (documented in `.env.example`).
- Verified: `tsc` 0 errors; server boots (twilio lazy import OK); `contracts.upload` accepts `phone`.
  Live SMS/WhatsApp send requires real Twilio creds + deployed site.

### Email & password login (2026-07-15)
Classic auth layered on the existing session model (called integration_expert first per policy).
- `bcryptjs` for hashing; new `email_credentials` table (idempotent auto-create, unique email,
  failedAttempts + lockedUntil) in `drizzle/schema.ts` + `server/db.ts` helpers.
- `server/emailAuth.ts`: `registerEmailUser` / `loginEmailUser` — lowercased email, uniqueness,
  generic errors (no enumeration + dummy-hash timing), brute-force lockout (5 fails → 15 min).
  openId = `email:<email>`; reuses `sdk.createSessionToken` + `app_session_id` cookie.
- `server/routers.ts` auth router: `register`, `login` (TRPCError codes: CONFLICT / TOO_MANY_REQUESTS
  / UNAUTHORIZED); existing `logout`, `me` unchanged.
- `client/src/components/EmailAuthForm.tsx`: login/register toggle, mounted on the DashboardLayout
  login gate alongside Manus + Google. test-ids: `email-auth-form`, `email-auth-email`,
  `email-auth-password`, `email-auth-name`, `email-auth-submit`, `email-auth-toggle`.
- Admin: set `OWNER_OPEN_ID = email:<email>` to grant admin. No auto-seed (no invented creds).
- `test_credentials.md` updated. Verified: `tsc` 0 errors; login → generic UNAUTHORIZED;
  register short password → zod validation error.

### Hungarian (HU) locale — market expansion (2026-07-15)
Full 4th language added (SK/CZ/EN/**HU**) as part of merging the parallel repo's features.
- `client/src/i18n/hu.ts`: complete Hungarian translation of the whole `Translations` interface;
  HUF display pricing (79 000 / 119 000 / 199 000 Ft, express +51 000 Ft — same convention as CZ's
  CZK display while Stripe still charges EUR); legal refs point to njt.hu (Nemzeti Jogszabálytár) + EUR-Lex.
- `i18n/types.ts` (`Locale` += "hu", `langSwitch.hu`), `i18n/index.ts` (register hu +
  `/hu` in `detectLocaleFromPath`/`stripLocalePrefix`), `LanguageSwitcher.tsx` (+HU), sk/cz/en
  `langSwitch.hu`, `App.tsx` (`/hu/*` routes), `Footer.tsx` (HU vop/gdpr paths + njt.hu/EUR-Lex/EKR sources).
- Per-page local i18n maps: proper HU added to public funnel (DemoAnimation, About, SampleReport,
  FreeSken, NotFound, NotificationBell). Post-purchase/admin screens (Report, ContractDetail,
  AdminReview) fall back to EN for HU (`locale === "hu" ? "en" : locale`) — flagged for full HU later.
- Hero `ctaTrial` key added to all 4 locales.

### Mike OS deeper analysis (2026-07-15)
Richer second-pass analysis on top of the existing clause-by-clause report.
- `analysis.ts`: appended `DEEP_ANALYSIS_INSTRUCTION` to every language prompt (deal-breaker pass,
  missing-provisions check, verification pass, 1-5 risk score); extended the strict json_schema with
  `riskScore`, `dealBreakers[]`, `missingProvisions[]`, `verificationNotes`; added a `hu` system prompt
  (Hungarian/EU law, njt.hu). Persists best-effort via `createDeepAnalysis`.
- `drizzle/schema.ts` + `server/db.ts`: new `deep_analysis` table (idempotent CREATE TABLE) +
  `ensureDeepAnalysisTable`/`createDeepAnalysis`/`getDeepAnalysisByContract`.
- `contracts.getById` returns normalized `deepAnalysis` ({riskScore, dealBreakers, missingProvisions,
  verificationNotes, redacted}); basic plan gets riskScore-only teaser (redacted), details behind paywall.
- `client/src/components/DeepAnalysis.tsx` (SK/CZ/EN/HU; risk meter, deal-breakers, missing provisions,
  verification). Mounted on Report for full (`!isLimited`) reports. test-ids: `deep-analysis`,
  `deep-analysis-risk-score`, `deal-breaker-<i>`, `missing-provision-<i>`.

### Free Trial — 15-day trial + 1 free analysis, Stripe SetupIntent (2026-07-15)
- `drizzle/schema.ts` + `server/db.ts`: new `trials` table (idempotent, unique userId) +
  `ensureTrialsTable`/`getTrialByUserId`/`upsertTrialPending`/`activateTrial`/`markTrialAnalysisUsed`.
- `server/routers.ts` `trial` router: `status` (active/daysLeft/freeAnalysisAvailable), `start`
  (creates/reuses Stripe customer + Checkout Session in **`mode:"setup"`** → saves card with no charge,
  metadata `{user_id, purpose:"trial"}`).
- `server/stripe-webhook.ts`: `checkout.session.completed` branches on setup/trial → retrieves the
  SetupIntent's payment method, stores customer + pm, `activateTrial` (15 days), notifies user.
- `contracts.upload`: if an active trial has an unused free analysis (non-basic plan) → runs the full
  analysis immediately, marks it used, returns `trialApplied:true` (skips payment).
- `client/src/pages/Trial.tsx` (`/trial`, `/cz|en|hu/trial`; SK/CZ/EN/HU): start CTA → Stripe redirect,
  active-trial state (days left, free-analysis status), `?setup=success|cancelled` handling.
  test-ids: `trial-page`, `trial-start-card`, `trial-start-button`, `trial-active-card`, `trial-upload-button`.
- `Home.tsx` hero third CTA → `/trial` (`hero-trial-cta`). `Upload.tsx`: trial-aware banner + button
  ("Use free trial analysis"), `trialApplied` success routing, and **HUF price display** for HU.

### Pricing audit fix (2026-07-15)
- `shared/types.ts` `PRICING_PLANS` corrected to the actually-charged/displayed prices:
  basic 197, standard 297, premium 497 (was stale 149/249/399); `EXPRESS_ADDON` 99 → 127.
- `server/contracts.test.ts` price assertion updated to 197/297/497.
- HU checkout button now shows Ft (consistent with HU marketing display).

### Verification (whole session)
- `tsc --noEmit` → **0 errors**; `vitest run` → **63/63 pass**; `vite build` → **success**.
- App is Manus-stack (MySQL + Forge) so it cannot run E2E in the Emergent pod; live behaviour
  (Stripe setup checkout, webhook trial activation, LLM deep analysis) verifies only on the deployed site.


## Required config (set in the app's real env — Manus dashboard / .env)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google Cloud Console, Web application OAuth client)
- Authorized redirect URI to register (per domain): `https://<domain>/api/auth/google/callback`
  - Custom domain: `https://bod.legal/api/auth/google/callback` (DNS on Cloudflare)
- JWT_SECRET + VITE_APP_ID must be set (session signing) — already provided on Manus.

## Backlog / Next
- P1: full HU translation for post-purchase/admin screens (Report, ContractDetail, AdminReview)
  — currently fall back to EN for the HU locale.
- P1: password-reset flow for the email/password login.
- P2: standalone general legal Q&A + drafting page (assistant backend already supports contractId=null).
- P1: optional streaming responses (currently non-streaming mutation).
- Trial conversion: auto-charge / prompt to subscribe when the 15-day trial ends (endsAt is stored).
- Mike's CourtListener/US case-law feature intentionally skipped (US-only; bod.legal is SK/CZ/HU jurisdiction).

## Deployment (Manus stack — NOT Emergent)
- This is a Node/Express + MySQL app; deploy via **Save to GitHub** → pull/deploy on the **Manus dashboard**
  → point **bod.legal** through **Cloudflare**. Cannot be deployed by Emergent's deploy (wrong stack).
- Required env on Manus: JWT_SECRET, VITE_APP_ID, MySQL creds, STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET,
  GOOGLE_CLIENT_ID/SECRET, SENDGRID_*, TWILIO_* (see `.env.example`).
- New Stripe webhook events to enable on the live endpoint: keep `checkout.session.completed`
  (now also handles trial `mode:setup`). Register `https://bod.legal/api/auth/google/callback` in Google Cloud.
