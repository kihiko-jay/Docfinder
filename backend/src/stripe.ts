import { onCall, onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";
import { db } from "./firebase.js";
import { requireField } from "./utils/validation.js";

// Lazy initialization of Stripe to avoid module load errors
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey || apiKey === "sk_test_placeholder_key") {
      throw new Error("STRIPE_SECRET_KEY not configured. Please set a valid Stripe API key.");
    }
    stripe = new Stripe(apiKey);
  }
  return stripe;
}

export const createPaymentIntent = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }
  const amount = requireField(request.data?.amount, "amount");
  const documentId = requireField(request.data?.documentId, "documentId");
  const userId = request.auth.uid;

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "kes",
    metadata: { documentId, userId },
  });

  const paymentRef = db.collection("payments").doc();
  await paymentRef.set({
    id: paymentRef.id,
    documentId,
    amount,
    method: "stripe",
    status: "pending",
    transactionId: paymentIntent.id,
    userId,
    createdAt: Date.now(),
  });

  return { clientSecret: paymentIntent.client_secret, paymentId: paymentRef.id };
});

export const stripeWebhook = onRequest(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = requireField(
    process.env.STRIPE_WEBHOOK_SECRET,
    "STRIPE_WEBHOOK_SECRET"
  );

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.rawBody,
      signature as string,
      webhookSecret
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    res.status(400).send("Webhook Error");
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentQuery = await db
      .collection("payments")
      .where("transactionId", "==", paymentIntent.id)
      .limit(1)
      .get();

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0];
      const paymentData = paymentDoc.data();

      await paymentDoc.ref.update({
        status: "completed",
        completedAt: Date.now(),
      });

      await db.collection("unlocked_contacts").add({
        userId: paymentData.userId,
        documentId: paymentData.documentId,
        paymentId: paymentDoc.id,
        unlockedAt: Date.now(),
      });
    }
  }

  res.json({ received: true });
});
