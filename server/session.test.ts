import { describe, it, expect, vi, beforeEach } from "vitest";

// A self-hosted deployment has no Manus platform variables, so VITE_APP_ID is
// empty. The session layer must still work: this is exactly the condition that
// silently broke every login in production.
vi.mock("./_core/env", () => ({
  ENV: {
    appId: "", // VITE_APP_ID unset when self-hosting
    cookieSecret: "test-session-secret-at-least-32-chars-long",
    oAuthServerUrl: "",
    databaseUrl: "",
    isProduction: false,
  },
}));

import { sdk } from "./_core/sdk";

describe("session tokens survive a self-hosted deployment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("round-trips a session when appId is empty (VITE_APP_ID unset)", async () => {
    const token = await sdk.createSessionToken("google:12345", { name: "Jan Novák" });
    const session = await sdk.verifySession(token);

    expect(session).not.toBeNull();
    expect(session!.openId).toBe("google:12345");
  });

  it("round-trips a session when the provider gives no display name", async () => {
    // Google accounts without a name, and email signups without one, both land here.
    const token = await sdk.createSessionToken("email:jan@example.sk", { name: "" });
    const session = await sdk.verifySession(token);

    expect(session).not.toBeNull();
    expect(session!.openId).toBe("email:jan@example.sk");
    expect(session!.name).toBe("");
  });

  it("round-trips a session when no options are passed at all", async () => {
    const token = await sdk.createSessionToken("email:minimal@example.sk");
    const session = await sdk.verifySession(token);

    expect(session).not.toBeNull();
    expect(session!.openId).toBe("email:minimal@example.sk");
  });

  it("still rejects a token with no openId", async () => {
    // openId is the only field that decides identity, so it stays mandatory.
    const token = await sdk.signSession({ openId: "", appId: "", name: "x" } as never);
    expect(await sdk.verifySession(token)).toBeNull();
  });

  it("rejects a tampered or foreign token", async () => {
    expect(await sdk.verifySession("not-a-jwt")).toBeNull();
    expect(await sdk.verifySession(undefined)).toBeNull();
  });
});
