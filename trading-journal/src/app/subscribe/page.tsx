"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Check, TrendingUp } from "lucide-react";

const plans = [
  {
    tier: "student",
    name: "Student",
    price: 49,
    description: "Everything you need to journal your trades",
    features: [
      "Unlimited trade logging",
      "Chart screenshot uploads",
      "P&L calendar & analytics",
      "Journal entries",
      "Prop firm journal photos",
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    price: 249,
    description: "AI-powered coaching and advanced analytics",
    features: [
      "Everything in Student",
      "AI trade analysis (Claude)",
      "Pattern detection",
      "Agentic coaching insights",
      "Rule tracking & compliance",
      "Priority support",
    ],
    popular: true,
  },
];

export default function SubscribePage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleCheckout(tier: string) {
    if (!user) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, userId: user.uid, email: user.email }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold tracking-tight">journal.kiani.vc</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Choose your plan</h1>
          <p className="text-xs text-text-muted">
            Start journaling your trades. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`bg-bg-card border rounded-lg p-6 relative ${
                plan.popular ? "border-accent" : "border-border"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-[10px] uppercase tracking-wider rounded-full">
                  Most Popular
                </span>
              )}

              <h2 className="text-sm font-semibold mb-1">{plan.name}</h2>
              <p className="text-[10px] text-text-muted mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-2xl font-bold">${plan.price}</span>
                <span className="text-xs text-text-muted">/mo</span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green mt-0.5 shrink-0" />
                    <span className="text-xs text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.tier)}
                className={`w-full py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  plan.popular
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-bg-input border border-border text-text-primary hover:border-accent"
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
