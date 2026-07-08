import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
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
} from "./db";
import { storagePut } from "./storage";
import { analyzeContract } from "./analysis";
import { notifyOwner } from "./_core/notification";
import { LEGAL_SOURCES, RISK_CATEGORIES, PRICING_PLANS } from "@shared/types";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Contract Procedures ────────────────────────────────────────────────
  contracts: router({
    /** Upload and create a new contract */
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        mimeType: z.string(),
        fileBase64: z.string(),
        plan: z.enum(["basic", "standard", "premium", "audit"]),
        language: z.string().default("sk"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode file and upload to S3
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.mimeType.includes("pdf") ? "pdf" : "docx";
        const storageKey = `contracts/${ctx.user.id}/${Date.now()}_${input.fileName}`;

        const { key, url } = await storagePut(storageKey, fileBuffer, input.mimeType);

        // Create contract record
        const contractId = await createContract({
          userId: ctx.user.id,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileKey: key,
          fileUrl: url,
          plan: input.plan,
          language: input.language,
          status: "pending",
        });

        // Notify owner/lawyer about new submission
        await notifyOwner({
          title: "Nová zmluva na kontrolu",
          content: `Používateľ ${ctx.user.name || ctx.user.email || "ID:" + ctx.user.id} nahral zmluvu "${input.fileName}" (plán: ${input.plan}). Zmluva čaká na spracovanie.`,
        }).catch(err => console.error("[Notification] Failed:", err));

        // Start AI analysis in background (non-blocking)
        analyzeContract(contractId).catch(err =>
          console.error(`[Analysis] Failed for contract ${contractId}:`, err)
        );

        return { contractId, status: "pending" as const };
      }),

    /** Get user's contracts */
    myContracts: protectedProcedure.query(async ({ ctx }) => {
      return getContractsByUserId(ctx.user.id);
    }),

    /** Get a specific contract with clauses and report */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.id);
        if (!contract) return null;

        // Users can only see their own contracts (admins can see all)
        if (contract.userId !== ctx.user.id && ctx.user.role !== "admin") {
          return null;
        }

        const contractClauses = await getClausesByContractId(input.id);
        const report = await getReportByContractId(input.id);

        return { contract, clauses: contractClauses, report };
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

  // ─── Reference Data ─────────────────────────────────────────────────────
  reference: router({
    legalSources: publicProcedure.query(() => LEGAL_SOURCES),
    riskCategories: publicProcedure.query(() => RISK_CATEGORIES),
    pricingPlans: publicProcedure.query(() => PRICING_PLANS),
  }),
});

export type AppRouter = typeof appRouter;
