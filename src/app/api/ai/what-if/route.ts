import { NextResponse } from "next/server";
import { buildAnonymizedContext } from "@/lib/ai/anonymized-context";
import { generateWhatIfAnswer } from "@/lib/ai/generate-ai-insights";
import { rateLimit } from "@/lib/api/rate-limit";
import type { DashboardSummary } from "@/types/finance";
import type { AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`ai-whatif:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as {
    summary: DashboardSummary;
    categories: AppCategory[];
    transactions?: DemoTransaction[];
    currency?: string;
    category: string;
    reductionPct: number;
  };

  if (!body.summary || !body.category || body.reductionPct <= 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const context = buildAnonymizedContext({
    summary: body.summary,
    categories: body.categories ?? [],
    transactions: body.transactions ?? [],
    currency: body.currency,
  });

  const result = await generateWhatIfAnswer(context, {
    category: body.category,
    reductionPct: Math.min(100, body.reductionPct),
  });

  return NextResponse.json(result);
}
