import { COOKIE_NAME, ATTACHMENT_ALLOWED_MIME, ATTACHMENT_MAX_BYTES } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";
import { registerEmailUser, loginEmailUser, EmailAuthError } from "./emailAuth";
import { z } from "zod";
import {
  createContract,
  getContractById,
  getContractsByUserId,
  getAllContracts,
  updateContractStatus,
  createClauses,
  getClausesByContractId,
  updateClause,
  createReport,
  getReportByContractId,
  updateReport,
  createNotification,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getDecisionsByContractAndUser,
  upsertDecision,
  bulkUpsertDecisions,
  deleteDecision,
  getCommentsByContract,
  createComment,
  deleteComment,
  getUserById,
  createFeedback,
  getFeedbackByContract,
  getChatMessages,
  clearChatMessages,
  createAttachment,
  getAttachmentsByContract,
  getAttachmentById,
  deleteAttachment,
  setNotifyPhone,
  getNotifyPhone,
  getDeepAnalysisByContract,
  getTrialByUserId,
  upsertTrialPending,
  markTrialAnalysisUsed,
  updateUserStripeCustomerId,
  createContractClaim,
  getContractClaimByContractId,
  setContractClaimEmail,
  updateContractPlanAndOwner,
} from "./db";
import { randomUUID } from "crypto";
import type { TrpcContext } from "./_core/context";
import { storagePut } from "./storage";
import { analyzeContract } from "./analysis";
import { runAssistant } from "./assistant";
import { notifyClient, notifyAdmins } from "./twilio";
import { notifyOwner } from "./_core/notification";
import { sendEmail, emailReviewCompleted } from "./email";
import { LEGAL_SOURCES, RISK_CATEGORIES, PRICING_PLANS } from "@shared/types";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { STRIPE_PRODUCTS } from "./stripe-products";

// ─── Anonymous free-scan claims ─────────────────────────────────────────────
// Contracts uploaded without a session are owned by a claim token: a random
// UUID stored in contract_claims and mirrored into an httpOnly cookie. The
// sentinel userId 0 marks anonymous rows (users.id autoincrements from 1).

const ANONYMOUS_USER_ID = 0;
const CLAIM_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const claimCookieName = (contractId: number) => `bod_claim_${contractId}`;

