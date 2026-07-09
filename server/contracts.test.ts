import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { PRICING_PLANS, LEGAL_SOURCES, RISK_CATEGORIES } from "../shared/types";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Shared types and reference data", () => {
  it("PRICING_PLANS has 3 plans with correct IDs", () => {
    expect(PRICING_PLANS).toHaveLength(3);
    expect(PRICING_PLANS.map(p => p.id)).toEqual(["basic", "standard", "premium"]);
  });

  it("PRICING_PLANS has correct prices", () => {
    expect(PRICING_PLANS[0].price).toBe(149);
    expect(PRICING_PLANS[1].price).toBe(249);
    expect(PRICING_PLANS[2].price).toBe(399);
  });

  it("LEGAL_SOURCES contains Slov-Lex and EUR-Lex sources", () => {
    expect(LEGAL_SOURCES.length).toBeGreaterThan(0);
    const slovLex = LEGAL_SOURCES.filter(s => s.source === "Slov-Lex");
    const eurLex = LEGAL_SOURCES.filter(s => s.source === "EUR-Lex");
    expect(slovLex.length).toBeGreaterThan(0);
    expect(eurLex.length).toBeGreaterThan(0);
  });

  it("LEGAL_SOURCES have valid URLs", () => {
    for (const source of LEGAL_SOURCES) {
      expect(source.url).toMatch(/^https:\/\/(www\.slov-lex\.sk|eur-lex\.europa\.eu)/);
    }
  });

  it("RISK_CATEGORIES covers key risk areas", () => {
    expect(RISK_CATEGORIES.length).toBeGreaterThan(5);
    const ids = RISK_CATEGORIES.map(c => c.id);
    expect(ids).toContain("authority_parties");
    expect(ids).toContain("price_payment");
    expect(ids).toContain("liability_indemnity");
    expect(ids).toContain("privacy_security");
  });

  it("RISK_CATEGORIES have Slovak labels and checks", () => {
    for (const cat of RISK_CATEGORIES) {
      expect(cat.labelSk).toBeTruthy();
      expect(cat.checks.length).toBeGreaterThan(0);
      expect(["high", "medium", "low"]).toContain(cat.severity);
    }
  });
});

describe("Reference data procedures", () => {
  it("reference.legalSources returns all legal sources", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reference.legalSources();
    expect(result).toEqual(LEGAL_SOURCES);
  });

  it("reference.riskCategories returns all risk categories", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reference.riskCategories();
    expect(result).toEqual(RISK_CATEGORIES);
  });

  it("reference.pricingPlans returns all pricing plans", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reference.pricingPlans();
    expect(result).toEqual(PRICING_PLANS);
  });
});

describe("Auth procedures", () => {
  it("auth.me returns user when authenticated", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.openId).toBe("test-user-001");
  });

  it("auth.me returns null when unauthenticated", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.logout clears session cookie", async () => {
    const { ctx, clearedCookies } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0].name).toBe(COOKIE_NAME);
  });
});

describe("Protected procedures - access control", () => {
  it("contracts.myContracts throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.contracts.myContracts()).rejects.toThrow();
  });

  it("admin.allContracts throws FORBIDDEN for non-admin users", async () => {
    const { ctx } = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.allContracts()).rejects.toThrow();
  });
});
