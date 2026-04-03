import { NextRequest } from "next/server";
import { getStripe, PLANS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const { tier, userId, email } = await request.json();

  const plan = PLANS[tier];
  if (!plan) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      tier,
    },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/subscribe?checkout=cancelled`,
  });

  return Response.json({ url: session.url });
}
