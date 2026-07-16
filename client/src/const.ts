import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS };

// Start the standard "Sign in with Google" flow using the firm's own Google
// Cloud OAuth credentials. Self-contained: the backend exchanges the code and
// mints the same session cookie used everywhere else.
//
// REMINDER: DO NOT HARDCODE THE URL OR ADD FALLBACK REDIRECTS. Both URLs are
// derived from window.location.origin so we always return to the exact domain
// the user is on.
export const startGoogleLogin = () => {
  const redirectUri = `${window.location.origin}/api/auth/google/callback`;
  const url = new URL(`${window.location.origin}/api/auth/google/login`);
  url.searchParams.set("redirect_uri", redirectUri);
  window.location.href = url.toString();
};

// The app's single "send the user to sign in" entry point.
//
// This used to launch the Manus OAuth portal, which does not exist on a
// self-hosted deployment: VITE_OAUTH_PORTAL_URL was always empty, so it built
// `new URL("undefined/app-auth")` and threw, taking whole pages down. Google is
// now the only redirect-based provider, and email+password is available in the
// header dialog, so this simply delegates.
export const startLogin = startGoogleLogin;
