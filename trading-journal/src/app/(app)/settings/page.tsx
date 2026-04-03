"use client";

import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, CreditCard, Link as LinkIcon, Shield } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, subscription } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Account */}
        <section className="bg-bg-card border border-border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Email</span>
              <span className="text-xs text-text-primary">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">User ID</span>
              <span className="text-[10px] text-text-muted font-mono">{user?.uid}</span>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-bg-card border border-border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            Subscription
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-text-primary capitalize">{subscription} Plan</p>
              <p className="text-[10px] text-text-muted mt-0.5">
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
                className="px-4 py-2 bg-accent text-white rounded-md text-xs hover:bg-accent-hover transition-colors no-underline"
              >
                Upgrade
              </a>
            ) : (
              <button
                onClick={handleManageBilling}
                className="px-4 py-2 bg-bg-input border border-border text-text-secondary rounded-md text-xs hover:text-text-primary transition-colors cursor-pointer"
              >
                Manage Billing
              </button>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-bg-card border border-border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-text-secondary" />
              ) : (
                <Sun className="w-4 h-4 text-text-secondary" />
              )}
              <span className="text-xs text-text-secondary">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                theme === "dark" ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  theme === "dark" ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Tradovate Integration (future) */}
        <section className="bg-bg-card border border-border rounded-lg p-5 opacity-60">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5" />
            Tradovate Integration
          </h2>
          <p className="text-xs text-text-muted">
            Coming soon — Connect your Tradovate account to auto-import trades.
          </p>
        </section>
      </div>
    </div>
  );
}
