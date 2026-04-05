"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getTrade, deleteTrade } from "@/lib/trades";
import { Trade } from "@/types";
import {
  ArrowLeft,
  Trash2,
  Brain,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

export default function TradeDetailPage() {
  const { user, subscription } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    getTrade(id).then((t) => {
      setTrade(t);
      setLoading(false);
    });
  }, [params.id]);

  async function handleDelete() {
    if (!trade || !confirm("Delete this trade? This cannot be undone.")) return;
    setDeleting(true);
    await deleteTrade(trade.id);
    router.push("/journal/trades");
  }

  async function handleAiAnalysis() {
    if (!trade) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch {
      setAiAnalysis("Failed to get AI analysis. Please try again.");
    }
    setAnalyzing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="text-center py-12">
        <p className="text-body text-text-secondary">Trade not found</p>
        <Link href="/journal/trades" className="text-body text-accent-teal hover:underline mt-2 block no-underline">
          Back to journal
        </Link>
      </div>
    );
  }

  const isWin = (trade.pnl ?? 0) > 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-bg-surface-hover rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-[0.7rem] font-mono uppercase px-2.5 py-1 rounded-[var(--radius-sm)] ${
              trade.direction === "long" ? "bg-green-bg text-green" : "bg-red-bg text-red"
            }`}>
              {trade.direction === "long" ? "▲" : "▼"} {trade.direction}
            </span>
            <h1 className="text-h1">{trade.symbol}</h1>
            <span className={`text-[0.7rem] font-mono uppercase px-2.5 py-1 rounded-[var(--radius-sm)] border ${
              trade.status === "open" ? "border-accent-teal/30 text-accent-teal" : "border-border text-text-tertiary"
            }`}>
              {trade.status}
            </span>
            {trade.setupGrade && (
              <span className={`text-[0.7rem] font-mono px-2.5 py-1 rounded-[var(--radius-sm)] ${
                trade.setupGrade === "A+" ? "bg-accent-teal-dim text-accent-teal" :
                trade.setupGrade === "A" ? "bg-green-bg text-green" :
                trade.setupGrade === "B" ? "bg-[rgba(234,179,8,0.12)] text-yellow" :
                "bg-red-bg text-red"
              }`}>
                {trade.setupGrade}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscription === "premium" && (
            <button
              onClick={handleAiAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-border text-[0.8rem] font-sans text-text-secondary hover:text-text-primary hover:border-border-hover rounded-[var(--radius-sm)] transition-all duration-150 cursor-pointer disabled:opacity-40"
            >
              <Brain className="w-4 h-4" />
              {analyzing ? "Analyzing..." : "AI Analysis"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2.5 bg-transparent border border-border text-red hover:bg-red-bg hover:border-red/30 rounded-[var(--radius-sm)] transition-all duration-150 cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* P&L Banner */}
      {trade.pnl !== undefined && (
        <div className="journal-card">
          <div className="flex items-center gap-2 mb-1">
            {isWin ? (
              <TrendingUp className="w-5 h-5 text-green" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red" />
            )}
            <span className="text-label">Realized P&L</span>
          </div>
          <p className={`text-stat-value ${isWin ? "text-green" : "text-red"}`}>
            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
            {trade.pnlPercent && (
              <span className="text-body ml-3 text-text-secondary">({trade.pnlPercent.toFixed(2)}%)</span>
            )}
          </p>
        </div>
      )}

      {/* Trade Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <DetailCard label="Entry Price" value={`$${trade.entryPrice.toFixed(2)}`} />
        <DetailCard label="Exit Price" value={trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "\u2014"} />
        <DetailCard label="Quantity" value={String(trade.quantity)} />
        <DetailCard label="Stop Loss" value={trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : "\u2014"} />
        <DetailCard label="Take Profit" value={trade.takeProfit ? `$${trade.takeProfit.toFixed(2)}` : "\u2014"} />
        <DetailCard label="Fees" value={trade.fees ? `$${trade.fees.toFixed(2)}` : "\u2014"} />
        <DetailCard label="Entry Time" value={new Date(trade.entryTime).toLocaleString()} />
        <DetailCard label="Exit Time" value={trade.exitTime ? new Date(trade.exitTime).toLocaleString() : "\u2014"} />
        <DetailCard label="Setup Type" value={trade.setupType || trade.strategy || "\u2014"} />
        <DetailCard label="Session" value={trade.session || "\u2014"} />
        <DetailCard label="Timeframe" value={trade.timeFrame || "\u2014"} />
        <DetailCard label="Account" value={trade.account || "\u2014"} />
      </div>

      {/* Tags */}
      {trade.tags && trade.tags.length > 0 && (
        <div className="journal-card">
          <span className="text-label">Tags</span>
          <div className="flex flex-wrap gap-2 mt-3">
            {trade.tags.map((tag) => (
              <span
                key={tag}
                className="text-[0.75rem] font-mono px-3 py-1 bg-bg-elevated border border-border rounded-[var(--radius-sm)] text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Screenshots */}
      {trade.screenshots && trade.screenshots.length > 0 && (
        <div>
          <h2 className="text-label mb-4">Chart Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trade.screenshots.map((ss) => (
              <div key={ss.id} className="journal-card !p-0 overflow-hidden">
                <img src={ss.url} alt={ss.caption || "Chart"} className="w-full h-48 object-cover" />
                {ss.caption && <p className="text-small px-4 py-2">{ss.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="journal-card">
          <h2 className="text-label mb-3">Notes</h2>
          <p className="text-body text-text-secondary whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {/* AI Analysis (text-based) */}
      {aiAnalysis && (
        <div className="journal-card !border-accent-teal/20">
          <h2 className="text-label text-accent-teal mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Analysis
          </h2>
          <p className="text-body text-text-secondary whitespace-pre-wrap">{aiAnalysis}</p>
        </div>
      )}

      {/* AI Chart Review (vision-based) */}
      {trade.aiReview && (
        <div>
          <h2 className="text-label mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-teal" />
            AI Chart Review
          </h2>
          {trade.aiReview.imageUrl && (
            <img
              src={trade.aiReview.imageUrl}
              alt="Reviewed chart"
              className="w-full max-h-[400px] object-contain border border-border rounded-[var(--radius-md)] mb-4"
            />
          )}
          <div className="journal-card mb-4">
            <p className="text-body text-text-secondary whitespace-pre-wrap leading-relaxed">
              {trade.aiReview.analysis}
            </p>
          </div>
          {trade.aiReview.chatHistory.length > 2 && (
            <div className="journal-card !p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <span className="text-label">Follow-up Discussion</span>
              </div>
              {trade.aiReview.chatHistory.slice(2).map((msg, i) => (
                <div
                  key={i}
                  className={`px-5 py-4 border-b border-border last:border-b-0 ${
                    msg.role === "user" ? "bg-bg-elevated" : ""
                  }`}
                >
                  <span className="text-[0.6rem] font-mono uppercase tracking-[0.1em] text-text-tertiary">
                    {msg.role === "user" ? "You" : "AI Coach"}
                  </span>
                  <p className="text-body text-text-secondary mt-1 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="journal-card">
      <span className="text-label">{label}</span>
      <p className="text-data text-text-primary mt-1.5">{value}</p>
    </div>
  );
}
