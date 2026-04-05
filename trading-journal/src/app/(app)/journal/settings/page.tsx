"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

export default function JournalSettingsPage() {
  const { user, subscription } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Settings form state
  const [settings, setSettings] = useState({
    defaultInstrument: "NQ",
    defaultAccount: "",
    dailyLossLimit: "",
    maxTradesPerDay: "3",
    timezone: "America/New_York",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setSettings((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url;
  }

  const inputClass =
    "w-full px-3 py-[0.65rem] bg-bg-input border border-border text-[0.85rem] font-mono text-text-primary placeholder:text-text-tertiary focus:border-accent-teal focus:shadow-[0_0_0_2px_var(--accent-teal-dim)] outline-none transition-all duration-150 rounded-[var(--radius-sm)]";
  const labelClass = "text-label block mb-1.5";

  return (
    <div className="animate-fade-in space-y-6 max-w-[700px]">
      <h1 className="text-h1">Settings</h1>

      {/* Trading Defaults */}
      <div className="journal-card">
        <h2 className="text-label text-accent-teal mb-5">Trading Defaults</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Default Instrument</label>
              <input
                name="defaultInstrument"
                value={settings.defaultInstrument}
                onChange={handleChange}
                placeholder="NQ, ES..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Default Account</label>
              <input
                name="defaultAccount"
                value={settings.defaultAccount}
                onChange={handleChange}
                placeholder="e.g. Prop Firm"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <select name="timezone" value={settings.timezone} onChange={handleChange} className={inputClass}>
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk Management */}
      <div className="journal-card">
        <h2 className="text-label text-accent-teal mb-5">Risk Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Daily Loss Limit ($)</label>
            <input
              name="dailyLossLimit"
              type="number"
              step="any"
              value={settings.dailyLossLimit}
              onChange={handleChange}
              placeholder="e.g. 500"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max Trades Per Day</label>
            <input
              name="maxTradesPerDay"
              type="number"
              value={settings.maxTradesPerDay}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="journal-card">
        <h2 className="text-label text-accent-teal mb-5">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-body text-text-secondary">Email</span>
            <span className="text-data text-text-primary">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-body text-text-secondary">User ID</span>
            <span className="text-[0.7rem] font-mono text-text-tertiary">{user?.uid}</span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="journal-card">
        <h2 className="text-label text-accent-teal mb-5">Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body text-text-primary capitalize font-medium">{subscription} Plan</p>
            <p className="text-small mt-1">
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
              className="px-4 py-2.5 bg-accent text-white text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:bg-accent-hover transition-all duration-150 no-underline"
            >
              Upgrade
            </a>
          ) : (
            <button
              onClick={handleManageBilling}
              className="px-4 py-2.5 bg-transparent border border-border text-text-secondary text-[0.8rem] font-sans rounded-[var(--radius-sm)] hover:text-text-primary hover:border-border-hover transition-all duration-150 cursor-pointer"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Notifications (stub) */}
      <div className="journal-card opacity-50">
        <h2 className="text-label text-accent-teal mb-5">Notifications</h2>
        <p className="text-body text-text-tertiary">
          Daily summary emails and trade reminders — coming soon.
        </p>
      </div>

      {/* Data */}
      <div className="journal-card">
        <h2 className="text-label text-accent-teal mb-5">Data</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-border text-text-secondary text-[0.8rem] font-sans rounded-[var(--radius-sm)] hover:text-text-primary hover:border-border-hover transition-all duration-150 cursor-pointer">
            <Download className="w-4 h-4" />
            Export All Trades (CSV)
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-red/30 text-red text-[0.8rem] font-sans rounded-[var(--radius-sm)] hover:bg-red-bg hover:border-red/50 transition-all duration-150 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete All Data
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-red-bg border border-red/20 rounded-[var(--radius-md)]">
            <p className="text-body text-red mb-3">
              Are you sure? This will permanently delete all your trades and journal data.
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-red text-white text-[0.8rem] font-sans rounded-[var(--radius-sm)] cursor-pointer border-0 hover:opacity-90 transition-opacity">
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-transparent border border-border text-text-secondary text-[0.8rem] font-sans rounded-[var(--radius-sm)] cursor-pointer hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Broker Integration */}
      <div className="journal-card opacity-50">
        <h2 className="text-label text-accent-teal mb-5">Broker Integration</h2>
        <p className="text-body text-text-tertiary">
          Connect Tradovate, Rithmic, or other brokers to auto-import trades — coming soon.
        </p>
      </div>
    </div>
  );
}
