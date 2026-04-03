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
    getTrades(user.uid).then((t) => {
      setTrades(t);
      setLoading(false);
    });
  }, [user]);

  const filtered = trades.filter((t) => {
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (directionFilter !== "all" && t.direction !== directionFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Trade Journal</h1>
        <Link
          href="/journal/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md text-xs hover:bg-accent-hover transition-colors no-underline"
        >
          <Plus className="w-3 h-3" />
          Log Trade
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search by symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:border-accent outline-none"
          />
        </div>
        <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
          {(["all", "long", "short"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setDirectionFilter(dir)}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider cursor-pointer transition-colors ${
                directionFilter === dir
                  ? "bg-accent text-white"
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
        <div className="bg-bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-sm text-text-muted mb-3">
            {trades.length === 0 ? "No trades logged yet" : "No trades match your filters"}
          </p>
          {trades.length === 0 && (
            <Link href="/journal/new" className="text-xs text-accent hover:underline">
              Log your first trade
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  Symbol
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  Direction
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  Entry
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  Exit
                </th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  Qty
                </th>
                <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((trade) => (
                <tr
                  key={trade.id}
                  className="hover:bg-bg-tertiary transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/journal/${trade.id}`)}
                >
                  <td className="px-5 py-3 text-xs text-text-secondary">
                    {new Date(trade.entryTime).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-text-primary">
                    {trade.symbol}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                        trade.direction === "long"
                          ? "bg-green-bg text-green"
                          : "bg-red-bg text-red"
                      }`}
                    >
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-secondary">
                    ${trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-xs text-text-secondary">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-text-secondary">
                    {trade.quantity}
                  </td>
                  <td
                    className={`px-5 py-3 text-xs font-medium text-right ${
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
