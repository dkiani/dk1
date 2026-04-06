"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Download, Trash2, Shield, Bell, Globe, Wallet } from "lucide-react";

export default function JournalSettingsPage() {
  const { user, subscription } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [settings, setSettings] = useState({ defaultInstrument: "NQ", defaultAccount: "", dailyLossLimit: "", maxTradesPerDay: "3", timezone: "America/New_York" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) { setSettings((s) => ({ ...s, [e.target.name]: e.target.value })); }
  async function handleManageBilling() { const res = await fetch("/api/stripe/portal", { method: "POST" }); const { url } = await res.json(); window.location.href = url; }

  const inp = "w-full px-4 py-3 bg-bg-input border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[0.85rem] text-text-primary placeholder:text-text-tertiary focus:border-accent-teal/30 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.08)] outline-none transition-all duration-200";
  const lbl = "text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2";

  function Section({ icon: Icon, title, children, muted }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; muted?: boolean }) {
    return (
      <div className={`bg-bg-surface border border-border rounded-[16px] p-6 shadow-[var(--shadow-card)] relative overflow-hidden ${muted ? "opacity-50" : ""}`}>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(45,212,191,0.08)] to-transparent" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-[10px] bg-bg-elevated border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
            <Icon className="w-4 h-4 text-accent-teal" />
          </div>
          <h2 className="text-[0.95rem] font-semibold">{title}</h2>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5 max-w-[720px]">
      <h1 className="text-[1.5rem] font-bold tracking-[-0.02em]">Settings</h1>

      <Section icon={Globe} title="Trading Defaults">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Default Instrument</label><input name="defaultInstrument" value={settings.defaultInstrument} onChange={handleChange} className={inp} /></div>
            <div><label className={lbl}>Default Account</label><input name="defaultAccount" value={settings.defaultAccount} onChange={handleChange} placeholder="e.g. Prop Firm" className={inp} /></div>
          </div>
          <div><label className={lbl}>Timezone</label>
            <select name="timezone" value={settings.timezone} onChange={handleChange} className={inp}>
              <option value="America/New_York">Eastern (ET)</option><option value="America/Chicago">Central (CT)</option><option value="America/Los_Angeles">Pacific (PT)</option><option value="Europe/London">London (GMT)</option>
            </select>
          </div>
        </div>
      </Section>

      <Section icon={Shield} title="Risk Management">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Daily Loss Limit ($)</label><input name="dailyLossLimit" type="number" step="any" value={settings.dailyLossLimit} onChange={handleChange} placeholder="e.g. 500" className={`${inp} font-mono`} /></div>
          <div><label className={lbl}>Max Trades Per Day</label><input name="maxTradesPerDay" type="number" value={settings.maxTradesPerDay} onChange={handleChange} className={`${inp} font-mono`} /></div>
        </div>
      </Section>

      <Section icon={Wallet} title="Subscription">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.9rem] font-semibold capitalize">{subscription} Plan</p>
            <p className="text-[0.8rem] text-text-tertiary mt-0.5">{subscription === "free" ? "Upgrade to unlock all features" : subscription === "student" ? "$49/mo — Full journal" : "$249/mo — Full + AI coaching"}</p>
          </div>
          {subscription === "free" ? (
            <a href="/subscribe" className="px-5 py-2.5 bg-accent text-white text-[0.85rem] font-semibold rounded-[12px] hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,93,58,0.25)] transition-all duration-200 no-underline">Upgrade</a>
          ) : (
            <button onClick={handleManageBilling} className="px-5 py-2.5 bg-bg-elevated border border-border text-text-secondary text-[0.85rem] font-medium rounded-[12px] hover:text-text-primary hover:border-border-hover transition-all duration-200 cursor-pointer">Manage Billing</button>
          )}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" muted>
        <p className="text-[0.85rem] text-text-tertiary">Daily summaries and trade reminders — coming soon.</p>
      </Section>

      <Section icon={Download} title="Data">
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-elevated border border-border rounded-[12px] text-[0.85rem] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200 cursor-pointer">
            <Download className="w-4 h-4" />Export All Trades
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-red/20 text-red text-[0.85rem] font-medium rounded-[12px] hover:bg-red-bg hover:border-red/30 transition-all duration-200 cursor-pointer">
            <Trash2 className="w-4 h-4" />Delete All Data
          </button>
        </div>
        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-red-bg border border-red/20 rounded-[12px]">
            <p className="text-[0.85rem] text-red mb-3">This will permanently delete all your trades and data.</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-red text-white text-[0.8rem] font-semibold rounded-[10px] cursor-pointer border-0">Delete Everything</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary text-[0.8rem] rounded-[10px] cursor-pointer hover:text-text-primary transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </Section>

      {/* Account info */}
      <div className="bg-bg-surface border border-border rounded-[16px] p-6 shadow-[var(--shadow-card)]">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-3">Account</p>
        <div className="flex items-center justify-between py-2">
          <span className="text-[0.85rem] text-text-secondary">Email</span>
          <span className="text-[0.85rem] text-text-primary">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-[rgba(255,255,255,0.04)]">
          <span className="text-[0.85rem] text-text-secondary">User ID</span>
          <span className="text-[0.7rem] font-mono text-text-tertiary">{user?.uid?.slice(0, 12)}...</span>
        </div>
      </div>
    </div>
  );
}
