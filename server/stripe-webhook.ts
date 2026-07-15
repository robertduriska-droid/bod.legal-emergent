import express, { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { updateContractStatus, getContractById, createNotification, updateUserStripeCustomerId, activateTrial } from "./db";
import { analyzeContract } from "./analysis";
import { notifyOwner } from "./_core/notification";

/**
 * Register the Stripe webhook endpoint.
 * MUST be registered BEFORE express.json() middleware.
 */
export function registerStripeWebhook(app: express.Express) {
  // Self-host: Stripe is optional at boot. Without a secret key the Stripe
  // constructor throws, which would crash the whole server — so skip
  // registering the webhook and let the rest of the app come up. Payments are
  // simply inactive until STRIPE_SECRET_KEY is set.
  if (!ENV.stripeSecretKey) {
    console.warn(
      "[Stripe] STRIPE_SECRET_KEY not set — webhook disabled, payments inactive.",
    );
    return;
  }

  const stripe = new Stripe(ENV.stripeSecretKey);

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          ENV.stripeWebhookSecret
        );
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle test events for webhook verification
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const contractId = session.metadata?.contract_id;
            const userId = session.metadata?.user_id;

            // Free-trial card setup (no charge): activate the 15-day trial.
            if (session.mode === "setup" || session.metadata?.purpose === "trial") {
              if (userId) {
                let paymentMethodId: string | null = null;
                const siId = typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;
                if (siId) {
                  try {
                    const si = await stripe.setupIntents.retrieve(siId);
                    paymentMethodId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id ?? null;
                  } catch (e: any) {
                    console.warn("[Stripe Webhook] setupIntent retrieve failed:", e.message);
                  }
                }
                if (session.customer) {
                  const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
                  updateUserStripeCustomerId(parseInt(userId), customerId).catch(() => {});
                }
                await activateTrial(parseInt(userId), paymentMethodId)
                  .catch(err => console.error("[Trial] activate failed:", err));
                await createNotification({
                  userId: parseInt(userId),
                  title: "Skúšobná verzia aktivovaná",
                  message: "Vaša 15-dňová skúšobná verzia je aktívna. Máte 1 bezplatnú analýzu zmluvy.",
                  type: "system",
                }).catch(() => {});
                console.log(`[Stripe Webhook] Trial activated for user ${userId}`);
              }
              break;
            }

            // Store Stripe customer ID on user record
            if (userId && session.customer) {
              const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
              updateUserStripeCustomerId(parseInt(userId), customerId)
                .catch(err => console.warn('[Stripe Webhook] Failed to store customer ID:', err));
            }

            if (contractId) {
              const contract = await getContractById(parseInt(contractId));
              if (contract && contract.status === "pending") {
                console.log(`[Stripe Webhook] Payment confirmed for contract ${contractId}, starting analysis`);

                // Notify owner about paid contract
                await notifyOwner({
                  title: "Platba prijatá - nová zmluva",
                  content: `Platba za zmluvu "${contract.fileName}" (plán: ${contract.plan}) bola úspešne prijatá. Analýza sa spúšťa automaticky.`,
                }).catch(err => console.error("[Notification] Failed:", err));

                // Notify user about payment received
                await createNotification({
                  userId: contract.userId,
                  title: "Platba prijatá",
                  message: `Platba za analýzu zmluvy "${contract.fileName}" bola úspešne spracovaná. Analýza sa začína.`,
                  type: "payment_received",
                  contractId: contract.id,
                }).catch(err => console.error("[Notification] Failed to create:", err));

                // Start AI analysis
                analyzeContract(parseInt(contractId)).catch(err =>
                  console.error(`[Analysis] Failed for contract ${contractId}:`, err)
                );
              }
            }
            break;
          }

          case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
            break;
          }

          case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const contractId = paymentIntent.metadata?.contract_id;
            console.log(`[Stripe Webhook] Payment failed for contract ${contractId}: ${paymentIntent.last_payment_error?.message}`);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err: any) {
        console.error(`[Stripe Webhook] Error processing event ${event.type}:`, err);
      }

      res.json({ received: true });
    }
  );
}
