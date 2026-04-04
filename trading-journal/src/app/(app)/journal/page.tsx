"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade } from "@/types";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";

function DonutChart({ value, size = 100 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;
  const empty = circumference - filled;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--red)"
        strokeWidth="6"
        opacity="0.3"
      />
      {/* Filled arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--green)"
        strokeWidth="6"
        strokeDasharray={`${filled} ${empty}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function JournalDashboardPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
  const breakeven = closedTrades.filter((t) => (t.pnl ?? 0) === 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
  const profitFactor = avgLoss !== 0 ? avgWin / avgLoss : 0;
  const tradingDays = Object.keys(getTradesByDate(closedTrades)).length;
  const expectancy = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;

  // Streaks
  const sortedTrades = [...closedTrades].sort(
    (a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
  );
  let currentStreak = 0;
  for (let i = sortedTrades.length - 1; i >= 0; i--) {
    const isWin = (sortedTrades[i].pnl ?? 0) > 0;
    if (i === sortedTrades.length - 1) {
      currentStreak = isWin ? 1 : -1;
    } else {
      const wasWin = currentStreak > 0;
      if (isWin === wasWin) {
        currentStreak += isWin ? 1 : -1;
      } else {
        break;
      }
    }
  }

  // Calendar
  const tradesByDate = getTradesByDate(closedTrades);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const recentTrades = trades.slice(0, 12);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-border-hover border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[1.3rem] font-medium tracking-[-0.02em]">Overview</h1>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-[0.7rem] tracking-[0.04em] rounded-[4px] hover:bg-accent-hover transition-colors duration-150 no-underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Trade
        </Link>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Win Rate with donut */}
        <div className="bg-bg-surface border border-border rounded-[8px] p-5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-text-secondary">Trade Win</span>
          <div className="flex items-center gap-4 mt-3">
            <div className="relative">
              <DonutChart value={winRate} size={80} />
              <span className="absolute inset-0 flex items-center justify-center text-[0.85rem] font-semibold text-text-primary">
                {winRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-[0.65rem]">
                <span className="w-2 h-2 rounded-full bg-green" />
                <span className="text-text-secondary">{wins.length}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.65rem]">
                <span className="w-2 h-2 rounded-full bg-text-muted" />
                <span className="text-text-secondary">{breakeven.length}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.65rem]">
                <span className="w-2 h-2 rounded-full bg-red" />
                <span className="text-text-secondary">{losses.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-bg-surface border border-border rounded-[8px] p-5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-text-secondary">Profit Factor</span>
          <p className="text-[1.6rem] font-semibold text-text-primary mt-3 leading-tight">{profitFactor.toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[0.6rem] text-text-muted">Avg W</span>
            <span className="text-[0.7rem] text-green font-medium">${avgWin.toFixed(0)}</span>
            <span className="text-[0.6rem] text-text-muted ml-2">Avg L</span>
            <span className="text-[0.7rem] text-red font-medium">-${avgLoss.toFixed(0)}</span>
          </div>
        </div>

        {/* Net P&L */}
        <div className="bg-bg-surface border border-border rounded-[8px] p-5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-text-secondary">Net P&L</span>
          <p className={`text-[1.6rem] font-semibold mt-3 leading-tight ${totalPnl >= 0 ? "text-green" : "text-red"}`}>
            {totalPnl >= 0 ? "" : "-"}${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[0.65rem] text-text-muted mt-2">
            {closedTrades.length} trades · {tradingDays} days
          </p>
        </div>

        {/* Streaks */}
        <div className="bg-bg-surface border border-border rounded-[8px] p-5">
          <span className="text-[0.65rem] uppercase tracking-[0.08em] text-text-secondary">Expectancy</span>
          <p className={`text-[1.6rem] font-semibold mt-3 leading-tight ${expectancy >= 0 ? "text-green" : "text-red"}`}>
            {expectancy >= 0 ? "" : "-"}${Math.abs(expectancy).toFixed(2)}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[0.6rem] text-text-muted">Streak</span>
            {currentStreak !== 0 && (
              <span className={`text-[0.65rem] font-medium px-1.5 py-0.5 rounded-[3px] ${
                currentStreak > 0 ? "bg-green-bg text-green" : "bg-red-bg text-red"
              }`}>
                {Math.abs(currentStreak)}{currentStreak > 0 ? "W" : "L"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calendar + Recent Trades side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
        {/* P&L Calendar */}
        <div className="bg-bg-surface border border-border rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[0.85rem] font-medium">P&L Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-bg-surface-hover rounded-[4px] transition-colors duration-150 cursor-pointer border-0 bg-transparent"
              >
                <ChevronLeft className="w-[14px] h-[14px] text-text-muted" />
              </button>
              <span className="text-[0.75rem] text-text-secondary min-w-[120px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-bg-surface-hover rounded-[4px] transition-colors duration-150 cursor-pointer border-0 bg-transparent"
              >
                <ChevronRight className="w-[14px] h-[14px] text-text-muted" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 text-[0.6rem] uppercase tracking-[0.08em] text-text-muted text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="h-[72px] border border-border/40 bg-bg-primary/30" />
            ))}

            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayTrades = tradesByDate[dateStr] || [];
              const dayPnl = dayTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
              const hasTrades = dayTrades.length > 0;
              const today = isToday(day);

              return (
                <div
                  key={dateStr}
                  className={`h-[72px] border border-border/40 p-1.5 relative transition-colors duration-150 ${
                    today ? "ring-1 ring-inset ring-accent/50" : ""
                  } ${hasTrades ? (dayPnl >= 0 ? "bg-green/[0.04]" : "bg-red/[0.04]") : ""}`}
                >
                  <span className={`text-[0.6rem] ${today ? "text-accent" : "text-text-muted"}`}>
                    {format(day, "d")}
                  </span>
                  {hasTrades && (
                    <div className="mt-0.5">
                      <p className={`text-[0.7rem] font-medium ${dayPnl >= 0 ? "text-green" : "text-red"}`}>
                        {dayPnl >= 0 ? "+" : "-"}${Math.abs(dayPnl).toFixed(0)}
                      </p>
                      <p className="text-[0.5rem] text-text-muted">
                        {dayTrades.length} trade{dayTrades.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-bg-surface border border-border rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[0.85rem] font-medium">Trades</h2>
            <Link
              href="/journal/trades"
              className="text-[0.65rem] text-text-muted hover:text-accent transition-colors no-underline"
            >
              View all
            </Link>
          </div>

          {recentTrades.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[0.8rem] text-text-muted mb-4 font-light">No trades yet</p>
              <Link
                href="/journal/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-[0.7rem] rounded-[4px] hover:bg-accent-hover transition-colors duration-150 no-underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Log trade
              </Link>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_90px_80px] px-3 py-2 border-b border-border">
                <span className="text-[0.6rem] uppercase tracking-[0.08em] text-text-muted">Symbol</span>
                <span className="text-[0.6rem] uppercase tracking-[0.08em] text-text-muted">Date</span>
                <span className="text-[0.6rem] uppercase tracking-[0.08em] text-text-muted text-right">Net P&L</span>
              </div>
              {/* Trade rows */}
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  onClick={() => (window.location.href = `/journal/${trade.id}`)}
                  className="grid grid-cols-[1fr_90px_80px] px-3 py-2.5 border-b border-border/50 hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer last:border-b-0"
                >
                  <span className="text-[0.75rem] text-text-primary">{trade.symbol}</span>
                  <span className="text-[0.7rem] text-text-muted">
                    {format(new Date(trade.entryTime), "yyyy-MM-dd")}
                  </span>
                  <span className={`text-[0.75rem] font-medium text-right ${
                    (trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"
                  }`}>
                    {(trade.pnl ?? 0) >= 0 ? "" : "-"}${Math.abs(trade.pnl ?? 0).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
