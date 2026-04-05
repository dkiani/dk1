"use client";

import { MessageSquare } from "lucide-react";

export default function CoachKPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-[1.5rem] font-bold tracking-[-0.02em] mb-6">Coach K</h1>
      <div className="bg-bg-surface border border-border rounded-[16px] py-20 text-center shadow-[var(--shadow-card)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(45,212,191,0.15)] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,93,58,0.02)_0%,transparent_60%)]" />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 flex items-center justify-center mx-auto mb-5">
            <span className="text-[1.2rem] font-bold text-accent">K</span>
          </div>
          <h2 className="text-[1.2rem] font-semibold mb-2">AI Trading Coach Coming Soon</h2>
          <p className="text-[0.9rem] text-text-secondary max-w-md mx-auto">
            Chat with Coach K — your AI trading mentor. Get personalized feedback on setups, psychology coaching, and ICT methodology guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
