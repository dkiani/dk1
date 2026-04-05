"use client";

import { ScanEye, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ChartReviewPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-[1.5rem] font-bold tracking-[-0.02em] mb-6">AI Chart Review</h1>
      <div className="bg-bg-surface border border-border rounded-[16px] py-20 text-center shadow-[var(--shadow-card)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(45,212,191,0.15)] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.03)_0%,transparent_60%)]" />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-accent-teal/15 to-accent-teal/5 border border-accent-teal/15 flex items-center justify-center mx-auto mb-5">
            <ScanEye className="w-7 h-7 text-accent-teal" />
          </div>
          <h2 className="text-[1.2rem] font-semibold mb-2">Chart Review Coming Soon</h2>
          <p className="text-[0.9rem] text-text-secondary max-w-md mx-auto mb-6">
            Upload chart screenshots for AI-powered trade analysis using ICT/Smart Money Concepts methodology.
          </p>
          <Link href="/journal/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-teal to-[#14b8a6] text-text-inverse text-[0.85rem] font-semibold rounded-[12px] shadow-[0_2px_12px_rgba(45,212,191,0.2)] hover:shadow-[var(--shadow-glow-teal)] hover:-translate-y-[1px] transition-all duration-200 no-underline">
            Try AI Review on New Trade <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
