"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades } from "@/lib/trades";
import { Trade } from "@/types";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";

export default function JournalPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"all" | "long" | "short">("all");

  useEffect(() => {
    if (!user) return;
    getTrades(user.uid)
      .then((t) => setTrades(t))
      .catch((err) => console.error("Failed to fetch trades:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = trades.filter((t) => {
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (directionFilter !== "all" && t.direction !== directionFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-4 h-4 border-[1.5px] border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[840px] animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-sm font-medium tracking-tight">Trade Journal</h1>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white rounded-[3px] text-[11px] font-medium hover:bg-accent-hover transition-all duration-200 no-underline"
        >
          <Plus className="w-3 h-3" />
          Log Trade
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
          <input
            type="text"
            placeholder="Search by symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-bg-input border border-border rounded-[3px] text-[11px] text-text-primary placeholder:text-text-muted focus:border-accent outline-none transition-colors duration-200"
          />
        </div>
        <div className="flex items-center border border-border rounded-[3px] overflow-hidden">
          {(["all", "long", "short"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setDirectionFilter(dir)}
              className={`px-3 py-2 text-[10px] uppercase tracking-[0.06em] cursor-pointer transition-all duration-200 border-0 bg-transparent ${
                directionFilter === dir
                  ? "bg-accent text-white font-medium"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      {/* Trade List */}
      {filtered.length === 0 ? (
        <div className="border border-border rounded-[3px] py-16 text-center bg-bg-card">
          <p className="text-[11px] text-text-muted mb-4">
            {trades.length === 0 ? "No trades logged yet" : "No trades match your filters"}
          </p>
          {trades.length === 0 && (
            <Link href="/journal/new" className="text-[11px] text-accent hover:text-accent-hover transition-colors no-underline">
              Log your first trade
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-[3px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-card">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.06em] text-text-muted font-medium">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.06em] text-text-muted font-medium">
                  Symbol
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.06em] text-text-muted font-medium">
                  Direction
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.06em] text-text-muted font-medium">
                  Entry
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.06em] text-text-muted font-medium">
                  Exit
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.06em] text-text-muted font-medium">
                  Qty
                </th>
                <th className="text-right px-5 py-3 text-[10px] uppercase tracking-[0.06em] text-text-muted font-medium">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((trade) => (
                <tr
                  key={trade.id}
                  className="bg-bg-card hover:bg-bg-tertiary transition-all duration-200 cursor-pointer"
                  onClick={() => (window.location.href = `/journal/${trade.id}`)}
                >
                  <td className="px-5 py-3 text-[11px] text-text-secondary">
                    {new Date(trade.entryTime).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-[11px] font-medium text-text-primary">
                    {trade.symbol}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[9px] uppercase font-medium px-2 py-0.5 rounded-[2px] tracking-wider ${
                        trade.direction === "long"
                          ? "bg-green-bg text-green"
                          : "bg-red-bg text-red"
                      }`}
                    >
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-text-secondary">
                    ${trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-[11px] text-text-secondary">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "\u2014"}
                  </td>
                  <td className="px-5 py-3 text-[11px] text-text-secondary">
                    {trade.quantity}
                  </td>
                  <td
                    className={`px-5 py-3 text-[11px] font-medium text-right ${
                      (trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"
                    }`}
                  >
                    {(trade.pnl ?? 0) >= 0 ? "+" : ""}${(trade.pnl ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
