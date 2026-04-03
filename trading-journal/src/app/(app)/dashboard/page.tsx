"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade, DailyStats } from "@/types";
import { TrendingUp, TrendingDown, BarChart3, Target, CalendarDays } from "lucide-react";
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
    <div className="bg-bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
        <Icon className={`w-4 h-4 ${colorClass}`} />
      </div>
      <p className={`text-xl font-semibold ${colorClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid).then((t) => {
      setTrades(t);
      setLoading(false);
    });
  }, [user]);

  const closedTrades = trades.filter((t) => t.status === "closed");
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  const recentTrades = trades.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-text-muted mt-1">
            {closedTrades.length} closed trades
          </p>
        </div>
        <Link
          href="/journal/new"
          className="px-4 py-2 bg-accent text-white rounded-md text-xs hover:bg-accent-hover transition-colors no-underline"
        >
          + Log Trade
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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
      <div className="bg-bg-card border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Recent Trades
          </h2>
        </div>
        {recentTrades.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted mb-3">No trades yet</p>
            <Link
              href="/journal/new"
              className="text-xs text-accent hover:underline"
            >
              Log your first trade
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTrades.map((trade) => (
              <Link
                key={trade.id}
                href={`/journal/${trade.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary transition-colors no-underline"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                      trade.direction === "long"
                        ? "bg-green-bg text-green"
                        : "bg-red-bg text-red"
                    }`}
                  >
                    {trade.direction}
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {trade.symbol}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(trade.entryTime).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    (trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"
                  }`}
                >
                  {(trade.pnl ?? 0) >= 0 ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
