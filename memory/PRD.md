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
- i18n label `header.signInGoogle` added to types.ts + sk/cz/en.
- `.env.example` documents required vars.

### Verification done
- `tsc --noEmit` → 0 errors.
- Local boot: `/api/auth/google/login` → 302 to accounts.google.com (correct params + CSRF cookie);
  forged-state callback → 403. Full live click-test not possible in Emergent pod (Manus stack).

## Required config (set in the app's real env — Manus dashboard / .env)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (Google Cloud Console, Web application OAuth client)
- Authorized redirect URI to register (per domain): `https://<domain>/api/auth/google/callback`
  - Custom domain: `https://bod.legal/api/auth/google/callback` (DNS on Cloudflare)
- JWT_SECRET + VITE_APP_ID must be set (session signing) — already provided on Manus.

## Backlog / Next
- Mike integration (original request) — deferred pending platform decision (Manus vs re-platform vs fresh build).
- P1: optionally add Google button to Home/Upload/DashboardLayout login CTAs (currently header only).
- P1: map an owner Google account to admin (set OWNER_OPEN_ID = `google:<sub>`).
