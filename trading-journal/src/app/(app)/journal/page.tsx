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
  BookOpen,
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
  const byDate: Record<string, number> = {};
  for (const t of sorted) {
    const d = t.entryTime.split("T")[0];
    byDate[d] = (byDate[d] || 0) + (t.pnl ?? 0);
  }

  const data: { date: string; value: number; label: string }[] = [];
  for (const [date, pnl] of Object.entries(byDate)) {
    cumulative += pnl;
    data.push({ date, value: cumulative, label: format(new Date(date), "MMM d") });
  }
  return data;
}

function filterEquityByTimeframe(data: { date: string; value: number; label: string }[], tf: EquityTimeframe) {
  if (tf === "all" || data.length === 0) return data;
  const cutoff = new Date();
  if (tf === "1w") cutoff.setDate(cutoff.getDate() - 7);
  else if (tf === "1m") cutoff.setMonth(cutoff.getMonth() - 1);
  else if (tf === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { label: string } }> }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#162232] border border-[rgba(45,212,191,0.2)] rounded-[12px] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <p className="text-[0.7rem] text-text-secondary mb-1">{payload[0].payload.label}</p>
      <p className={`text-[1rem] font-mono font-semibold ${val >= 0 ? "text-green" : "text-red"}`}>
        {val >= 0 ? "+" : ""}${Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function JournalDashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [equityTf, setEquityTf] = useState<EquityTimeframe>("all");

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid)
      .then((t) => setTrades(t))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const closed = trades.filter((t) => t.status === "closed");
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
  const riskReward = avgLoss !== 0 ? avgWin / avgLoss : 0;
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const tradingDays = Object.keys(getTradesByDate(closed)).length;

  const equityData = computeEquityData(trades);
  const filteredEquity = filterEquityByTimeframe(equityData, equityTf);
  const recentTrades = trades.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Average Win", value: `$${avgWin.toFixed(2)}`, icon: ArrowUpRight, color: "text-green", iconColor: "text-green" },
    { label: "Average Loss", value: `-$${avgLoss.toFixed(2)}`, icon: ArrowDownRight, color: "text-red", iconColor: "text-red" },
    { label: "Win Rate", value: `${winRate.toFixed(0)}%`, icon: Target, color: "text-accent-teal", iconColor: "text-accent-teal", sub: `${wins.length}W / ${losses.length}L` },
    { label: "Risk Reward", value: riskReward.toFixed(2), icon: Scale, color: "text-accent-teal", iconColor: "text-accent-teal", sub: `${tradingDays} trading days` },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.5rem] font-bold tracking-[-0.02em]">Dashboard</h1>
          <p className="text-[0.85rem] text-text-secondary mt-0.5">Welcome back. Here&apos;s your trading overview.</p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[0.85rem] font-semibold rounded-[12px] hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,93,58,0.25)] hover:shadow-[var(--shadow-glow-orange)] hover:-translate-y-[1px] transition-all duration-200 no-underline"
        >
          <Plus className="w-4 h-4" />
          Log Trade
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="animate-fade-in-up bg-bg-surface border border-border rounded-[16px] p-5 hover:border-border-hover hover:-translate-y-[1px] transition-all duration-300 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] group relative overflow-hidden"
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(45,212,191,0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-9 h-9 rounded-[10px] bg-bg-elevated flex items-center justify-center mb-3 border border-[rgba(255,255,255,0.04)]">
                  <Icon className={`w-[18px] h-[18px] ${stat.iconColor}`} />
                </div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-1.5">{stat.label}</p>
                <p className={`text-[1.5rem] font-bold font-mono tracking-[-0.02em] ${stat.color}`}>
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="text-[0.75rem] text-text-tertiary mt-1">{stat.sub}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Equity Curve */}
      <div className="bg-bg-surface border border-border rounded-[16px] p-6 shadow-[var(--shadow-card)] relative overflow-hidden">
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(45,212,191,0.15)] to-transparent" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-1">Net P&L</p>
            <div className="flex items-baseline gap-3">
              <p className={`text-[1.75rem] font-bold font-mono tracking-[-0.02em] ${totalPnl >= 0 ? "text-green" : "text-red"}`}>
                {totalPnl >= 0 ? "+" : "-"}${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[0.8rem] text-text-tertiary">USD</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-bg-elevated rounded-[10px] p-1 border border-[rgba(255,255,255,0.04)]">
            {(["1w", "1m", "3m", "all"] as EquityTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setEquityTf(tf)}
                className={`px-3.5 py-1.5 text-[0.75rem] font-semibold rounded-[8px] border-0 cursor-pointer transition-all duration-200 ${
                  equityTf === tf
                    ? "bg-gradient-to-r from-accent-teal to-[#14b8a6] text-text-inverse shadow-[0_2px_8px_rgba(45,212,191,0.2)]"
                    : "bg-transparent text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] relative z-10">
          {filteredEquity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredEquity} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#3e5168", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#3e5168", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                  width={65}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={2.5} fill="url(#eqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-14 h-14 rounded-[16px] bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-text-tertiary" />
                </div>
                <p className="text-[0.95rem] font-medium text-text-secondary mb-1">No equity data yet</p>
                <p className="text-[0.8rem] text-text-tertiary">Log your first trade to see the equity curve</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-bg-surface border border-border rounded-[16px] shadow-[var(--shadow-card)] overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(45,212,191,0.1)] to-transparent" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.04)]">
          <h2 className="text-[1rem] font-semibold">Recent Trades</h2>
          <Link
            href="/journal/trades"
            className="text-[0.8rem] font-medium text-text-secondary hover:text-accent-teal transition-colors no-underline"
          >
            View All &rarr;
          </Link>
        </div>

        {recentTrades.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-[16px] bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="text-[0.95rem] font-medium text-text-secondary mb-2">No trades logged yet</p>
            <p className="text-[0.8rem] text-text-tertiary mb-5">Start tracking your trades to see analytics here</p>
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[0.85rem] font-semibold rounded-[12px] hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,93,58,0.25)] transition-all duration-200 no-underline"
            >
              <Plus className="w-4 h-4" />
              Log Your First Trade
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.04)]">
                  {["Date", "Symbol", "Direction", "Entry", "Exit", "P&L", "Setup", "Grade"].map((h) => (
                    <th key={h} className={`text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary px-5 py-3 ${h === "P&L" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    onClick={() => (window.location.href = `/journal/${trade.id}`)}
                    className="border-b border-[rgba(255,255,255,0.03)] last:border-b-0 hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 text-[0.8rem] text-text-secondary">{format(new Date(trade.entryTime), "MMM d")}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-semibold text-text-primary">{trade.symbol}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[0.75rem] font-medium px-2.5 py-1 rounded-[8px] ${
                        trade.direction === "long"
                          ? "bg-green-bg text-green"
                          : "bg-red-bg text-red"
                      }`}>
                        {trade.direction === "long" ? "▲" : "▼"} {trade.direction}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-mono text-text-secondary">{trade.entryPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-mono text-text-secondary">{trade.exitPrice ? trade.exitPrice.toFixed(2) : "—"}</td>
                    <td className={`px-5 py-3.5 text-[0.8rem] font-mono font-semibold text-right ${(trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"}`}>
                      {(trade.pnl ?? 0) >= 0 ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-[0.8rem] text-text-secondary">{trade.setupType || trade.strategy || "—"}</td>
                    <td className="px-5 py-3.5">
                      {trade.setupGrade ? (
                        <span className={`inline-block px-2.5 py-1 text-[0.7rem] font-semibold rounded-[8px] ${
                          trade.setupGrade === "A+" ? "bg-accent-teal-dim text-accent-teal" :
                          trade.setupGrade === "A" ? "bg-green-bg text-green" :
                          trade.setupGrade === "B" ? "bg-[rgba(234,179,8,0.1)] text-yellow" :
                          "bg-red-bg text-red"
                        }`}>
                          {trade.setupGrade}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
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
