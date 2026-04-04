import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  // TODO: get userId from auth session/token
  const { userId } = await request.json().catch(() => ({ userId: null }));

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDoc = await getAdminDb().doc(`users/${userId}`).get();
  const userData = userDoc.data();

  if (!userData?.stripeCustomerId) {
    return Response.json({ error: "No billing account" }, { status: 400 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: userData.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  });

  return Response.json({ url: session.url });
}
