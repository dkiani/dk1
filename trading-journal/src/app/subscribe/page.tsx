"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

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
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-accent text-sm">●</span>
            <span className="text-[0.65rem] font-normal tracking-[0.06em] uppercase">journal.kiani.vc</span>
          </div>
          <h1 className="text-[1.1rem] font-normal tracking-[-0.02em] mb-2">Choose your plan</h1>
          <p className="text-[0.75rem] text-text-muted font-light">
            Start journaling your trades. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`bg-bg-surface border p-6 relative transition-colors duration-300 ${
                plan.popular ? "border-accent" : "border-border hover:border-border-hover"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-[0.55rem] uppercase tracking-[0.06em] font-normal">
                  Recommended
                </span>
              )}

              <h2 className="text-[0.8rem] font-normal mb-1">{plan.name}</h2>
              <p className="text-[0.65rem] text-text-muted font-light mb-4">{plan.description}</p>

              <div className="mb-5">
                <span className="text-[1.5rem] font-medium">${plan.price}</span>
                <span className="text-[0.75rem] text-text-muted font-light">/mo</span>
              </div>

              <ul className="space-y-2.5 mb-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green mt-0.5 shrink-0" />
                    <span className="text-[0.7rem] text-text-secondary font-light">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.tier)}
                className={`w-full py-[0.7rem] text-[0.7rem] tracking-[0.02em] font-normal transition-all duration-300 cursor-pointer ${
                  plan.popular
                    ? "bg-btn-bg text-btn-fg border-0 hover:opacity-85"
                    : "bg-transparent border border-border text-text-primary hover:border-border-hover"
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
