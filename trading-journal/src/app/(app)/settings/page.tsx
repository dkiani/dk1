"use client";

import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, CreditCard, Link as LinkIcon } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, subscription } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="max-w-[720px] animate-fade-in">
      <h1 className="text-[13px] font-medium tracking-tight mb-10">Settings</h1>

      <div className="space-y-4">
        {/* Account */}
        <section className="bg-bg-card border border-border rounded-[3px] p-5">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted mb-4">
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted font-light">Email</span>
              <span className="text-[11px] text-text-primary font-light">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted font-light">User ID</span>
              <span className="text-[10px] text-text-muted font-light">{user?.uid}</span>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-bg-card border border-border rounded-[3px] p-5">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted mb-4 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            Subscription
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[12px] font-medium text-text-primary capitalize">{subscription} Plan</p>
              <p className="text-[10px] text-text-muted mt-0.5 font-light">
                {subscription === "free"
                  ? "Upgrade to access all features"
                  : subscription === "student"
                    ? "$49/mo — Full trade journal access"
                    : "$249/mo — Full access + AI coaching"}
              </p>
            </div>
            {subscription === "free" ? (
              <a
                href="/subscribe"
                className="px-3.5 py-1.5 bg-accent text-white rounded-[3px] text-[11px] font-medium hover:bg-accent-hover transition-all duration-300 no-underline"
              >
                Upgrade
              </a>
            ) : (
              <button
                onClick={handleManageBilling}
                className="px-3.5 py-1.5 bg-transparent border border-border text-text-secondary rounded-[3px] text-[11px] font-light hover:text-text-primary hover:border-border-hover transition-all duration-300 cursor-pointer"
              >
                Manage Billing
              </button>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-bg-card border border-border rounded-[3px] p-5">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-3.5 h-3.5 text-text-muted" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-text-muted" />
              )}
              <span className="text-[11px] text-text-secondary font-light">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-9 h-[18px] rounded-full transition-colors duration-300 cursor-pointer border-0 ${
                theme === "dark" ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full transition-transform duration-300 ${
                  theme === "dark" ? "left-[18px]" : "left-[2px]"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Tradovate Integration (future) */}
        <section className="bg-bg-card border border-border rounded-[3px] p-5 opacity-40">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted mb-4 flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5" />
            Tradovate Integration
          </h2>
          <p className="text-[11px] text-text-muted font-light">
            Coming soon — Connect your Tradovate account to auto-import trades.
          </p>
        </section>
      </div>
    </div>
  );
}
