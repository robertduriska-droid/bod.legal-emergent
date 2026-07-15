# Test Credentials

## Sign in with Google (standard OAuth 2.0)
- Google OAuth does NOT use app-managed passwords — no password to store.
- Requires env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (owner's Google Cloud OAuth Web client).
- App user is created on first login with openId = `google:<google_sub>`, loginMethod = "google".
- Redirect URI registered in Google Cloud Console: https://<domain>/api/auth/google/callback
- Admin: set OWNER_OPEN_ID to the owner's `google:<sub>` to grant admin role on login.

## Allowed Google test accounts
- (add owner/test emails here once provided)

Note: The app runs on the Manus platform (needs MySQL + Manus env). It does not run inside
the Emergent pod, so live end-to-end auth testing must be done on the deployed Manus/custom domain.
