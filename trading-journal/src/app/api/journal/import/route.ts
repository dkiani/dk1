import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return Response.json(
    {
      message: "Broker import coming soon. Tradovate, Rithmic, and other broker integrations are in development.",
      supportedBrokers: [],
      status: "coming_soon",
    },
    { status: 501 }
  );
}

export async function GET() {
  return Response.json({
    message: "Broker import API — coming soon",
    supportedBrokers: [],
    status: "coming_soon",
  });
}
