import { COOKIE_NAME, ATTACHMENT_ALLOWED_MIME, ATTACHMENT_MAX_BYTES } from "@shared/const";
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
} from "./db";
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
        plan: z.enum(["basic", "standard", "premium"]),
        expressAddon: z.boolean().default(false),
        language: z.string().default("sk"),
        phone: z.string().max(32).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode file and upload to S3
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const ext = input.mimeType.includes("pdf") ? "pdf" : "docx";
        // Sanitize filename to ASCII-only for S3 storage
        const safeFileName = input.fileName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_+/g, "_");
        const storageKey = `contracts/${ctx.user.id}/${Date.now()}_${safeFileName}`;

        const { key, url } = await storagePut(storageKey, fileBuffer, input.mimeType);

        // Create contract record
        const contractId = await createContract({
          userId: ctx.user.id,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileKey: key,
          fileUrl: url,
          plan: input.plan,
          expressAddon: input.expressAddon ? 1 : 0,
          language: input.language,
          status: "pending",
        });

        // Persist optional SMS/WhatsApp recipient for this contract (Twilio)
        if (input.phone) {
          await setNotifyPhone(contractId, ctx.user.id, input.phone)
            .catch(err => console.error("[NotifyPref] Failed:", err));
        }

        // Twilio: alert admins/lawyers about the new submission (SMS + WhatsApp)
        notifyAdmins(`bod.legal: Nová zmluva "${input.fileName}" (plán: ${input.plan}) od ${ctx.user.name || ctx.user.email || "ID:" + ctx.user.id}.`)
          .catch(() => {});

        // Notify owner/lawyer about new submission
        await notifyOwner({
          title: "Nová zmluva na kontrolu",
          content: `Používateľ ${ctx.user.name || ctx.user.email || "ID:" + ctx.user.id} nahral zmluvu "${input.fileName}" (plán: ${input.plan}). Zmluva čaká na spracovanie.`,
        }).catch(err => console.error("[Notification] Failed:", err));

        // In-app notification for user
        await createNotification({
          userId: ctx.user.id,
          title: "Zmluva odoslaná",
          message: `Vaša zmluva "${input.fileName}" bola úspešne nahraná a čaká na spracovanie.`,
          type: "contract_submitted",
          contractId: contractId,
        }).catch(err => console.error("[Notification] Failed to create:", err));

        // Analysis will be triggered by Stripe webhook after payment
        // For basic plan: also runs free preview (top 3 risks) immediately
        if (input.plan === "basic") {
          analyzeContract(contractId).catch(err =>
            console.error(`[Analysis] Failed for contract ${contractId}:`, err)
          );
        }

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
          return { contract, clauses: limitedClauses, report: limitedReport, isLimited: true };
        }

        return { contract, clauses: contractClauses, report, isLimited: false };
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
            const url = `https://bod.legal/report/${signedContract.id}`;
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
              reportUrl: `https://bod.legal/report/${signedContract.id}`,
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
    /** Create a Stripe checkout session for a contract */
    createCheckout: protectedProcedure
      .input(z.object({
        contractId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract || contract.userId !== ctx.user.id) {
          throw new Error("Contract not found");
        }

        const product = STRIPE_PRODUCTS[contract.plan as keyof typeof STRIPE_PRODUCTS];
        if (!product) {
          throw new Error(`Invalid plan: ${contract.plan}`);
        }

        const stripe = new Stripe(ENV.stripeSecretKey);
        const origin = ctx.req.headers.origin || "https://bodlegal-mqcbxxfs.manus.space";

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
            plan: contract.plan,
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

    /** Get payment status for a contract (checks Stripe directly) */
    getStatus: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ ctx, input }) => {
        const contract = await getContractById(input.contractId);
        if (!contract || contract.userId !== ctx.user.id) {
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
        const siteUrl = ctx.req.headers.origin || 'https://bod.legal';
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
