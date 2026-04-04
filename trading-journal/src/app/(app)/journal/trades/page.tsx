"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades } from "@/lib/trades";
import { Trade, TradeResult, SetupGrade, TradingSession } from "@/types";
import Link from "next/link";
import { Plus, Search, Download } from "lucide-react";
import { format } from "date-fns";

type ResultFilter = "all" | TradeResult;

export default function JournalTradesPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [sessionFilter, setSessionFilter] = useState<TradingSession | "all">("all");
  const [gradeFilter, setGradeFilter] = useState<SetupGrade | "all">("all");

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid)
      .then((t) => setTrades(t))
      .catch((err) => console.error("Failed to fetch trades:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = trades.filter((t) => {
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (resultFilter !== "all") {
      const tradeResult = t.pnl !== undefined ? (t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : "breakeven") : null;
      if (tradeResult !== resultFilter) return false;
    }
    if (sessionFilter !== "all" && t.session !== sessionFilter) return false;
    if (gradeFilter !== "all" && t.setupGrade !== gradeFilter) return false;
    return true;
  });

  function exportCSV() {
    const headers = ["Date", "Symbol", "Direction", "Entry", "Exit", "SL", "TP", "P&L", "R:R", "Setup", "Grade", "Session", "Notes"];
    const rows = filtered.map((t) => [
      t.entryTime,
      t.symbol,
      t.direction,
      t.entryPrice,
      t.exitPrice ?? "",
      t.stopLoss ?? "",
      t.takeProfit ?? "",
      t.pnl ?? "",
      t.stopLoss && t.exitPrice
        ? (Math.abs((t.exitPrice - t.entryPrice) / (t.entryPrice - t.stopLoss))).toFixed(2)
        : "",
      t.setupType || t.strategy || "",
      t.setupGrade || "",
      t.session || "",
      (t.notes || "").replace(/,/g, ";"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
        <h1 className="text-h1">Trade Journal</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-border text-text-secondary text-[0.8rem] font-sans rounded-[var(--radius-sm)] hover:text-text-primary hover:border-border-hover transition-all duration-150 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link
            href="/journal/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:bg-accent-hover transition-all duration-150 no-underline"
          >
            <Plus className="w-4 h-4" />
            Log Trade
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-bg-input border border-border text-[0.85rem] font-mono text-text-primary placeholder:text-text-tertiary focus:border-accent-teal focus:shadow-[0_0_0_2px_var(--accent-teal-dim)] outline-none transition-all duration-150 rounded-[var(--radius-sm)]"
          />
        </div>

        {/* Result Filter */}
        <div className="flex items-center bg-bg-elevated rounded-[var(--radius-sm)] p-1">
          {(["all", "win", "loss", "breakeven"] as ResultFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              className={`px-3 py-1.5 text-[0.7rem] font-mono uppercase tracking-[0.05em] border-0 cursor-pointer rounded-[var(--radius-sm)] transition-all duration-150 ${
                resultFilter === r
                  ? "bg-accent-teal text-text-inverse"
                  : "bg-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Session Filter */}
        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value as TradingSession | "all")}
          className="px-3 py-2 bg-bg-input border border-border text-[0.8rem] font-mono text-text-secondary rounded-[var(--radius-sm)] outline-none focus:border-accent-teal transition-colors duration-150 cursor-pointer"
        >
          <option value="all">All Sessions</option>
          <option value="London">London</option>
          <option value="NY AM">NY AM</option>
          <option value="NY PM">NY PM</option>
          <option value="Asia">Asia</option>
        </select>

        {/* Grade Filter */}
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value as SetupGrade | "all")}
          className="px-3 py-2 bg-bg-input border border-border text-[0.8rem] font-mono text-text-secondary rounded-[var(--radius-sm)] outline-none focus:border-accent-teal transition-colors duration-150 cursor-pointer"
        >
          <option value="all">All Grades</option>
          <option value="A+">A+</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      {/* Trade Table */}
      {filtered.length === 0 ? (
        <div className="journal-card py-16 text-center">
          <p className="text-body text-text-secondary mb-4">
            {trades.length === 0 ? "No trades logged yet" : "No trades match your filters"}
          </p>
          {trades.length === 0 && (
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:bg-accent-hover transition-all duration-150 no-underline"
            >
              <Plus className="w-4 h-4" />
              Log Your First Trade
            </Link>
          )}
        </div>
      ) : (
        <div className="journal-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Date</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Symbol</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Dir</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Entry</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Exit</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">SL</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">TP</th>
                  <th className="text-right px-4 py-3 text-label border-b border-border">P&L</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Setup</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Grade</th>
                  <th className="text-left px-4 py-3 text-label border-b border-border">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade) => (
                  <tr
                    key={trade.id}
                    className="hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer"
                    onClick={() => (window.location.href = `/journal/${trade.id}`)}
                  >
                    <td className="px-4 py-3 text-data text-text-primary border-b border-border whitespace-nowrap">
                      {format(new Date(trade.entryTime), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-data text-text-primary font-medium border-b border-border">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={`text-data ${trade.direction === "long" ? "text-green" : "text-red"}`}>
                        {trade.direction === "long" ? "▲" : "▼"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-data text-text-secondary border-b border-border">
                      {trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-data text-text-secondary border-b border-border">
                      {trade.exitPrice ? trade.exitPrice.toFixed(2) : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-data text-text-secondary border-b border-border">
                      {trade.stopLoss ? trade.stopLoss.toFixed(2) : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-data text-text-secondary border-b border-border">
                      {trade.takeProfit ? trade.takeProfit.toFixed(2) : "\u2014"}
                    </td>
                    <td className={`px-4 py-3 text-data font-medium text-right border-b border-border ${
                      (trade.pnl ?? 0) > 0 ? "text-green" : (trade.pnl ?? 0) < 0 ? "text-red" : "text-yellow"
                    }`}>
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
                    <td className="px-4 py-3 text-data text-text-tertiary border-b border-border max-w-[150px] truncate">
                      {trade.notes || "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-small">
            Showing {filtered.length} of {trades.length} trades
          </p>
          <p className="text-small">
            Net P&L:{" "}
            <span className={`font-mono font-medium ${filtered.reduce((s, t) => s + (t.pnl ?? 0), 0) >= 0 ? "text-green" : "text-red"}`}>
              ${filtered.reduce((s, t) => s + (t.pnl ?? 0), 0).toFixed(2)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
