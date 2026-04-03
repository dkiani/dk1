"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getTrade, deleteTrade } from "@/lib/trades";
import { Trade } from "@/types";
import {
  ArrowLeft,
  Trash2,
  Edit,
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
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
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Trade not found</p>
        <Link href="/journal" className="text-xs text-accent hover:underline mt-2 block">
          Back to journal
        </Link>
      </div>
    );
  }

  const isWin = (trade.pnl ?? 0) > 0;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-md hover:bg-bg-tertiary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </button>
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                trade.direction === "long" ? "bg-green-bg text-green" : "bg-red-bg text-red"
              }`}
            >
              {trade.direction}
            </span>
            <h1 className="text-lg font-semibold">{trade.symbol}</h1>
            <span
              className={`text-[10px] uppercase px-2 py-0.5 rounded border ${
                trade.status === "open"
                  ? "border-accent text-accent"
                  : "border-border text-text-muted"
              }`}
            >
              {trade.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscription === "premium" && (
            <button
              onClick={handleAiAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-3 py-2 bg-bg-input border border-border rounded-md text-xs text-text-secondary hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
            >
              <Brain className="w-3.5 h-3.5" />
              {analyzing ? "Analyzing..." : "AI Analysis"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 bg-bg-input border border-border rounded-md text-xs text-red hover:bg-red-bg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* P&L Banner */}
      {trade.pnl !== undefined && (
        <div
          className={`rounded-lg p-5 mb-6 ${isWin ? "bg-green-bg" : "bg-red-bg"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isWin ? (
              <TrendingUp className="w-4 h-4 text-green" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red" />
            )}
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              Realized P&L
            </span>
          </div>
          <p className={`text-2xl font-semibold ${isWin ? "text-green" : "text-red"}`}>
            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
            {trade.pnlPercent && (
              <span className="text-sm ml-2">({trade.pnlPercent.toFixed(2)}%)</span>
            )}
          </p>
        </div>
      )}

      {/* Trade Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DetailCard label="Entry Price" value={`$${trade.entryPrice.toFixed(2)}`} />
        <DetailCard label="Exit Price" value={trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "—"} />
        <DetailCard label="Quantity" value={String(trade.quantity)} />
        <DetailCard label="Fees" value={trade.fees ? `$${trade.fees.toFixed(2)}` : "—"} />
        <DetailCard label="Entry Time" value={new Date(trade.entryTime).toLocaleString()} />
        <DetailCard label="Exit Time" value={trade.exitTime ? new Date(trade.exitTime).toLocaleString() : "—"} />
        <DetailCard label="Strategy" value={trade.strategy || "—"} />
        <DetailCard label="Time Frame" value={trade.timeFrame || "—"} />
        <DetailCard label="Asset Class" value={trade.assetClass} />
        {trade.tags && trade.tags.length > 0 && (
          <div className="bg-bg-card border border-border rounded-lg p-4">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Tags</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {trade.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 bg-bg-tertiary border border-border rounded text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screenshots */}
      {trade.screenshots && trade.screenshots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Chart Screenshots
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {trade.screenshots.map((ss) => (
              <div key={ss.id} className="relative">
                <img
                  src={ss.url}
                  alt={ss.caption || "Chart screenshot"}
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                {ss.caption && (
                  <p className="text-[10px] text-text-muted mt-1">{ss.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Notes
          </h2>
          <div className="bg-bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-text-secondary whitespace-pre-wrap">{trade.notes}</p>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-accent" />
            AI Analysis
          </h2>
          <div className="bg-bg-card border border-accent/30 rounded-lg p-4">
            <p className="text-xs text-text-secondary whitespace-pre-wrap">{aiAnalysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <p className="text-sm font-medium text-text-primary mt-1">{value}</p>
    </div>
  );
}
