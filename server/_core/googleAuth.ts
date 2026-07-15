import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Standard "Sign in with Google" using the app owner's own Google Cloud
// OAuth 2.0 credentials. This flow is fully self-contained: it does NOT rely on
// the Manus OAuth server. It reuses the existing session JWT (sdk.signSession)
// and the app_session_id cookie, so a Google-authenticated user is treated
// exactly like any other user by the rest of the app.
//
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS,
// THIS BREAKS THE AUTH. The frontend passes redirect_uri built from
// window.location.origin so we always return to the exact domain in use.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_STATE_COOKIE = "g_oauth_state";

type GoogleState = { redirectUri: string; nonce: string };

function encodeState(state: GoogleState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

function decodeState(raw: string): GoogleState | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed && typeof parsed.redirectUri === "string" && typeof parsed.nonce === "string") {
      return parsed as GoogleState;
    }
  } catch {
    // malformed state
  }
  return null;
}

function getRequestOrigin(req: Request): string {
  const proto = ((req.headers["x-forwarded-proto"] as string) || req.protocol || "https")
    .split(",")[0]
    .trim();
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  return `${proto}://${host}`;
}

function getStateCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === GOOGLE_STATE_COOKIE) return rest.join("=");
  }
  return undefined;
}

export function registerGoogleAuthRoutes(app: Express) {
  // Step 1: kick off Google consent screen.
  app.get("/api/auth/google/login", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: "Google login is not configured (missing GOOGLE_CLIENT_ID)" });
      return;
    }

    const redirectUri =
      typeof req.query.redirect_uri === "string" && req.query.redirect_uri.length > 0
        ? req.query.redirect_uri
        : `${getRequestOrigin(req)}/api/auth/google/callback`;

    const nonce = randomUUID();
    const state = encodeState({ redirectUri, nonce });

    // CSRF: bind this login attempt to the browser that started it.
    res.cookie(GOOGLE_STATE_COOKIE, nonce, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 10 * 60 * 1000,
    });

    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "online");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("prompt", "select_account");

    res.redirect(302, url.toString());
  });

  // Step 2: Google redirects back here with an authorization code.
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      res.status(500).json({ error: "Google login is not configured" });
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const rawState = typeof req.query.state === "string" ? req.query.state : undefined;
    if (!code || !rawState) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    const state = decodeState(rawState);
    const expectedNonce = getStateCookie(req);
    if (!state || !state.nonce || state.nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      // Exchange the authorization code for tokens.
      const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: state.redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResp.ok) {
        console.error("[GoogleAuth] Token exchange failed", await tokenResp.text());
        res.status(502).json({ error: "Google token exchange failed" });
        return;
      }

      const tokenJson = (await tokenResp.json()) as { access_token?: string };
      if (!tokenJson.access_token) {
        res.status(502).json({ error: "Google token response missing access_token" });
        return;
      }

      // Fetch the user's profile.
      const infoResp = await fetch(GOOGLE_USERINFO_URL, {
        headers: { authorization: `Bearer ${tokenJson.access_token}` },
      });

      if (!infoResp.ok) {
        console.error("[GoogleAuth] Userinfo failed", await infoResp.text());
        res.status(502).json({ error: "Failed to fetch Google user info" });
        return;
      }

      const profile = (await infoResp.json()) as {
        sub?: string;
        email?: string;
        name?: string;
        email_verified?: boolean;
      };

      if (!profile.sub) {
        res.status(400).json({ error: "Google profile missing sub" });
        return;
      }

      // Namespaced openId keeps Google users distinct from Manus users.
      const openId = `google:${profile.sub}`;

      await db.upsertUser({
        openId,
        name: profile.name || null,
        email: profile.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[GoogleAuth] Callback failed", error);
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });
}