/** Base URL for links in SMS/e-mail notifications. Env override with a localhost fallback. */
function getAppBaseUrl(): string {
  const fromEnv = (process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
  return fromEnv || "http://localhost:3000";
}

/** Read the anonymous claim token for a contract from the request's cookies. */
function readClaimToken(req: TrpcContext["req"], contractId: number): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  const name = claimCookieName(contractId);
  for (const part of header.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    if (part.slice(0, eqIdx).trim() !== name) continue;
    const raw = part.slice(eqIdx + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

/** True when the caller is the contract owner, an admin, or holds a valid claim cookie. */
async function canAccessContract(
  ctx: TrpcContext,
  contract: { id: number; userId: number }
): Promise<boolean> {
  if (ctx.user && (contract.userId === ctx.user.id || ctx.user.role === "admin")) {
    return true;
  }
  const token = readClaimToken(ctx.req, contract.id);
  if (!token) return false;
  const claim = await getContractClaimByContractId(contract.id).catch(() => null);
  return !!claim && claim.token === token;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    /** Register with email + password */
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8).max(200),
        name: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { openId, name } = await registerEmailUser(input);
          const token = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
          return { success: true as const };
        } catch (e) {
          if (e instanceof EmailAuthError && e.reason === "EMAIL_TAKEN") {
            throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
          }
          console.error("[EmailAuth] register failed:", e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed. Please try again." });
        }
      }),

    /** Log in with email + password */
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1).max(200),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { openId, name } = await loginEmailUser(input);
          const token = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
          ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
          return { success: true as const };
        } catch (e) {
          if (e instanceof EmailAuthError && e.reason === "LOCKED") {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again in 15 minutes." });
          }
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
      }),
  }),

  // ─── Contract Procedures ────────────────────────────────────────────────
  contracts: router({
    /** Upload and create a new contract.
     * Public: the free basic scan works without a session (anonymous upload
     * owned by a claim-token cookie). Paid plans still require sign-in. */
    upload: publicProcedure
      .input(z.object({
        fileName: z.string(),
        mimeType: z.string(),
        fileBase64: z.string(),
        plan: z.enum(["basic", "standard", "premium"]),
        expressAddon: z.boolean().default(false),
        language: z.string().default("sk"),
        phone: z.string().max(32).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user && input.plan !== "basic") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to order a paid review." });
        }
        const ownerId = user?.id ?? ANONYMOUS_USER_ID;

        // Decode file and upload to S3
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.mimeType.includes("pdf") ? "pdf" : "docx";
        // Sanitize filename to ASCII-only for S3 storage
        const safeFileName = input.fileName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_+/g, "_");
        const storageKey = `contracts/${ownerId}/${Date.now()}_${safeFileName}`;

        const { key, url } = await storagePut(storageKey, fileBuffer, input.mimeType);

        // Create contract record
        const contractId = await createContract({
          userId: ownerId,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileKey: key,
          fileUrl: url,
          plan: input.plan,
          expressAddon: input.expressAddon ? 1 : 0,
          language: input.language,
          status: "pending",
        });

        // Anonymous free scan: mint a claim token and hand it to the browser
        // as an httpOnly cookie so only this browser can open the preview.
        if (!user) {
          const claimToken = randomUUID();
          await createContractClaim(contractId, claimToken);
          ctx.res.cookie(claimCookieName(contractId), claimToken, {
            ...getSessionCookieOptions(ctx.req),
            maxAge: CLAIM_COOKIE_MAX_AGE_MS,
          });
        }

        // Persist optional SMS/WhatsApp recipient for this contract (Twilio)
        if (input.phone) {
          await setNotifyPhone(contractId, ownerId, input.phone)
            .catch(err => console.error("[NotifyPref] Failed:", err));
        }

        const uploaderLabel = user
          ? (user.name || user.email || "ID:" + user.id)
          : "anonymný návštevník (bezplatný sken)";

        // Twilio: alert admins/lawyers about the new submission (SMS + WhatsApp)
        notifyAdmins(`bod.legal: Nová zmluva "${input.fileName}" (plán: ${input.plan}) od ${uploaderLabel}.`)
          .catch(() => {});

        // Notify owner/lawyer about new submission
        await notifyOwner({
          title: "Nová zmluva na kontrolu",
          content: `Používateľ ${uploaderLabel} nahral zmluvu "${input.fileName}" (plán: ${input.plan}). Zmluva čaká na spracovanie.`,
        }).catch(err => console.error("[Notification] Failed:", err));

        // In-app notification for signed-in users
        if (user) {
          await createNotification({
            userId: user.id,
            title: "Zmluva odoslaná",
            message: `Vaša zmluva "${input.fileName}" bola úspešne nahraná a čaká na spracovanie.`,
            type: "contract_submitted",
            contractId: contractId,
          }).catch(err => console.error("[Notification] Failed to create:", err));
        }

        // Analysis will be triggered by Stripe webhook after payment
        // For basic plan: also runs free preview (top 3 risks) immediately
        if (input.plan === "basic") {
          analyzeContract(contractId).catch(err =>
            console.error(`[Analysis] Failed for contract ${contractId}:`, err)
          );
          return { contractId, status: "pending" as const, trialApplied: false };
        }

        // Paid plans are guarded above, so a signed-in user is guaranteed here.
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to order a paid review." });
        }

        // Free trial: apply the one free full analysis if the user has an active
        // trial that hasn't been used yet (non-basic plans only). Skips payment.
        let trialApplied = false;
        const trial = await getTrialByUserId(user.id).catch(() => null);
        const trialActive = !!trial && trial.status === "active"
          && !!trial.endsAt && new Date(trial.endsAt).getTime() > Date.now();
        if (trialActive && trial!.freeAnalysisUsed === 0) {
          await markTrialAnalysisUsed(user.id).catch(err => console.error("[Trial] mark used failed:", err));
          trialApplied = true;
          analyzeContract(contractId).catch(err =>
            console.error(`[Analysis] Trial analysis failed for contract ${contractId}:`, err)
          );
        }

        return { contractId, status: "pending" as const, trialApplied };
      }),

    /** Get user's contracts */
    myContracts: protectedProcedure.query(async ({ ctx }) => {
      return getContractsByUserId(ctx.user.id);
    }),

    /** Get a specific contract with clauses and report.
     * Public: accessible to the authenticated owner (or admin), or to an
     * anonymous free-scan uploader holding a valid claim-token cookie. */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.id);
        if (!contract) return null;

        // Owner, admin, or valid claim-token holder only
        if (!(await canAccessContract(ctx, contract))) {
          return null;
        }

        const contractClauses = await getClausesByContractId(input.id);
        const report = await getReportByContractId(input.id);
        const deep = await getDeepAnalysisByContract(input.id);
        const deepAnalysisOut = deep ? {
          riskScore: deep.riskScore,
          dealBreakers: (deep.dealBreakers as { title: string; detail: string }[] | null) || [],
          missingProvisions: (deep.missingProvisions as { title: string; detail: string }[] | null) || [],
          verificationNotes: deep.verificationNotes,
          redacted: false,
        } : null;

        // For basic plan: only show top 3 high-risk clauses (free preview)
        // Redact full report data - only expose riskSummary counts
        if (contract.plan === "basic") {
          const limitedClauses = contractClauses
            .sort((a, b) => {
              const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
              return (riskOrder[a.riskLevel] ?? 2) - (riskOrder[b.riskLevel] ?? 2);
            })
            .slice(0, 3)
            .map(c => ({ ...c, suggestedEdit: null, lawyerAnnotation: null }));
          const limitedReport = report ? {
            ...report,
            summary: null,
            recommendation: null,
            isSigned: 0,
            lawyerName: null,
            signedAt: null,
          } : null;
          // Teaser only: overall risk score, details redacted behind the paywall.
          const limitedDeep = deep ? {
            riskScore: deep.riskScore,
            dealBreakers: [] as { title: string; detail: string }[],
            missingProvisions: [] as { title: string; detail: string }[],
            verificationNotes: null,
            redacted: true,
          } : null;
          return { contract, clauses: limitedClauses, report: limitedReport, isLimited: true, deepAnalysis: limitedDeep };
        }

        return { contract, clauses: contractClauses, report, isLimited: false, deepAnalysis: deepAnalysisOut };
      }),
    /** Attach an e-mail to a free-scan contract (claim-token holder or owner).
     * Captured at the preview paywall: "Kam vám pošleme report?" */
    attachEmail: publicProcedure
      .input(z.object({
        contractId: z.number(),
        email: z.string().email().max(320),
      }))
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
        }
        if (!(await canAccessContract(ctx, contract))) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed" });
        }
        await setContractClaimEmail(input.contractId, input.email);
        notifyOwner({
          title: "Nový kontakt z bezplatného skenu",
          content: `Návštevník nechal e-mail ${input.email} pri zmluve "${contract.fileName}" (ID ${contract.id}).`,
        }).catch(() => {});
        return { success: true } as const;
      }),

    /** Retry analysis for a pending contract (user-facing) */
    retryAnalysis: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract || contract.userId !== ctx.user.id) {
          throw new Error("Contract not found");
        }
        if (contract.status !== "pending") {
          throw new Error("Contract is not in pending state");
        }
        // Re-trigger analysis
        analyzeContract(input.contractId).catch(err =>
          console.error(`[Analysis] Retry failed for contract ${input.contractId}:`, err)
        );
        return { success: true };
      }),
  }),

  // ─── Admin / Lawyer Procedures ──────────────────────────────────────────
  admin: router({
    /** Get all contracts (admin only) */
    allContracts: adminProcedure.query(async () => {
      return getAllContracts();
    }),

    /** Get contract detail for review */
    getContractForReview: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const contract = await getContractById(input.id);
        if (!contract) return null;

        const contractClauses = await getClausesByContractId(input.id);
        const report = await getReportByContractId(input.id);

        return { contract, clauses: contractClauses, report };
      }),

    /** Update clause with lawyer annotation */
    annotateClause: adminProcedure
      .input(z.object({
        clauseId: z.number(),
        lawyerAnnotation: z.string().optional(),
        lawyerApproved: z.number().min(0).max(1).optional(),
        overriddenRiskLevel: z.enum(["high", "medium", "low"]).optional(),
      }))
      .mutation(async ({ input }) => {
        await updateClause(input.clauseId, {
          lawyerAnnotation: input.lawyerAnnotation,
          lawyerApproved: input.lawyerApproved,
          overriddenRiskLevel: input.overriddenRiskLevel,
        });
        return { success: true };
      }),

    /** Mark contract as in review */
    startReview: adminProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ input }) => {
        await updateContractStatus(input.contractId, "in_review");
        return { success: true };
      }),

    /** Sign and complete the report */
    signReport: adminProcedure
      .input(z.object({
        contractId: z.number(),
        summary: z.string().optional(),
        recommendation: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Update report as signed
        const report = await getReportByContractId(input.contractId);
        if (report) {
          await updateReport(report.id, {
            isSigned: 1,
            signedAt: new Date(),
            lawyerName: ctx.user.name || "Advokát",
            lawyerId: ctx.user.id,
            ...(input.summary && { summary: input.summary }),
            ...(input.recommendation && { recommendation: input.recommendation }),
          });
        }

        // Mark contract as completed
        await updateContractStatus(input.contractId, "completed");

        // Notify user that their report is finalized and lawyer-signed
        const signedContract = await getContractById(input.contractId);
        if (signedContract) {
          await createNotification({
            userId: signedContract.userId,
            title: "Report podpísaný advokátom",
            message: `Vaša zmluva "${signedContract.fileName}" bola skontrolovaná a podpísaná advokátom. Report je pripravený na stiahnutie.`,
            type: "contract_completed",
            contractId: input.contractId,
          }).catch(err => console.error("[Notification] Failed to create:", err));

          // Twilio: SMS + WhatsApp to the client that the signed report is ready
          {
            const signPhone = await getNotifyPhone(input.contractId).catch(() => null);
            const lang = signedContract.language || "sk";
            const url = `${getAppBaseUrl()}/report/${signedContract.id}`;
            const msg = lang === "en"
              ? `bod.legal: Your report for "${signedContract.fileName}" is signed by the lawyer and ready: ${url}`
              : lang === "cz"
                ? `bod.legal: Váš report pro "${signedContract.fileName}" je podepsán advokátem a připraven: ${url}`
                : `bod.legal: Váš report pre "${signedContract.fileName}" je podpísaný advokátom a pripravený: ${url}`;
            notifyClient(signPhone, msg).catch(() => {});
          }

          // Email notification to client
          const clientUser = await getUserById(signedContract.userId).catch(() => null);
          if (clientUser?.email) {
            const { subject, html } = emailReviewCompleted({
              contractName: signedContract.fileName,
              reportUrl: `${getAppBaseUrl()}/report/${signedContract.id}`,
              recipientName: clientUser.name || undefined,
              lawyerName: ctx.user.name || undefined,
            });
            sendEmail({ to: clientUser.email, subject, html }).catch(err => console.warn("[Email] Review completed failed:", err));
          }
        }

        return { success: true };
      }),

    /** Re-run AI analysis on a contract */
    reanalyze: adminProcedure
      .input(z.object({ contractId: z.number() }))
      .mutation(async ({ input }) => {
        await updateContractStatus(input.contractId, "analyzing");
        analyzeContract(input.contractId).catch(err =>
          console.error(`[Analysis] Re-analysis failed for contract ${input.contractId}:`, err)
        );
        return { success: true };
      }),
  }),

  // ─── Stripe Payment Procedures ─────────────────────────────────────────
  payments: router({
    /** Create a Stripe checkout session for a contract.
     * Free-scan upsell: a basic (free) contract checks out only with an
     * `upgradeTo` plan; an anonymous claim-holder who signed in gets the
     * contract adopted to their account before payment. */
    createCheckout: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        upgradeTo: z.enum(["standard", "premium"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract || !(await canAccessContract(ctx, contract))) {
          throw new Error("Contract not found");
        }

        // Adopt an anonymous free-scan contract to the paying user.
        if (contract.userId !== ctx.user.id && ctx.user.role !== "admin") {
          await updateContractPlanAndOwner(contract.id, { userId: ctx.user.id });
          contract.userId = ctx.user.id;
        }

        // Resolve the plan to charge. Basic is the free scan and has no
        // Stripe product, so it must carry an upgrade.
        let planToCharge = contract.plan as string;
        if (input.upgradeTo && input.upgradeTo !== contract.plan) {
          await updateContractPlanAndOwner(contract.id, { plan: input.upgradeTo });
          planToCharge = input.upgradeTo;
        }
        if (planToCharge === "basic") {
          throw new Error("Bezplatný sken sa neplatí. Vyberte Štandardnú alebo Prémiovú kontrolu.");
        }

        const product = STRIPE_PRODUCTS[planToCharge as keyof typeof STRIPE_PRODUCTS];
        if (!product) {
          throw new Error(`Invalid plan: ${planToCharge}`);
        }

        const stripe = new Stripe(ENV.stripeSecretKey);
        const origin = ctx.req.headers.origin || getAppBaseUrl();

        // Build line items - plan + optional express add-on
        const lineItems: any[] = [
          {
            price_data: {
              currency: product.currency,
              unit_amount: product.priceAmount,
              product_data: {
                name: product.name,
                description: product.description,
              },
            },
            quantity: 1,
          },
        ];

        // Add express add-on if selected
        if (contract.expressAddon) {
          lineItems.push({
            price_data: {
              currency: STRIPE_PRODUCTS.express.currency,
              unit_amount: STRIPE_PRODUCTS.express.priceAmount,
              product_data: {
                name: STRIPE_PRODUCTS.express.name,
                description: STRIPE_PRODUCTS.express.description,
              },
            },
            quantity: 1,
          });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          allow_promotion_codes: true,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            contract_id: input.contractId.toString(),
            plan: planToCharge,
            express: contract.expressAddon ? "true" : "false",
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
          },
          line_items: lineItems,
          success_url: `${origin}/contract/${input.contractId}?payment=success`,
          cancel_url: `${origin}/contract/${input.contractId}?payment=cancelled`,
        });

        return { checkoutUrl: session.url };
      }),

    /** Get payment status for a contract (checks Stripe directly).
     * Public: owner, admin, or anonymous claim-token holder. */
    getStatus: publicProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract || !(await canAccessContract(ctx, contract))) {
          return { paid: false };
        }

        // If contract is already analyzing or completed, it was paid
        if (contract.status !== "pending") {
          return { paid: true };
        }

        // Contract is pending - check if basic plan (free preview available)
        // For standard/premium: payment required before full analysis
        return { paid: false };
      }),
  }),

  // ─── Free Trial (15-day trial + 1 free analysis, Stripe SetupIntent) ────────
  trial: router({
    /** Current user's trial status */
    status: protectedProcedure.query(async ({ ctx }) => {
      const trial = await getTrialByUserId(ctx.user.id);
      if (!trial) {
        return { hasTrial: false, active: false, freeAnalysisAvailable: false, daysLeft: 0, status: "none" as const, freeAnalysisUsed: false, endsAt: null as string | null };
      }
      const now = Date.now();
      const endsAtMs = trial.endsAt ? new Date(trial.endsAt).getTime() : 0;
      const active = trial.status === "active" && endsAtMs > now;
      const daysLeft = active ? Math.max(0, Math.ceil((endsAtMs - now) / (24 * 60 * 60 * 1000))) : 0;
      return {
        hasTrial: true,
        active,
        freeAnalysisAvailable: active && trial.freeAnalysisUsed === 0,
        freeAnalysisUsed: trial.freeAnalysisUsed === 1,
        daysLeft,
        status: trial.status,
        endsAt: trial.endsAt ? new Date(trial.endsAt).toISOString() : null,
      };
    }),

    /** Start the free trial: save a card via Stripe Checkout (setup mode), no charge. */
    start: protectedProcedure
      .input(z.object({ redirectPath: z.string().max(120).default("/trial") }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getTrialByUserId(ctx.user.id);
        if (existing && existing.status === "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Trial is already active." });
        }

        const stripe = new Stripe(ENV.stripeSecretKey);
        const origin = ctx.req.headers.origin || getAppBaseUrl();

        // Reuse or create the user's Stripe customer.
        const dbUser = await getUserById(ctx.user.id);
        let customerId = dbUser?.stripeCustomerId || undefined;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: ctx.user.email || undefined,
            name: ctx.user.name || undefined,
            metadata: { user_id: String(ctx.user.id) },
          });
          customerId = customer.id;
          await updateUserStripeCustomerId(ctx.user.id, customerId).catch(() => {});
        }

        const path = input.redirectPath.startsWith("/") ? input.redirectPath : `/${input.redirectPath}`;
        const session = await stripe.checkout.sessions.create({
          mode: "setup",
          payment_method_types: ["card"],
          customer: customerId,
          metadata: { user_id: String(ctx.user.id), purpose: "trial" },
          setup_intent_data: { metadata: { user_id: String(ctx.user.id), purpose: "trial" } },
          success_url: `${origin}${path}?setup=success`,
          cancel_url: `${origin}${path}?setup=cancelled`,
        });

        await upsertTrialPending(ctx.user.id, customerId, session.id).catch(() => {});
        return { checkoutUrl: session.url };
      }),
  }),

  // ─── Notifications ──────────────────────────────────────────────────────
  notifications: router({
    /** Get user's notifications */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsByUserId(ctx.user.id);
    }),

    /** Get unread count */
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),

    /** Mark a single notification as read */
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),

    /** Mark all notifications as read */
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Clause Decisions ──────────────────────────────────────────────────
  decisions: router({
    /** Get all decisions for a contract by the current user */
    getByContract: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ ctx, input }) => {
        const rows = await getDecisionsByContractAndUser(input.contractId, ctx.user.id);
        // Return as a map: { [clauseId]: "accepted" | "rejected" }
        const map: Record<string, "accepted" | "rejected"> = {};
        for (const row of rows) {
          map[row.clauseId.toString()] = row.decision as "accepted" | "rejected";
        }
        return map;
      }),

    /** Save a single clause decision */
    save: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        clauseId: z.number(),
        decision: z.enum(["accepted", "rejected"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertDecision(ctx.user.id, input.contractId, input.clauseId, input.decision);
        return { success: true };
      }),

    /** Save all decisions at once (bulk) */
    saveAll: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        decisions: z.record(z.string(), z.enum(["accepted", "rejected"])),
      }))
      .mutation(async ({ ctx, input }) => {
        await bulkUpsertDecisions(ctx.user.id, input.contractId, input.decisions);
        return { success: true };
      }),

    /** Remove a decision (undo) */
    remove: protectedProcedure
      .input(z.object({ clauseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteDecision(ctx.user.id, input.clauseId);
        return { success: true };
      }),
  }),

  // ─── Clause Comments ────────────────────────────────────────────────────
  comments: router({
    /** Get all comments for a contract (owner or admin) */
    getByContract: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Allow contract owner or admin
        const contract = await getContractById(input.contractId);
        if (!contract) return [];
        if (contract.userId !== ctx.user.id && ctx.user.role !== 'admin') return [];
        return getCommentsByContract(input.contractId);
      }),

    /** Add a comment to a clause (contract owner or admin) */
    add: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        clauseId: z.number(),
        content: z.string().min(1).max(2000),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user owns the contract or is admin
        const contract = await getContractById(input.contractId);
        if (!contract || (contract.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new Error('Unauthorized');
        }
        const isLawyer = ctx.user.role === 'admin' ? 1 : 0;
        const id = await createComment({
          contractId: input.contractId,
          clauseId: input.clauseId,
          userId: ctx.user.id,
          userName: ctx.user.name || 'User',
          content: input.content,
          parentId: input.parentId || null,
          isLawyer,
        });

        // Send owner notification about new comment
        const isUserComment = ctx.user.role !== 'admin';
        const siteUrl = ctx.req.headers.origin || getAppBaseUrl();
        notifyOwner({
          title: isUserComment
            ? `Nový komentár klienta: ${contract.fileName}`
            : `Odpoveď advokáta: ${contract.fileName}`,
          content: `${ctx.user.name || 'User'} pridal komentár ku klauzule #${input.clauseId}: "${input.content.slice(0, 200)}${input.content.length > 200 ? '...' : ''}"

Zmluva: ${contract.fileName}
Odkaz: ${siteUrl}/${isUserComment ? 'admin/review' : 'report'}/${contract.id}`,
        }).catch(err => console.warn('[Notification] Comment notify failed:', err));

        // Create in-app notification for the other party
        if (isUserComment) {
          // User commented → notify would go to admin (handled by owner notification above)
        } else {
          // Admin/lawyer replied → notify the contract owner
          createNotification({
            userId: contract.userId,
            title: 'Nová odpoveď advokáta',
            message: `Advokát odpovedal na váš komentár ku zmluve "${contract.fileName}".`,
            type: 'comment_reply',
            contractId: contract.id,
          }).catch(err => console.error('[Notification] Reply notify failed:', err));
        }

        return { id, success: true };
      }),

    /** Delete own comment */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteComment(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Feedback / Satisfaction Survey ───────────────────────────────────────
  feedback: router({
    submit: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        rating: z.enum(["positive", "negative"]),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createFeedback({
          userId: ctx.user.id,
          contractId: input.contractId,
          rating: input.rating,
          comment: input.comment || null,
        });
        return { success: true };
      }),
    getByContract: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getFeedbackByContract(input.contractId, ctx.user.id);
      }),
  }),

  // ─── AI Legal Assistant (chat with your contract) ───────────────────────────
  assistant: router({
    /** Load chat history for a contract (or the general assistant when null) */
    history: protectedProcedure
      .input(z.object({ contractId: z.number().nullable().optional() }))
      .query(async ({ ctx, input }) => {
        const contractId = input.contractId ?? null;
        if (contractId !== null) {
          const contract = await getContractById(contractId);
          if (!contract || (contract.userId !== ctx.user.id && ctx.user.role !== "admin")) return [];
        }
        return getChatMessages(ctx.user.id, contractId);
      }),

    /** Send a message to the assistant and get the updated conversation */
    send: protectedProcedure
      .input(z.object({
        contractId: z.number().nullable().optional(),
        message: z.string().min(1).max(4000),
        model: z.string().optional(),
        attachmentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contractId = input.contractId ?? null;
        let language = "sk";
        if (contractId !== null) {
          const contract = await getContractById(contractId);
          if (!contract || (contract.userId !== ctx.user.id && ctx.user.role !== "admin")) {
            throw new Error("Unauthorized");
          }
          language = contract.language || "sk";
        }
        const messages = await runAssistant({
          userId: ctx.user.id,
          contractId,
          userMessage: input.message,
          language,
          model: input.model,
          attachmentId: input.attachmentId,
        });
        return { messages };
      }),

    /** Clear the conversation */
    clear: protectedProcedure
      .input(z.object({ contractId: z.number().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        await clearChatMessages(ctx.user.id, input.contractId ?? null);
        return { success: true };
      }),
  }),

  // ─── Attachments (file & media storage) ─────────────────────────────────────
  attachments: router({
    /** List files attached to a contract */
    list: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract || (contract.userId !== ctx.user.id && ctx.user.role !== "admin")) return [];
        return getAttachmentsByContract(input.contractId);
      }),

    /** Upload a supporting file/media to a contract */
    upload: protectedProcedure
      .input(z.object({
        contractId: z.number(),
        fileName: z.string().min(1).max(400),
        mimeType: z.string().min(1),
        fileBase64: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract || (contract.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new Error("Unauthorized");
        }
        if (!ATTACHMENT_ALLOWED_MIME.includes(input.mimeType)) {
          throw new Error("Unsupported file type");
        }
        const buffer = Buffer.from(input.fileBase64, "base64");
        if (buffer.length === 0) throw new Error("Empty file");
        if (buffer.length > ATTACHMENT_MAX_BYTES) throw new Error("File too large");

        const safeName = input.fileName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_+/g, "_");
        const relKey = `attachments/${ctx.user.id}/${input.contractId}/${Date.now()}_${safeName}`;
        const { key, url } = await storagePut(relKey, buffer, input.mimeType);

        const id = await createAttachment({
          contractId: input.contractId,
          userId: ctx.user.id,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileKey: key,
          fileUrl: url,
          size: buffer.length,
        });
        return { id, fileUrl: url };
      }),

    /** Remove an attachment (owner or admin) */
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const att = await getAttachmentById(input.id);
        if (!att || (att.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new Error("Unauthorized");
        }
        await deleteAttachment(input.id);
        return { success: true };
      }),
  }),

  // ─── Reference Data ─────────────────────────────────────────────────────
  reference: router({
    legalSources: publicProcedure.query(() => LEGAL_SOURCES),
    riskCategories: publicProcedure.query(() => RISK_CATEGORIES),
    pricingPlans: publicProcedure.query(() => PRICING_PLANS),
  }),
});

export type AppRouter = typeof appRouter;
