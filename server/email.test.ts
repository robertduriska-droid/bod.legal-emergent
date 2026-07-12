import { describe, it, expect, vi } from "vitest";

describe("SendGrid Email Integration", () => {
  it("should have SendGrid API key configured", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith("SG.")).toBe(true);
  });

  it("should have SendGrid from email configured", () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).toContain("@");
  });

  it("should validate SendGrid API key with a dry-run request", async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn("Skipping: no API key");
      return;
    }

    // Use the SendGrid API to check key validity (get sender identities)
    const res = await fetch("https://api.sendgrid.com/v3/marketing/senders", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // 200 = valid key, 401/403 = invalid key
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
