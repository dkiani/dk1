"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function JournalCalendarPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid)
      .then((t) => setTrades(t))
      .catch((err) => console.error("Failed to fetch trades:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const tradesByDate = getTradesByDate(trades.filter((t) => t.status === "closed"));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const monthTrades = days.flatMap((day) => tradesByDate[format(day, "yyyy-MM-dd")] || []);
  const monthPnl = monthTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const greenDays = days.filter((day) => {
    const dt = tradesByDate[format(day, "yyyy-MM-dd")];
    return dt && dt.reduce((sum, t) => sum + (t.pnl ?? 0), 0) > 0;
  }).length;
  const redDays = days.filter((day) => {
    const dt = tradesByDate[format(day, "yyyy-MM-dd")];
    return dt && dt.reduce((sum, t) => sum + (t.pnl ?? 0), 0) < 0;
  }).length;

  const selectedTrades = selectedDay ? tradesByDate[selectedDay] || [] : [];

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
        <div>
          <h1 className="text-h1">P&L Calendar</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-data font-medium ${monthPnl >= 0 ? "text-green" : "text-red"}`}>
              {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
            </span>
            <span className="text-small">
              <span className="text-green">{greenDays} green</span>
              {" / "}
              <span className="text-red">{redDays} red</span>
            </span>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-bg-surface-hover rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer border-0 bg-transparent"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-h2">{format(currentMonth, "MMMM yyyy")}</h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-bg-surface-hover rounded-[var(--radius-sm)] transition-colors duration-150 cursor-pointer border-0 bg-transparent"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="journal-card !p-0 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="px-3 py-3 text-label text-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {/* Padding for days before month start (adjusted for Mon start) */}
          {Array.from({ length: startPadding === 0 ? 6 : startPadding - 1 }).map((_, i) => (
            <div key={`pad-${i}`} className="h-24 border-b border-r border-border bg-bg-primary/30" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayTrades = tradesByDate[dateStr] || [];
            const dayPnl = dayTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
            const hasTrades = dayTrades.length > 0;
            const today = isToday(day);
            const isSelected = selectedDay === dateStr;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`h-24 border-b border-r border-border p-2 relative transition-all duration-150 cursor-pointer ${
                  today ? "ring-1 ring-inset ring-accent-teal" : ""
                } ${isSelected ? "bg-accent-teal-dim" : ""} ${
                  hasTrades && !isSelected
                    ? dayPnl > 0
                      ? "bg-green/[0.04] hover:bg-green/[0.08]"
                      : dayPnl < 0
                      ? "bg-red/[0.04] hover:bg-red/[0.08]"
                      : "hover:bg-bg-surface-hover"
                    : "hover:bg-bg-surface-hover"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[0.7rem] font-mono ${today ? "text-accent-teal font-medium" : "text-text-tertiary"}`}>
                    {format(day, "d")}
                  </span>
                  {hasTrades && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dayPnl > 0 ? "bg-green" : dayPnl < 0 ? "bg-red" : "bg-yellow"
                    }`} />
                  )}
                </div>
                {hasTrades && (
                  <div className="mt-1">
                    <p className={`text-[0.75rem] font-mono font-medium ${
                      dayPnl >= 0 ? "text-green" : "text-red"
                    }`}>
                      {dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(0)}
                    </p>
                    <p className="text-[0.6rem] font-mono text-text-tertiary mt-0.5">
                      {dayTrades.length} trade{dayTrades.length > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && selectedTrades.length > 0 && (
        <div className="journal-card animate-fade-in-up">
          <h3 className="text-h2 mb-4">
            {format(new Date(selectedDay), "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2 text-label border-b border-border">Symbol</th>
                  <th className="text-left px-4 py-2 text-label border-b border-border">Dir</th>
                  <th className="text-left px-4 py-2 text-label border-b border-border">Entry</th>
                  <th className="text-left px-4 py-2 text-label border-b border-border">Exit</th>
                  <th className="text-right px-4 py-2 text-label border-b border-border">P&L</th>
                  <th className="text-left px-4 py-2 text-label border-b border-border">Setup</th>
                </tr>
              </thead>
              <tbody>
                {selectedTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer"
                    onClick={() => (window.location.href = `/journal/${trade.id}`)}
                  >
                    <td className="px-4 py-2.5 text-data text-text-primary font-medium border-b border-border">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-2.5 border-b border-border">
                      <span className={`text-data ${trade.direction === "long" ? "text-green" : "text-red"}`}>
                        {trade.direction === "long" ? "▲" : "▼"} {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-data text-text-secondary border-b border-border">
                      {trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-data text-text-secondary border-b border-border">
                      {trade.exitPrice ? trade.exitPrice.toFixed(2) : "\u2014"}
                    </td>
                    <td className={`px-4 py-2.5 text-data font-medium text-right border-b border-border ${
                      (trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"
                    }`}>
                      {(trade.pnl ?? 0) >= 0 ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-data text-text-secondary border-b border-border">
                      {trade.setupType || trade.strategy || "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
