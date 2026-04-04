"use client";

import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, subscription } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-[1.1rem] font-normal tracking-[-0.02em] mb-8">Settings</h1>

      <div className="space-y-4">
        {/* Account */}
        <section className="bg-bg-surface border border-border p-6">
          <h2 className="text-[0.6rem] uppercase tracking-[0.06em] text-text-muted font-light mb-4">
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] text-text-secondary font-light">Email</span>
              <span className="text-[0.75rem] text-text-primary">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] text-text-secondary font-light">User ID</span>
              <span className="text-[0.65rem] text-text-muted font-light">{user?.uid}</span>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-bg-surface border border-border p-6">
          <h2 className="text-[0.6rem] uppercase tracking-[0.06em] text-text-muted font-light mb-4">
            Subscription
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[0.8rem] font-normal text-text-primary capitalize">{subscription} Plan</p>
              <p className="text-[0.65rem] text-text-muted mt-0.5 font-light">
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
                className="px-4 py-2 bg-btn-bg text-btn-fg text-[0.7rem] tracking-[0.02em] font-normal hover:opacity-85 transition-opacity duration-300 no-underline"
              >
                Upgrade
              </a>
            ) : (
              <button
                onClick={handleManageBilling}
                className="px-4 py-2 bg-transparent border border-border text-text-muted text-[0.7rem] tracking-[0.02em] font-light hover:text-text-primary hover:border-border-hover transition-colors duration-300 cursor-pointer"
              >
                Manage Billing
              </button>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-bg-surface border border-border p-6">
          <h2 className="text-[0.6rem] uppercase tracking-[0.06em] text-text-muted font-light mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-[14px] h-[14px] text-text-muted" />
              ) : (
                <Sun className="w-[14px] h-[14px] text-text-muted" />
              )}
              <span className="text-[0.75rem] text-text-secondary font-light">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-10 h-5 rounded-full transition-colors duration-150 cursor-pointer border-0 ${
                theme === "dark" ? "bg-text-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-[2px] w-4 h-4 bg-bg-primary rounded-full transition-transform duration-150 ${
                  theme === "dark" ? "left-[22px]" : "left-[2px]"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Tradovate Integration */}
        <section className="bg-bg-surface border border-border p-6 opacity-40">
          <h2 className="text-[0.6rem] uppercase tracking-[0.06em] text-text-muted font-light mb-4">
            Tradovate Integration
          </h2>
          <p className="text-[0.75rem] text-text-muted font-light">
            Coming soon — Connect your Tradovate account to auto-import trades.
          </p>
        </section>
      </div>
    </div>
  );
}
