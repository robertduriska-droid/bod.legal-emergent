// Session layer: signs, verifies and resolves the app_session_id cookie.
//
// This file used to be the Manus platform SDK: an OAuth client that talked to a
// Manus portal, exchanged codes for tokens, and synced users from a Manus user
// service. None of that exists on a self-hosted deployment, and its leftovers
// caused real outages (an empty appId rejected every session; an empty portal
// URL crashed pages). Identity now comes from our own providers only:
//
//   - Google  -> server/_core/googleAuth.ts   (openId "google:<sub>")
//   - Email   -> auth.register / auth.login   (openId "email:<address>")
//
// Both mint the same session token here, so the rest of the app has one notion
// of "who is calling".

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export interface SessionPayload {
  openId: string;
  name?: string;
}

export type AuthenticatedUser = User;

class Sdk {
  private parseCookies(cookieHeader: string | undefined): Map<string, string> {
    if (!cookieHeader) return new Map();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  /** Mint a session token for an openId, e.g. "google:123" or "email:a@b.sk". */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession({ openId, name: options.name || "" }, options);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

    return new SignJWT({ openId: payload.openId, name: payload.name || "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  /**
   * Verify a session cookie. Only `openId` decides identity; `name` is display
   * metadata and must never invalidate a session (a provider may give none).
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });
      const { openId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload has no openId");
        return null;
      }

      return { openId, name: isNonEmptyString(name) ? name : "" };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Resolve the caller from the request. The user must already exist: both
   * providers upsert the row at sign-in, so there is nobody to "sync" from.
   */
  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);

    // Fallback for contexts where the browser blocks cookies (Safari ITP in an
    // iframe, private browsing, some WebViews).
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }

    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    return user;
  }
}

export const sdk = new Sdk();
