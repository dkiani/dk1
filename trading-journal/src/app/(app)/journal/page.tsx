"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade } from "@/types";
import { Plus, TrendingUp, BarChart3, Calendar } from "lucide-react";
import Link from "next/link";

export default function JournalDashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid)
      .then((t) => setTrades(t))
      .catch((err) => console.error("Failed to fetch trades:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const closedTrades = trades.filter((t) => t.status === "closed");
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
  const tradingDays = Object.keys(getTradesByDate(closedTrades)).length;

  const recentTrades = trades.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-border-hover border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[1.5rem] font-medium tracking-[-0.02em]">Dashboard</h1>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-[0.75rem] uppercase tracking-[0.1em] rounded-[4px] hover:bg-accent-hover transition-colors duration-150 no-underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Trade
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-surface border border-border rounded-[6px] p-6 relative">
          <TrendingUp className="w-[14px] h-[14px] text-text-muted absolute top-6 right-6" />
          <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary font-light">Win Rate</span>
          <p className="text-[1.8rem] font-semibold text-text-primary mt-1 leading-tight">{winRate.toFixed(1)}%</p>
          <p className="text-[0.7rem] text-text-muted mt-1 font-light">{wins.length}W / {losses.length}L</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-[6px] p-6 relative">
          <BarChart3 className="w-[14px] h-[14px] text-text-muted absolute top-6 right-6" />
          <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary font-light">Profit Factor</span>
          <p className="text-[1.8rem] font-semibold text-text-primary mt-1 leading-tight">{profitFactor.toFixed(2)}</p>
        </div>
        <div className="bg-bg-surface border border-border rounded-[6px] p-6 relative">
          <Calendar className="w-[14px] h-[14px] text-text-muted absolute top-6 right-6" />
          <span className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary font-light">Trading Days</span>
          <p className="text-[1.8rem] font-semibold text-text-primary mt-1 leading-tight">{tradingDays}</p>
        </div>
      </div>

      {/* Recent Trades */}
      <div>
        <h2 className="text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary font-light mb-4">
          Recent Trades
        </h2>
        {recentTrades.length === 0 ? (
          <div className="border border-border rounded-[6px] py-16 text-center bg-bg-surface">
            <p className="text-[0.85rem] text-text-muted mb-4 font-light">
              No trades logged yet
            </p>
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-[0.75rem] uppercase tracking-[0.1em] rounded-[4px] hover:bg-accent-hover transition-colors duration-150 no-underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Log your first trade
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded-[6px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-light">Symbol</th>
                  <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-light">Direction</th>
                  <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-light">Date</th>
                  <th className="text-right px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-light">P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-border last:border-b-0 bg-bg-surface hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer"
                    onClick={() => (window.location.href = `/journal/${trade.id}`)}
                  >
                    <td className="px-5 py-3 text-[0.8rem] font-normal text-text-primary">{trade.symbol}</td>
                    <td className="px-5 py-3 text-[0.8rem] text-text-secondary font-light">{trade.direction}</td>
                    <td className="px-5 py-3 text-[0.8rem] text-text-secondary font-light">{new Date(trade.entryTime).toLocaleDateString()}</td>
                    <td className={`px-5 py-3 text-[0.8rem] font-normal text-right ${(trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"}`}>
                      {(trade.pnl ?? 0) >= 0 ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
