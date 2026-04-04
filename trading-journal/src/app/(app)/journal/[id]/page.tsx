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
    router.push("/journal");
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
        <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="text-center py-12">
        <p className="text-[0.85rem] text-text-muted">Trade not found</p>
        <Link href="/journal" className="text-[0.8rem] text-accent hover:text-accent-hover mt-2 block no-underline transition-colors duration-150">
          Back to journal
        </Link>
      </div>
    );
  }

  const isWin = (trade.pnl ?? 0) > 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-[4px] hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft className="w-[14px] h-[14px] text-text-secondary" />
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-[0.65rem] uppercase font-medium px-2 py-1 rounded-[4px] tracking-[0.1em] ${
              trade.direction === "long" ? "bg-green-bg text-green" : "bg-red-bg text-red"
            }`}>
              {trade.direction}
            </span>
            <h1 className="text-[1.5rem] font-medium">{trade.symbol}</h1>
            <span className={`text-[0.65rem] uppercase px-2 py-1 rounded-[4px] border tracking-[0.1em] ${
              trade.status === "open" ? "border-accent text-accent" : "border-border text-text-muted"
            }`}>
              {trade.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscription === "premium" && (
            <button
              onClick={handleAiAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-3 py-2 bg-transparent border border-border rounded-[4px] text-[0.75rem] text-text-secondary hover:text-accent hover:border-accent transition-colors duration-150 cursor-pointer disabled:opacity-40"
            >
              <Brain className="w-[14px] h-[14px]" />
              {analyzing ? "Analyzing..." : "AI Analysis"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-border rounded-[4px] text-[0.75rem] text-red hover:bg-red-bg hover:border-red transition-colors duration-150 cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-[14px] h-[14px]" />
          </button>
        </div>
      </div>

      {/* P&L Banner */}
      {trade.pnl !== undefined && (
        <div className="bg-bg-surface border border-border rounded-[6px] p-6 mb-8">
          <div className="flex items-center gap-2 mb-1">
            {isWin ? (
              <TrendingUp className="w-[14px] h-[14px] text-green" />
            ) : (
              <TrendingDown className="w-[14px] h-[14px] text-red" />
            )}
            <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary">
              Realized P&L
            </span>
          </div>
          <p className={`text-[1.8rem] font-semibold leading-tight ${isWin ? "text-green" : "text-red"}`}>
            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
            {trade.pnlPercent && (
              <span className="text-[0.8rem] ml-2 font-normal text-text-secondary">({trade.pnlPercent.toFixed(2)}%)</span>
            )}
          </p>
        </div>
      )}

      {/* Trade Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DetailCard label="Entry Price" value={`$${trade.entryPrice.toFixed(2)}`} />
        <DetailCard label="Exit Price" value={trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "\u2014"} />
        <DetailCard label="Quantity" value={String(trade.quantity)} />
        <DetailCard label="Fees" value={trade.fees ? `$${trade.fees.toFixed(2)}` : "\u2014"} />
        <DetailCard label="Entry Time" value={new Date(trade.entryTime).toLocaleString()} />
        <DetailCard label="Exit Time" value={trade.exitTime ? new Date(trade.exitTime).toLocaleString() : "\u2014"} />
        <DetailCard label="Strategy" value={trade.strategy || "\u2014"} />
        <DetailCard label="Time Frame" value={trade.timeFrame || "\u2014"} />
        <DetailCard label="Asset Class" value={trade.assetClass} />
        {trade.tags && trade.tags.length > 0 && (
          <div className="bg-bg-surface border border-border rounded-[6px] p-6">
            <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary">Tags</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {trade.tags.map((tag) => (
                <span key={tag} className="text-[0.7rem] px-2 py-1 bg-bg-surface-hover border border-border rounded-[4px] text-text-secondary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screenshots */}
      {trade.screenshots && trade.screenshots.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[0.7rem] uppercase tracking-[0.12em] text-text-secondary mb-4">
            Chart Screenshots
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {trade.screenshots.map((ss) => (
              <div key={ss.id}>
                <img src={ss.url} alt={ss.caption || "Chart screenshot"} className="w-full h-48 object-cover rounded-[6px] border border-border" />
                {ss.caption && <p className="text-[0.7rem] text-text-muted mt-1">{ss.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="mb-8">
          <h2 className="text-[0.7rem] uppercase tracking-[0.12em] text-text-secondary mb-4">Notes</h2>
          <div className="bg-bg-surface border border-border rounded-[6px] p-6">
            <p className="text-[0.85rem] text-text-secondary whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="mb-8">
          <h2 className="text-[0.7rem] uppercase tracking-[0.12em] text-text-secondary mb-4 flex items-center gap-2">
            <Brain className="w-[14px] h-[14px] text-accent" />
            AI Analysis
          </h2>
          <div className="bg-bg-surface border border-border rounded-[6px] p-6">
            <p className="text-[0.85rem] text-text-secondary whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-surface border border-border rounded-[6px] p-6">
      <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary">{label}</span>
      <p className="text-[0.85rem] font-medium text-text-primary mt-1">{value}</p>
    </div>
  );
}
