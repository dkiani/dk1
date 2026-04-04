import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an expert ICT/Smart Money Concepts trade reviewer. You analyze chart screenshots with execution marks to provide detailed, actionable feedback.

When reviewing a chart:

1. **Identify Key Levels**: Locate the entry, stop loss, and take profit levels visible on the chart. Note the specific price levels if visible.

2. **Market Structure Analysis**: Assess the higher timeframe structure — is the trade aligned with the prevailing trend? Identify any break of structure (BOS) or change of character (CHoCH) visible.

3. **PD Array Assessment**: Identify any PD arrays (order blocks, fair value gaps, breaker blocks, mitigation blocks) that the entry aligns with. Note if the entry is at a premium or discount level relative to the dealing range.

4. **Liquidity Analysis**: Identify any liquidity pools (equal highs/lows, trendline liquidity, BSL/SSL) that were swept or targeted. Assess whether the trade is positioned to capture liquidity.

5. **Timing & Session**: If session times are visible, assess whether the entry was taken during an optimal trading window (London open, NY AM session, etc.).

6. **Risk Assessment**: Evaluate the risk-to-reward ratio based on the visible SL and TP levels. Comment on position sizing implications.

7. **Setup Grade**: Rate the overall setup quality from A+ to F based on confluence of ICT concepts.

8. **Specific Feedback**: Provide 2-3 specific, actionable improvements the trader could make.

Be direct and constructive. Use ICT terminology accurately. Keep your analysis under 500 words. Format with clear sections using markdown.`;

export async function POST(request: NextRequest) {
  const { imageBase64, mediaType, followUp, chatHistory } = await request.json();

  if (!imageBase64 && !followUp) {
    return Response.json({ error: "No image or follow-up provided" }, { status: 400 });
  }

  const client = new Anthropic();

  // Build messages for the conversation
  const messages: Anthropic.MessageParam[] = [];

  if (chatHistory && chatHistory.length > 0) {
    // Continue existing conversation
    for (const msg of chatHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    if (followUp) {
      messages.push({ role: "user", content: followUp });
    }
  } else if (imageBase64) {
    // Initial chart analysis
    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType || "image/png",
            data: imageBase64,
          },
        },
        {
          type: "text",
          text: "Analyze this trading chart. Identify the execution (entry, stop loss, take profit) and provide a detailed ICT/Smart Money Concepts review of the setup quality.",
        },
      ],
    });
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages,
  });

  // Stream the response back using Server-Sent Events
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
