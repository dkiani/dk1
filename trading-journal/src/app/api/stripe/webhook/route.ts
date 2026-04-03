import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;

      if (userId && tier) {
        await getAdminDb().doc(`journalUsers/${userId}`).update({
          subscription: tier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by stripeCustomerId
      const snapshot = await getAdminDb()
        .collection("journalUsers")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const status = subscription.status;

        if (status === "active") {
          // Check which price to determine tier
          const priceId = subscription.items.data[0]?.price?.id;
          const tier =
            priceId === process.env.STRIPE_PREMIUM_PRICE_ID ? "premium" : "student";
          await userDoc.ref.update({ subscription: tier });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const snapshot = await getAdminDb()
        .collection("journalUsers")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          subscription: "free",
          stripeSubscriptionId: null,
        });
      }
      break;
    }
  }

  return Response.json({ received: true });
}
