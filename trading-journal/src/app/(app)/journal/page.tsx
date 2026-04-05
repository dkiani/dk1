"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade } from "@/types";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Scale,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type EquityTimeframe = "1w" | "1m" | "3m" | "all";

function computeEquityData(trades: Trade[]) {
  const sorted = [...trades]
    .filter((t) => t.status === "closed" && t.pnl !== undefined)
    .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());

  let cumulative = 0;
  const data: { date: string; value: number; label: string }[] = [];

  // Group by date
  const byDate: Record<string, number> = {};
  for (const t of sorted) {
    const d = t.entryTime.split("T")[0];
    byDate[d] = (byDate[d] || 0) + (t.pnl ?? 0);
  }

  for (const [date, pnl] of Object.entries(byDate)) {
    cumulative += pnl;
    data.push({
      date,
      value: cumulative,
      label: format(new Date(date), "MMM d"),
    });
  }

  return data;
}

function filterEquityByTimeframe(
  data: { date: string; value: number; label: string }[],
  timeframe: EquityTimeframe
) {
  if (timeframe === "all" || data.length === 0) return data;
  const now = new Date();
  const cutoff = new Date();
  if (timeframe === "1w") cutoff.setDate(now.getDate() - 7);
  else if (timeframe === "1m") cutoff.setMonth(now.getMonth() - 1);
  else if (timeframe === "3m") cutoff.setMonth(now.getMonth() - 3);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { label: string } }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-hover rounded-[var(--radius-sm)] px-3 py-2">
      <p className="text-[0.7rem] font-mono text-text-secondary">{payload[0].payload.label}</p>
      <p className={`text-[0.85rem] font-mono font-semibold ${payload[0].value >= 0 ? "text-green" : "text-red"}`}>
        ${payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function JournalDashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [equityTimeframe, setEquityTimeframe] = useState<EquityTimeframe>("all");

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
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
  const riskReward = avgLoss !== 0 ? avgWin / avgLoss : 0;
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const tradingDays = Object.keys(getTradesByDate(closedTrades)).length;

  const equityData = computeEquityData(trades);
  const filteredEquity = filterEquityByTimeframe(equityData, equityTimeframe);

  const recentTrades = trades.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-h1">Dashboard</h1>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:bg-accent-hover hover:shadow-[var(--shadow-glow-orange)] transition-all duration-150 no-underline"
        >
          <Plus className="w-4 h-4" />
          Log Trade
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* Average Win */}
        <div className="journal-card animate-fade-in-up">
          <div className="flex items-start justify-between mb-3">
            <ArrowUpRight className="w-[18px] h-[18px] text-accent-teal" />
          </div>
          <p className="text-label mb-2">Average Win</p>
          <p className="text-stat-value text-green">
            ${avgWin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Average Loss */}
        <div className="journal-card animate-fade-in-up">
          <div className="flex items-start justify-between mb-3">
            <ArrowDownRight className="w-[18px] h-[18px] text-accent-teal" />
          </div>
          <p className="text-label mb-2">Average Loss</p>
          <p className="text-stat-value text-red">
            -${avgLoss.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Win Ratio */}
        <div className="journal-card animate-fade-in-up">
          <div className="flex items-start justify-between mb-3">
            <Target className="w-[18px] h-[18px] text-accent-teal" />
          </div>
          <p className="text-label mb-2">Win Rate</p>
          <p className="text-stat-value text-accent-teal">
            {winRate.toFixed(0)}%
          </p>
          <p className="text-small mt-1">
            {wins.length}W / {losses.length}L · {closedTrades.length} trades
          </p>
        </div>

        {/* Risk Reward */}
        <div className="journal-card animate-fade-in-up">
          <div className="flex items-start justify-between mb-3">
            <Scale className="w-[18px] h-[18px] text-accent-teal" />
          </div>
          <p className="text-label mb-2">Risk Reward</p>
          <p className="text-stat-value text-accent-teal">
            {riskReward.toFixed(2)}
          </p>
          <p className="text-small mt-1">
            {tradingDays} trading days
          </p>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="journal-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-label mb-1">Balance</p>
            <p className={`text-stat-value ${totalPnl >= 0 ? "text-green" : "text-red"}`}>
              {totalPnl >= 0 ? "" : "-"}${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[0.75rem] text-text-secondary ml-2 font-normal">USD</span>
            </p>
          </div>
          <div className="flex items-center gap-1 bg-bg-elevated rounded-[var(--radius-sm)] p-1">
            {(["1w", "1m", "3m", "all"] as EquityTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setEquityTimeframe(tf)}
                className={`px-3 py-1.5 text-[0.7rem] font-mono rounded-[var(--radius-sm)] border-0 cursor-pointer transition-all duration-150 ${
                  equityTimeframe === tf
                    ? "bg-accent-teal text-text-inverse"
                    : "bg-transparent text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px]">
          {filteredEquity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredEquity} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="none"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                  tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent-teal)"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                <p className="text-body text-text-secondary">No equity data yet</p>
                <p className="text-small mt-1">Log trades to see your equity curve</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="journal-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2">Recent Trades</h2>
          <Link
            href="/journal/trades"
            className="text-[0.75rem] font-sans text-text-secondary hover:text-accent-teal transition-colors no-underline"
          >
            View All &rarr;
          </Link>
        </div>

        {recentTrades.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body text-text-secondary mb-4">No trades logged yet</p>
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:bg-accent-hover transition-all duration-150 no-underline"
            >
              <Plus className="w-4 h-4" />
              Log Your First Trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Date</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Instrument</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Dir</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Entry</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Exit</th>
                  <th className="text-right px-4 py-3 text-label border-b border-border">P&L</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Setup</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Grade</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    onClick={() => (window.location.href = `/journal/${trade.id}`)}
                    className="hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-data text-text-primary border-b border-border">
                      {format(new Date(trade.entryTime), "MMM d")}
                    </td>
                    <td className="px-4 py-3 text-data text-text-primary font-medium border-b border-border">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={`text-data ${trade.direction === "long" ? "text-green" : "text-red"}`}>
                        {trade.direction === "long" ? "▲" : "▼"} {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-data text-text-secondary border-b border-border">
                      {trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-data text-text-secondary border-b border-border">
                      {trade.exitPrice ? trade.exitPrice.toFixed(2) : "\u2014"}
                    </td>
                    <td className={`px-4 py-3 text-data font-medium text-right border-b border-border ${(trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"}`}>
                      {(trade.pnl ?? 0) >= 0 ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-data text-text-secondary border-b border-border">
                      {trade.setupType || trade.strategy || "\u2014"}
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      {trade.setupGrade ? (
                        <span className={`inline-block px-2 py-0.5 text-[0.65rem] font-mono rounded-[var(--radius-sm)] ${
                          trade.setupGrade === "A+" ? "bg-accent-teal-dim text-accent-teal" :
                          trade.setupGrade === "A" ? "bg-green-bg text-green" :
                          trade.setupGrade === "B" ? "bg-[rgba(234,179,8,0.12)] text-yellow" :
                          "bg-red-bg text-red"
                        }`}>
                          {trade.setupGrade}
                        </span>
                      ) : (
                        <span className="text-data text-text-tertiary">&mdash;</span>
                      )}
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
