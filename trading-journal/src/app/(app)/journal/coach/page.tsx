"use client";

import { MessageSquare } from "lucide-react";

export default function CoachKPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-h1">Coach K</h1>

      <div className="journal-card py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-orange-dim mx-auto mb-4 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-h2 text-text-primary mb-2">AI Trading Coach Coming Soon</h2>
        <p className="text-body text-text-secondary max-w-md mx-auto">
          Chat with Coach K — your AI trading mentor. Get personalized feedback on your setups,
          psychology coaching, and ICT methodology guidance.
        </p>
      </div>
    </div>
  );
}
