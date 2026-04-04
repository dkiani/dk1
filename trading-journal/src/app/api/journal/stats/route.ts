import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  const db = getAdminDb();
  const snapshot = await db
    .collection("trades")
    .where("userId", "==", userId)
    .where("status", "==", "closed")
    .get();

  const trades = snapshot.docs.map((doc) => doc.data());

  const totalTrades = trades.length;
  const wins = trades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = trades.filter((t) => (t.pnl ?? 0) < 0);
  const breakeven = trades.filter((t) => (t.pnl ?? 0) === 0);

  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  const biggestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl ?? 0)) : 0;
  const biggestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl ?? 0)) : 0;

  // Calculate streaks
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
  );

  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempStreak = 0;
  let lastResult: "win" | "loss" | null = null;

  for (const trade of sortedTrades) {
    const isWin = (trade.pnl ?? 0) > 0;
    const result = isWin ? "win" : "loss";

    if (result === lastResult) {
      tempStreak++;
    } else {
      tempStreak = 1;
      lastResult = result;
    }

    if (result === "win") maxWinStreak = Math.max(maxWinStreak, tempStreak);
    else maxLossStreak = Math.max(maxLossStreak, tempStreak);
  }

  // Current streak
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

  // Trading days
  const tradingDays = new Set(trades.map((t) => (t.entryTime as string).split("T")[0])).size;

  return Response.json({
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    totalPnl,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    biggestWin,
    biggestLoss,
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    tradingDays,
  });
}
