# Test Credentials

## Email & password login (classic auth)
- Users self-register at the dashboard login gate ("Create account") — email + password (min 8 chars).
- Passwords are bcrypt-hashed and stored in the `email_credentials` table (auto-created).
- openId for email users = `email:<lowercased-email>`; sessions reuse the existing `app_session_id` JWT cookie.
- Brute force: 5 failed logins → 15-min lockout. Login errors are generic (no user enumeration).
- Admin: to make an email account admin, set env `OWNER_OPEN_ID = email:<that-email>` (existing role logic).
- Endpoints (tRPC): `auth.register`, `auth.login`, `auth.logout`, `auth.me`.
- No admin is auto-seeded (no invented production credentials). Create a test account via the form.

## Sign in with Google (standard OAuth 2.0)
- Google OAuth does NOT use app-managed passwords — no password to store.
- Requires env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (owner's Google Cloud OAuth Web client).
- App user openId = `google:<google_sub>`, loginMethod = "google".
- Redirect URI registered in Google Cloud Console: https://<domain>/api/auth/google/callback

## Manus OAuth (original login method)
- Existing platform login; unchanged.

Note: The app runs on the Manus platform (needs MySQL + Manus env). It does not run inside
the Emergent pod, so live end-to-end auth testing must be done on the deployed Manus/custom domain.
