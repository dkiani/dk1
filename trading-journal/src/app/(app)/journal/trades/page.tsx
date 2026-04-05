"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades } from "@/lib/trades";
import { Trade, TradeResult, SetupGrade, TradingSession } from "@/types";
import Link from "next/link";
import { Plus, Search, Download, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function JournalTradesPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | TradeResult>("all");
  const [sessionFilter, setSessionFilter] = useState<TradingSession | "all">("all");
  const [gradeFilter, setGradeFilter] = useState<SetupGrade | "all">("all");

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid).then((t) => setTrades(t)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const filtered = trades.filter((t) => {
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (resultFilter !== "all") {
      const r = t.pnl !== undefined ? (t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : "breakeven") : null;
      if (r !== resultFilter) return false;
    }
    if (sessionFilter !== "all" && t.session !== sessionFilter) return false;
    if (gradeFilter !== "all" && t.setupGrade !== gradeFilter) return false;
    return true;
  });

  function exportCSV() {
    const headers = ["Date","Symbol","Direction","Entry","Exit","SL","TP","P&L","Setup","Grade","Session","Notes"];
    const rows = filtered.map((t) => [t.entryTime, t.symbol, t.direction, t.entryPrice, t.exitPrice ?? "", t.stopLoss ?? "", t.takeProfit ?? "", t.pnl ?? "", t.setupType || t.strategy || "", t.setupGrade || "", t.session || "", (t.notes || "").replace(/,/g, ";")]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `trades-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls = "px-3.5 py-2.5 bg-bg-input border border-[rgba(255,255,255,0.06)] rounded-[10px] text-[0.8rem] text-text-secondary outline-none focus:border-accent-teal/30 transition-colors cursor-pointer";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.5rem] font-bold tracking-[-0.02em]">Trade Journal</h1>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border rounded-[12px] text-[0.8rem] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200 cursor-pointer">
            <Download className="w-4 h-4" />Export
          </button>
          <Link href="/journal/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[0.85rem] font-semibold rounded-[12px] hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,93,58,0.25)] transition-all duration-200 no-underline">
            <Plus className="w-4 h-4" />Log Trade
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input type="text" placeholder="Search symbols..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[0.85rem] text-text-primary placeholder:text-text-tertiary focus:border-accent-teal/30 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.08)] outline-none transition-all duration-200" />
        </div>
        <div className="flex items-center bg-bg-surface rounded-[10px] p-1 border border-border">
          {(["all", "win", "loss", "breakeven"] as ("all" | TradeResult)[]).map((r) => (
            <button key={r} onClick={() => setResultFilter(r)}
              className={`px-3.5 py-1.5 text-[0.75rem] font-semibold border-0 cursor-pointer rounded-[8px] transition-all duration-200 ${
                resultFilter === r ? "bg-gradient-to-r from-accent-teal to-[#14b8a6] text-text-inverse shadow-[0_2px_8px_rgba(45,212,191,0.15)]" : "bg-transparent text-text-tertiary hover:text-text-secondary"
              }`}>{r}</button>
          ))}
        </div>
        <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value as TradingSession | "all")} className={selectCls}>
          <option value="all">All Sessions</option><option value="London">London</option><option value="NY AM">NY AM</option><option value="NY PM">NY PM</option><option value="Asia">Asia</option>
        </select>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value as SetupGrade | "all")} className={selectCls}>
          <option value="all">All Grades</option><option value="A+">A+</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-[16px] py-16 text-center shadow-[var(--shadow-card)]">
          <div className="w-14 h-14 rounded-[16px] bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4"><BookOpen className="w-6 h-6 text-text-tertiary" /></div>
          <p className="text-[0.95rem] font-medium text-text-secondary mb-2">{trades.length === 0 ? "No trades logged yet" : "No trades match filters"}</p>
          {trades.length === 0 && <Link href="/journal/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[0.85rem] font-semibold rounded-[12px] hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,93,58,0.25)] transition-all duration-200 no-underline mt-3"><Plus className="w-4 h-4" />Log Your First Trade</Link>}
        </div>
      ) : (
        <div className="bg-bg-surface border border-border rounded-[16px] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.04)]">
                  {["Date","Symbol","Dir","Entry","Exit","SL","TP","P&L","Setup","Grade","Notes"].map((h) => (
                    <th key={h} className={`text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary px-5 py-3.5 ${h === "P&L" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} onClick={() => (window.location.href = `/journal/${t.id}`)} className="border-b border-[rgba(255,255,255,0.03)] last:border-b-0 hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer">
                    <td className="px-5 py-3.5 text-[0.8rem] text-text-secondary whitespace-nowrap">{format(new Date(t.entryTime), "MMM d, yy")}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-semibold text-text-primary">{t.symbol}</td>
                    <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1 text-[0.75rem] font-medium px-2 py-0.5 rounded-[6px] ${t.direction === "long" ? "bg-green-bg text-green" : "bg-red-bg text-red"}`}>{t.direction === "long" ? "▲" : "▼"}</span></td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-mono text-text-secondary">{t.entryPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-mono text-text-secondary">{t.exitPrice ? t.exitPrice.toFixed(2) : "—"}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-mono text-text-secondary">{t.stopLoss ? t.stopLoss.toFixed(2) : "—"}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] font-mono text-text-secondary">{t.takeProfit ? t.takeProfit.toFixed(2) : "—"}</td>
                    <td className={`px-5 py-3.5 text-[0.8rem] font-mono font-semibold text-right ${(t.pnl ?? 0) > 0 ? "text-green" : (t.pnl ?? 0) < 0 ? "text-red" : "text-yellow"}`}>{(t.pnl ?? 0) >= 0 ? "+" : ""}${(t.pnl ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] text-text-secondary">{t.setupType || t.strategy || "—"}</td>
                    <td className="px-5 py-3.5">{t.setupGrade ? <span className={`px-2.5 py-1 text-[0.7rem] font-semibold rounded-[8px] ${t.setupGrade === "A+" ? "bg-accent-teal-dim text-accent-teal" : t.setupGrade === "A" ? "bg-green-bg text-green" : t.setupGrade === "B" ? "bg-[rgba(234,179,8,0.1)] text-yellow" : "bg-red-bg text-red"}`}>{t.setupGrade}</span> : <span className="text-text-tertiary">—</span>}</td>
                    <td className="px-5 py-3.5 text-[0.8rem] text-text-tertiary max-w-[120px] truncate">{t.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(255,255,255,0.04)] bg-bg-primary/30">
            <p className="text-[0.75rem] text-text-tertiary">{filtered.length} of {trades.length} trades</p>
            <p className="text-[0.75rem] text-text-tertiary">Net: <span className={`font-mono font-semibold ${filtered.reduce((s, t) => s + (t.pnl ?? 0), 0) >= 0 ? "text-green" : "text-red"}`}>${filtered.reduce((s, t) => s + (t.pnl ?? 0), 0).toFixed(2)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
