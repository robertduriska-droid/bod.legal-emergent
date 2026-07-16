import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Self-hosted deployments have no Manus OAuth portal, so VITE_OAUTH_PORTAL_URL
  // is empty and `new URL("undefined/app-auth")` below would throw
  // "Failed to construct 'URL': Invalid URL", taking the whole page down with it.
  // Fall back to the self-contained Google flow instead of crashing.
  if (!oauthPortalUrl) {
    startGoogleLogin();
    return;
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};

// Start the standard "Sign in with Google" flow (owner's own Google Cloud
// OAuth credentials). Self-contained: the backend handles the code exchange and
// mints the same session cookie used everywhere else.
//
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS,
// THIS BREAKS THE AUTH. We derive both URLs from window.location.origin so we
// always return to the exact domain the user is on (Manus, Emergent, or custom).
export const startGoogleLogin = () => {
  const redirectUri = `${window.location.origin}/api/auth/google/callback`;
  const url = new URL(`${window.location.origin}/api/auth/google/login`);
  url.searchParams.set("redirect_uri", redirectUri);
  window.location.href = url.toString();
};
