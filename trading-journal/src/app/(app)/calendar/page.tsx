"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[1.5rem] font-medium">P&L Calendar</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[0.85rem] ${monthPnl >= 0 ? "text-green" : "text-red"}`}>
              {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
            </span>
            <span className="text-[0.8rem] text-text-secondary">
              {greenDays} green / {redDays} red
            </span>
          </div>
        </div>
      </div>

      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-[4px] hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer border-0 bg-transparent"
        >
          <ChevronLeft className="w-[14px] h-[14px] text-text-secondary" />
        </button>
        <h2 className="text-[0.85rem] font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-[4px] hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer border-0 bg-transparent"
        >
          <ChevronRight className="w-[14px] h-[14px] text-text-secondary" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-[6px] overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="px-3 py-2 text-[0.65rem] uppercase tracking-[0.12em] text-text-secondary text-center font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="border-b border-r border-border h-24 bg-bg-surface" />
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
                className={`border-b border-r border-border h-24 p-2 relative bg-bg-surface transition-colors duration-150 ${
                  today ? "ring-1 ring-inset ring-accent" : ""
                }`}
              >
                <span className="text-[0.7rem] text-text-muted">
                  {format(day, "d")}
                </span>
                {hasTrades && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        dayPnl > 0 ? "bg-green" : dayPnl < 0 ? "bg-red" : "bg-yellow"
                      }`} />
                      <p className={`text-[0.75rem] font-medium ${
                        dayPnl >= 0 ? "text-green" : "text-red"
                      }`}>
                        {dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(0)}
                      </p>
                    </div>
                    <p className="text-[0.6rem] text-text-muted mt-0.5">
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
