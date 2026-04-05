"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getTrade, deleteTrade } from "@/lib/trades";
import { Trade } from "@/types";
import { ArrowLeft, Trash2, Brain, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-surface border border-border rounded-[12px] p-4 shadow-[var(--shadow-card)]">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary">{label}</span>
      <p className="text-[0.85rem] font-mono font-medium text-text-primary mt-1">{value}</p>
    </div>
  );
}

export default function TradeDetailPage() {
  const { subscription } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { getTrade(params.id as string).then((t) => { setTrade(t); setLoading(false); }); }, [params.id]);

  async function handleDelete() {
    if (!trade || !confirm("Delete this trade?")) return;
    await deleteTrade(trade.id);
    router.push("/journal/trades");
  }

  async function handleAi() {
    if (!trade) return; setAnalyzing(true);
    try { const res = await fetch("/api/ai/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trade }) }); const d = await res.json(); setAiAnalysis(d.analysis); } catch { setAiAnalysis("Failed."); }
    setAnalyzing(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" /></div>;
  if (!trade) return <div className="text-center py-12"><p className="text-text-secondary">Trade not found</p><Link href="/journal/trades" className="text-accent-teal hover:underline mt-2 block no-underline">Back to journal</Link></div>;

  const isWin = (trade.pnl ?? 0) > 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2.5 rounded-[10px] bg-bg-surface border border-border hover:border-border-hover transition-all duration-200 cursor-pointer"><ArrowLeft className="w-5 h-5 text-text-secondary" /></button>
          <div className="flex items-center gap-3">
            <span className={`text-[0.75rem] font-semibold px-3 py-1 rounded-[8px] ${trade.direction === "long" ? "bg-green-bg text-green" : "bg-red-bg text-red"}`}>{trade.direction === "long" ? "▲" : "▼"} {trade.direction}</span>
            <h1 className="text-[1.5rem] font-bold">{trade.symbol}</h1>
            <span className={`text-[0.75rem] font-medium px-3 py-1 rounded-[8px] border ${trade.status === "open" ? "border-accent-teal/30 text-accent-teal" : "border-border text-text-tertiary"}`}>{trade.status}</span>
            {trade.setupGrade && <span className={`text-[0.75rem] font-semibold px-3 py-1 rounded-[8px] ${trade.setupGrade === "A+" ? "bg-accent-teal-dim text-accent-teal" : trade.setupGrade === "A" ? "bg-green-bg text-green" : trade.setupGrade === "B" ? "bg-[rgba(234,179,8,0.1)] text-yellow" : "bg-red-bg text-red"}`}>{trade.setupGrade}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscription === "premium" && <button onClick={handleAi} disabled={analyzing} className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border rounded-[12px] text-[0.8rem] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200 cursor-pointer disabled:opacity-40"><Brain className="w-4 h-4" />{analyzing ? "..." : "AI Analysis"}</button>}
          <button onClick={handleDelete} className="p-2.5 rounded-[10px] bg-bg-surface border border-border text-red hover:bg-red-bg hover:border-red/30 transition-all duration-200 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {trade.pnl !== undefined && (
        <div className={`bg-bg-surface border rounded-[16px] p-6 shadow-[var(--shadow-card)] ${isWin ? "border-green/15" : "border-red/15"}`}>
          <div className="flex items-center gap-2 mb-1">{isWin ? <TrendingUp className="w-5 h-5 text-green" /> : <TrendingDown className="w-5 h-5 text-red" />}<span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-secondary">Realized P&L</span></div>
          <p className={`text-[2rem] font-bold font-mono ${isWin ? "text-green" : "text-red"}`}>{trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}{trade.pnlPercent && <span className="text-[0.85rem] ml-3 font-normal text-text-secondary">({trade.pnlPercent.toFixed(2)}%)</span>}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <DetailCard label="Entry" value={`$${trade.entryPrice.toFixed(2)}`} />
        <DetailCard label="Exit" value={trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "—"} />
        <DetailCard label="Stop Loss" value={trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : "—"} />
        <DetailCard label="Take Profit" value={trade.takeProfit ? `$${trade.takeProfit.toFixed(2)}` : "—"} />
        <DetailCard label="Quantity" value={String(trade.quantity)} />
        <DetailCard label="Fees" value={trade.fees ? `$${trade.fees.toFixed(2)}` : "—"} />
        <DetailCard label="Session" value={trade.session || "—"} />
        <DetailCard label="Timeframe" value={trade.timeFrame || "—"} />
      </div>

      {trade.tags && trade.tags.length > 0 && (
        <div className="bg-bg-surface border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)]">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Tags</span>
          <div className="flex flex-wrap gap-2 mt-3">{trade.tags.map((t) => <span key={t} className="text-[0.8rem] font-medium px-3 py-1 bg-bg-elevated border border-border rounded-[8px] text-text-secondary">{t}</span>)}</div>
        </div>
      )}

      {trade.screenshots && trade.screenshots.length > 0 && (
        <div><p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-3">Screenshots</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{trade.screenshots.map((ss) => <div key={ss.id} className="rounded-[16px] overflow-hidden border border-border shadow-[var(--shadow-card)]"><img src={ss.url} alt="" className="w-full h-48 object-cover" /></div>)}</div>
        </div>
      )}

      {trade.notes && (
        <div className="bg-bg-surface border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)]">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Notes</span>
          <p className="text-[0.85rem] text-text-secondary mt-2 whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {aiAnalysis && (
        <div className="bg-bg-surface border border-accent-teal/20 rounded-[16px] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-accent-teal" /><span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-accent-teal">AI Analysis</span></div>
          <p className="text-[0.85rem] text-text-secondary whitespace-pre-wrap">{aiAnalysis}</p>
        </div>
      )}

      {trade.aiReview && (
        <div>
          <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-accent-teal" /><span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-accent-teal">AI Chart Review</span></div>
          {trade.aiReview.imageUrl && <img src={trade.aiReview.imageUrl} alt="" className="w-full max-h-[400px] object-contain border border-border rounded-[16px] mb-4" />}
          <div className="bg-bg-surface border border-border rounded-[16px] p-5 shadow-[var(--shadow-card)] mb-4"><p className="text-[0.85rem] text-text-secondary whitespace-pre-wrap">{trade.aiReview.analysis}</p></div>
          {trade.aiReview.chatHistory.length > 2 && (
            <div className="bg-bg-surface border border-border rounded-[16px] overflow-hidden shadow-[var(--shadow-card)]">
              <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.04)]"><span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Follow-up</span></div>
              {trade.aiReview.chatHistory.slice(2).map((msg, i) => (
                <div key={i} className={`px-5 py-4 border-b border-[rgba(255,255,255,0.03)] last:border-b-0 ${msg.role === "user" ? "bg-bg-elevated" : ""}`}>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary">{msg.role === "user" ? "You" : "AI Coach"}</span>
                  <p className="text-[0.85rem] text-text-secondary mt-1 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
