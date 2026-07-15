# bod.legal — PRD / Working Notes

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

## Required config (set in the app's real env — Manus dashboard / .env)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google Cloud Console, Web application OAuth client)
- Authorized redirect URI to register (per domain): `https://<domain>/api/auth/google/callback`
  - Custom domain: `https://bod.legal/api/auth/google/callback` (DNS on Cloudflare)
- JWT_SECRET + VITE_APP_ID must be set (session signing) — already provided on Manus.

## Backlog / Next
- P1: expose the AI assistant on the ContractDetail page and/or a standalone "general" legal Q&A + drafting page (backend already supports contractId=null).
- P1: optional streaming responses (currently non-streaming mutation).
- Mike's CourtListener/US case-law feature intentionally skipped (US-only; bod.legal is SK/CZ jurisdiction).
