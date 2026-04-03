import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Trade } from "@/types";

export async function POST(request: NextRequest) {
  // TODO: verify user has premium subscription via auth token

  const { trade } = (await request.json()) as { trade: Trade };

  if (!trade) {
    return Response.json({ error: "No trade provided" }, { status: 400 });
  }

  const prompt = buildAnalysisPrompt(trade);

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const analysis =
    message.content[0].type === "text" ? message.content[0].text : "";

  return Response.json({ analysis });
}

function buildAnalysisPrompt(trade: Trade): string {
  const direction = trade.direction === "long" ? "bought" : "shorted";
  const outcome =
    trade.pnl !== undefined
      ? trade.pnl >= 0
        ? `won $${trade.pnl.toFixed(2)}`
        : `lost $${Math.abs(trade.pnl).toFixed(2)}`
      : "still open";

  return `You are an expert trading coach analyzing a student's trade. Be direct, constructive, and specific. Focus on what they can learn and improve.

Trade Details:
- Symbol: ${trade.symbol} (${trade.assetClass})
- Direction: ${direction} ${trade.quantity} contracts
- Entry: $${trade.entryPrice} at ${new Date(trade.entryTime).toLocaleString()}
- Exit: ${trade.exitPrice ? `$${trade.exitPrice} at ${trade.exitTime ? new Date(trade.exitTime).toLocaleString() : "unknown"}` : "Still open"}
- Result: ${outcome}
- Strategy: ${trade.strategy || "Not specified"}
- Time Frame: ${trade.timeFrame || "Not specified"}
- Notes: ${trade.notes || "None"}
${trade.fees ? `- Fees: $${trade.fees}` : ""}

Provide a concise analysis covering:
1. **Trade Assessment** — Was this a well-structured trade based on the info provided?
2. **Risk Management** — Comments on position sizing, entry/exit timing
3. **What went well** — Positive aspects of this trade
4. **What to improve** — Specific, actionable suggestions
5. **Key takeaway** — One sentence the trader should remember

Keep your response under 300 words. Be encouraging but honest.`;
}
