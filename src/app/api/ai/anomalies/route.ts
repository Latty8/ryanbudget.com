import { NextResponse } from "next/server";
import { buildAnonymizedContext } from "@/lib/ai/anonymized-context";
import { detectSpendingAnomalies } from "@/lib/ai/detect-anomalies";
import { rateLimit } from "@/lib/api/rate-limit";
import type { DashboardSummary } from "@/types/finance";
import type { AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`ai-anomalies:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as {
    summary: DashboardSummary;
    categories?: AppCategory[];
    transactions?: DemoTransaction[];
    currency?: string;
  };

  if (!body.summary) {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }

  const context = buildAnonymizedContext({
    summary: body.summary,
    categories: body.categories ?? [],
    transactions: body.transactions ?? [],
    currency: body.currency,
  });

  return NextResponse.json({ anomalies: detectSpendingAnomalies(context) });
}
