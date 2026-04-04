"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTrades } from "@/lib/trades";
import { Trade } from "@/types";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

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
        <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[1.5rem] font-medium">Trade Journal</h1>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-[4px] text-[0.75rem] uppercase tracking-[0.1em] font-medium hover:bg-accent-hover transition-colors duration-150 no-underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Trade
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-text-muted" />
          <input
            type="text"
            placeholder="Search by symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border rounded-[4px] text-[0.8rem] text-text-primary placeholder:text-text-muted focus:border-accent outline-none transition-colors duration-150"
          />
        </div>
        <div className="flex items-center border border-border rounded-[4px] overflow-hidden">
          {(["all", "long", "short"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setDirectionFilter(dir)}
              className={`px-3 py-2 text-[0.65rem] uppercase tracking-[0.1em] cursor-pointer transition-colors duration-150 border-0 bg-transparent ${
                directionFilter === dir
                  ? "bg-accent text-white font-medium"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      {/* Trade List */}
      {filtered.length === 0 ? (
        <div className="border border-border rounded-[6px] py-16 text-center bg-bg-surface">
          <p className="text-[0.85rem] text-text-muted mb-4">
            {trades.length === 0 ? "No trades logged yet" : "No trades match your filters"}
          </p>
          {trades.length === 0 && (
            <Link href="/journal/new" className="text-[0.8rem] text-accent hover:text-accent-hover transition-colors no-underline">
              Log your first trade
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-[6px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-medium">Date</th>
                <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-medium">Symbol</th>
                <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-medium">Direction</th>
                <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-medium">Entry</th>
                <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-medium">Exit</th>
                <th className="text-left px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-medium">Qty</th>
                <th className="text-right px-5 py-3 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-b border-border last:border-b-0 bg-bg-surface hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer"
                  onClick={() => (window.location.href = `/journal/${trade.id}`)}
                >
                  <td className="px-5 py-3 text-[0.8rem] text-text-secondary">
                    {new Date(trade.entryTime).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-[0.8rem] font-medium text-text-primary">
                    {trade.symbol}
                  </td>
                  <td className="px-5 py-3 text-[0.8rem] text-text-secondary">
                    {trade.direction}
                  </td>
                  <td className="px-5 py-3 text-[0.8rem] text-text-secondary">
                    ${trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-[0.8rem] text-text-secondary">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "\u2014"}
                  </td>
                  <td className="px-5 py-3 text-[0.8rem] text-text-secondary">
                    {trade.quantity}
                  </td>
                  <td className={`px-5 py-3 text-[0.8rem] font-medium text-right ${(trade.pnl ?? 0) >= 0 ? "text-green" : "text-red"}`}>
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
