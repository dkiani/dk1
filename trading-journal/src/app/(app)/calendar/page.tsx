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
  isSameMonth,
  isToday,
} from "date-fns";

export default function CalendarPage() {
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

  const tradesByDate = getTradesByDate(trades.filter((t) => t.status === "closed"));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0 = Sunday

  // Monthly stats
  const monthTrades = days.flatMap((day) => tradesByDate[format(day, "yyyy-MM-dd")] || []);
  const monthPnl = monthTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const greenDays = days.filter((day) => {
    const dayTrades = tradesByDate[format(day, "yyyy-MM-dd")];
    if (!dayTrades) return false;
    return dayTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0) > 0;
  }).length;
  const redDays = days.filter((day) => {
    const dayTrades = tradesByDate[format(day, "yyyy-MM-dd")];
    if (!dayTrades) return false;
    return dayTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0) < 0;
  }).length;

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
          <h1 className="text-sm font-medium tracking-tight">P&L Calendar</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-[11px] ${monthPnl >= 0 ? "text-green" : "text-red"}`}>
              {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
            </span>
            <span className="text-[11px] text-text-muted">
              {greenDays} green / {redDays} red
            </span>
          </div>
        </div>
      </div>

      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-[3px] hover:bg-bg-tertiary transition-all duration-200 cursor-pointer border-0 bg-transparent"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-text-muted" />
        </button>
        <h2 className="text-[11px] font-medium tracking-tight">{format(currentMonth, "MMMM yyyy")}</h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-[3px] hover:bg-bg-tertiary transition-all duration-200 cursor-pointer border-0 bg-transparent"
        >
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-[3px] overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-bg-card">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-[10px] uppercase tracking-[0.06em] text-text-muted text-center font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="border-b border-r border-border h-24 bg-bg-card" />
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
                className={`border-b border-r border-border h-24 p-2 relative bg-bg-card transition-colors duration-200 ${
                  hasTrades
                    ? dayPnl > 0
                      ? "bg-green-bg"
                      : dayPnl < 0
                        ? "bg-red-bg"
                        : ""
                    : ""
                }`}
              >
                <span
                  className={`text-[10px] ${
                    today
                      ? "bg-accent text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px]"
                      : "text-text-muted"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {hasTrades && (
                  <div className="mt-1.5">
                    <p
                      className={`text-[11px] font-medium ${
                        dayPnl >= 0 ? "text-green" : "text-red"
                      }`}
                    >
                      {dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(0)}
                    </p>
                    <p className="text-[9px] text-text-muted">
                      {dayTrades.length} trade{dayTrades.length > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
