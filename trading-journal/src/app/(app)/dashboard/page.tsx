"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  CalendarDays,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: "green" | "red" | "accent";
}) {
  const colorClass =
    color === "green"
      ? "text-green"
      : color === "red"
        ? "text-red"
        : "text-accent";
  return (
    <div className="bg-bg-card border border-border rounded-[3px] p-5 transition-all duration-200 hover:border-border-hover">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.06em] font-medium text-text-muted">
          {label}
        </span>
        <Icon className={`w-3.5 h-3.5 ${colorClass} opacity-60`} />
      </div>
      <p className={`text-lg font-medium ${colorClass}`}>{value}</p>
      {sub && (
        <p className="text-[10px] text-text-muted mt-2 tracking-wide">{sub}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid)
      .then((t) => {
        setTrades(t);
      })
      .catch((err) => {
        console.error("Failed to fetch trades:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const closedTrades = trades.filter((t) => t.status === "closed");
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
  const winRate =
    closedTrades.length > 0
      ? (wins.length / closedTrades.length) * 100
      : 0;
  const avgWin =
    wins.length > 0
      ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length
      : 0;
  const avgLoss =
    losses.length > 0
      ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length
      : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  const recentTrades = trades.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border-[1.5px] border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[720px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-sm font-medium tracking-tight">Dashboard</h1>
          <p className="text-[11px] text-text-muted mt-1.5">
            {closedTrades.length} closed trade{closedTrades.length !== 1 && "s"}
          </p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white rounded-[3px] text-[11px] font-medium hover:bg-accent-hover transition-all duration-200 no-underline"
        >
          <Plus className="w-3 h-3" />
          Log Trade
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-10 animate-stagger">
        <StatCard
          label="Total P&L"
          value={`$${totalPnl.toFixed(2)}`}
          icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
          color={totalPnl >= 0 ? "green" : "red"}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          sub={`${wins.length}W / ${losses.length}L`}
          icon={Target}
          color={winRate >= 50 ? "green" : "red"}
        />
        <StatCard
          label="Profit Factor"
          value={profitFactor.toFixed(2)}
          icon={BarChart3}
          color={profitFactor >= 1 ? "green" : "red"}
        />
        <StatCard
          label="Trading Days"
          value={String(Object.keys(getTradesByDate(closedTrades)).length)}
          icon={CalendarDays}
          color="accent"
        />
      </div>

      {/* Recent Trades */}
      <div className="border border-border rounded-[3px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-bg-card">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">
            Recent Trades
          </h2>
        </div>
        {recentTrades.length === 0 ? (
          <div className="py-16 text-center bg-bg-card">
            <p className="text-[11px] text-text-muted mb-4">
              No trades logged yet
            </p>
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:text-accent-hover transition-colors no-underline"
            >
              Log your first trade
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTrades.map((trade) => (
              <Link
                key={trade.id}
                href={`/journal/${trade.id}`}
                className="flex items-center justify-between px-5 py-3 bg-bg-card hover:bg-bg-tertiary transition-all duration-200 no-underline group"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[9px] uppercase font-medium px-2 py-0.5 rounded-[2px] tracking-wider ${
                      trade.direction === "long"
                        ? "bg-green-bg text-green"
                        : "bg-red-bg text-red"
                    }`}
                  >
                    {trade.direction}
                  </span>
                  <span className="text-[12px] font-medium text-text-primary">
                    {trade.symbol}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(trade.entryTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[12px] font-medium ${
                      (trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"
                    }`}
                  >
                    {(trade.pnl ?? 0) >= 0 ? "+" : ""}$
                    {(trade.pnl ?? 0).toFixed(2)}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
