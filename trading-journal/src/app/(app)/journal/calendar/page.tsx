"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades, getTradesByDate } from "@/lib/trades";
import { Trade } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, getDay, isToday } from "date-fns";

export default function JournalCalendarPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid).then((t) => setTrades(t)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const tradesByDate = getTradesByDate(trades.filter((t) => t.status === "closed"));
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const monthTrades = days.flatMap((d) => tradesByDate[format(d, "yyyy-MM-dd")] || []);
  const monthPnl = monthTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const greenDays = days.filter((d) => { const dt = tradesByDate[format(d, "yyyy-MM-dd")]; return dt && dt.reduce((s, t) => s + (t.pnl ?? 0), 0) > 0; }).length;
  const redDays = days.filter((d) => { const dt = tradesByDate[format(d, "yyyy-MM-dd")]; return dt && dt.reduce((s, t) => s + (t.pnl ?? 0), 0) < 0; }).length;
  const selectedTrades = selectedDay ? tradesByDate[selectedDay] || [] : [];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-[1.5rem] font-bold tracking-[-0.02em]">P&L Calendar</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className={`text-[0.9rem] font-mono font-semibold ${monthPnl >= 0 ? "text-green" : "text-red"}`}>
            {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
          </span>
          <span className="text-[0.8rem] text-text-tertiary">
            <span className="text-green">{greenDays}↑</span> / <span className="text-red">{redDays}↓</span>
          </span>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2.5 rounded-[10px] bg-bg-surface border border-border hover:border-border-hover transition-all duration-200 cursor-pointer"><ChevronLeft className="w-5 h-5 text-text-secondary" /></button>
        <h2 className="text-[1.1rem] font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2.5 rounded-[10px] bg-bg-surface border border-border hover:border-border-hover transition-all duration-200 cursor-pointer"><ChevronRight className="w-5 h-5 text-text-secondary" /></button>
      </div>

      {/* Grid */}
      <div className="bg-bg-surface border border-border rounded-[16px] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[rgba(255,255,255,0.04)]">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="px-3 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad === 0 ? 6 : startPad - 1 }).map((_, i) => (
            <div key={`p-${i}`} className="h-[90px] border-b border-r border-[rgba(255,255,255,0.03)]" />
          ))}
          {days.map((day) => {
            const ds = format(day, "yyyy-MM-dd");
            const dt = tradesByDate[ds] || [];
            const pnl = dt.reduce((s, t) => s + (t.pnl ?? 0), 0);
            const has = dt.length > 0;
            const td = isToday(day);
            const sel = selectedDay === ds;
            return (
              <div key={ds} onClick={() => setSelectedDay(sel ? null : ds)}
                className={`h-[90px] border-b border-r border-[rgba(255,255,255,0.03)] p-2.5 cursor-pointer transition-all duration-200 ${
                  td ? "ring-1 ring-inset ring-accent-teal/40" : ""
                } ${sel ? "bg-accent-teal/8" : has ? (pnl > 0 ? "bg-green/[0.03] hover:bg-green/[0.06]" : pnl < 0 ? "bg-red/[0.03] hover:bg-red/[0.06]" : "hover:bg-bg-surface-hover") : "hover:bg-bg-surface-hover"}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[0.75rem] font-medium ${td ? "text-accent-teal" : "text-text-tertiary"}`}>{format(day, "d")}</span>
                  {has && <span className={`w-2 h-2 rounded-full ${pnl > 0 ? "bg-green" : pnl < 0 ? "bg-red" : "bg-yellow"}`} />}
                </div>
                {has && (
                  <div className="mt-1.5">
                    <p className={`text-[0.8rem] font-mono font-semibold ${pnl >= 0 ? "text-green" : "text-red"}`}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}</p>
                    <p className="text-[0.65rem] text-text-tertiary">{dt.length} trade{dt.length > 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && selectedTrades.length > 0 && (
        <div className="bg-bg-surface border border-border rounded-[16px] shadow-[var(--shadow-card)] overflow-hidden animate-fade-in-up">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.04)]">
            <h3 className="text-[1rem] font-semibold">{format(new Date(selectedDay), "EEEE, MMMM d, yyyy")}</h3>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-[rgba(255,255,255,0.04)]">
              {["Symbol","Dir","Entry","Exit","P&L","Setup"].map((h) => <th key={h} className={`text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary px-5 py-3 ${h === "P&L" ? "text-right" : "text-left"}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {selectedTrades.map((t) => (
                <tr key={t.id} onClick={() => (window.location.href = `/journal/${t.id}`)} className="border-b border-[rgba(255,255,255,0.03)] last:border-b-0 hover:bg-bg-surface-hover transition-colors cursor-pointer">
                  <td className="px-5 py-3 text-[0.8rem] font-semibold text-text-primary">{t.symbol}</td>
                  <td className="px-5 py-3"><span className={`text-[0.75rem] font-medium px-2 py-0.5 rounded-[6px] ${t.direction === "long" ? "bg-green-bg text-green" : "bg-red-bg text-red"}`}>{t.direction === "long" ? "▲ long" : "▼ short"}</span></td>
                  <td className="px-5 py-3 text-[0.8rem] font-mono text-text-secondary">{t.entryPrice.toFixed(2)}</td>
                  <td className="px-5 py-3 text-[0.8rem] font-mono text-text-secondary">{t.exitPrice ? t.exitPrice.toFixed(2) : "—"}</td>
                  <td className={`px-5 py-3 text-[0.8rem] font-mono font-semibold text-right ${(t.pnl ?? 0) >= 0 ? "text-green" : "text-red"}`}>{(t.pnl ?? 0) >= 0 ? "+" : ""}${(t.pnl ?? 0).toFixed(2)}</td>
                  <td className="px-5 py-3 text-[0.8rem] text-text-secondary">{t.setupType || t.strategy || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
