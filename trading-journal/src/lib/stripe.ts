import Stripe from "stripe";
import { SubscriptionPlan } from "@/types";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-03-31.basil",
    });
  }
  return _stripe;
}

export const PLANS: Record<string, SubscriptionPlan> = {
  student: {
    tier: "student",
    name: "Student",
    price: 49,
    stripePriceId: process.env.STRIPE_STUDENT_PRICE_ID ?? "",
    features: [
      "Unlimited trade logging",
      "Chart screenshot uploads",
      "P&L calendar & analytics",
      "Journal entries",
      "Prop firm journal photos",
    ],
  },
  premium: {
    tier: "premium",
    name: "Premium",
    price: 249,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    features: [
      "Everything in Student",
      "AI trade analysis (Claude)",
      "Pattern detection",
      "Agentic coaching insights",
      "Rule tracking & compliance",
      "Priority support",
    ],
  },
};
