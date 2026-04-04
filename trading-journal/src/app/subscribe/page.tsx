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
      <div className="w-full max-w-[600px] animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase">journal.kiani.vc</span>
          </div>
          <h1 className="text-[18px] font-medium mb-2 tracking-tight">Choose your plan</h1>
          <p className="text-[11px] text-text-muted font-light">
            Start journaling your trades. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`bg-bg-card border rounded-[3px] p-5 relative transition-all duration-300 ${
                plan.popular ? "border-accent" : "border-border hover:border-border-hover"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-accent text-white text-[9px] uppercase tracking-[1px] font-medium">
                  Recommended
                </span>
              )}

              <h2 className="text-[12px] font-medium mb-1">{plan.name}</h2>
              <p className="text-[10px] text-text-muted font-light mb-4">{plan.description}</p>

              <div className="mb-5">
                <span className="text-[24px] font-medium">${plan.price}</span>
                <span className="text-[11px] text-text-muted font-light">/mo</span>
              </div>

              <ul className="space-y-2.5 mb-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-3 h-3 text-green mt-0.5 shrink-0" />
                    <span className="text-[11px] text-text-secondary font-light">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.tier)}
                className={`w-full py-2.5 rounded-[3px] text-[11px] font-medium transition-all duration-300 cursor-pointer border-0 ${
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
