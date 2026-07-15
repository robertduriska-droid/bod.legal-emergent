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

## Required config (set in the app's real env — Manus dashboard / .env)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google Cloud Console, Web application OAuth client)
- Authorized redirect URI to register (per domain): `https://<domain>/api/auth/google/callback`
  - Custom domain: `https://bod.legal/api/auth/google/callback` (DNS on Cloudflare)
- JWT_SECRET + VITE_APP_ID must be set (session signing) — already provided on Manus.

## Backlog / Next
- P1: expose the AI assistant on the ContractDetail page and/or a standalone "general" legal Q&A + drafting page (backend already supports contractId=null).
- P1: optional streaming responses (currently non-streaming mutation).
- Mike's CourtListener/US case-law feature intentionally skipped (US-only; bod.legal is SK/CZ jurisdiction).
