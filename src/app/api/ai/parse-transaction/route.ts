import { NextResponse } from "next/server";
import { parseNaturalLanguageWithAi } from "@/lib/ai/parse-transaction-llm";
import { rateLimit } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`ai-parse:${ip}`, 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const premium =
    request.headers.get("x-premium") === "true" || request.headers.get("x-demo") === "true";

  const result = premium
    ? await parseNaturalLanguageWithAi(body.text)
    : null;

  if (!result) {
    const { parseNaturalLanguageTransaction } = await import("@/lib/ai/parse-transaction");
    const parsed = parseNaturalLanguageTransaction(body.text);
    if (!parsed) {
      return NextResponse.json({ error: "Could not parse transaction" }, { status: 422 });
    }
    return NextResponse.json({ parsed, source: "rules" });
  }

  return NextResponse.json({ parsed: result.parsed, source: result.source });
}
