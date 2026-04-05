"use client";

import { ScanEye } from "lucide-react";

export default function ChartReviewPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-h1">AI Chart Review</h1>

      <div className="journal-card py-20 text-center">
        <ScanEye className="w-10 h-10 text-accent-teal mx-auto mb-4 opacity-60" />
        <h2 className="text-h2 text-text-primary mb-2">Chart Review Coming Soon</h2>
        <p className="text-body text-text-secondary max-w-md mx-auto mb-4">
          Upload chart screenshots for AI-powered trade analysis using ICT/Smart Money Concepts methodology.
        </p>
        <p className="text-small">
          You can already get AI reviews when logging a trade — use the &ldquo;AI Review&rdquo; tab on the{" "}
          <a href="/journal/new" className="text-accent-teal hover:underline">
            New Trade
          </a>{" "}
          page.
        </p>
      </div>
    </div>
  );
}
