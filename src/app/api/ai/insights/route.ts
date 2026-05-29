import { NextResponse } from "next/server";
import { buildAnonymizedContext } from "@/lib/ai/anonymized-context";
import { generateAiInsights } from "@/lib/ai/generate-ai-insights";
import { rateLimit } from "@/lib/api/rate-limit";
import type { DashboardSummary } from "@/types/finance";
import type { AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`ai-insights:${ip}`, 15, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = (await request.json()) as {
    summary: DashboardSummary;
    categories: AppCategory[];
    transactions: DemoTransaction[];
    currency?: string;
  };

  if (!body.summary || !body.categories) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const context = buildAnonymizedContext({
    summary: body.summary,
    categories: body.categories,
    transactions: body.transactions ?? [],
    currency: body.currency,
  });

  const dining = context.categoryTotals.find((c) => c.name === "Dining");
  const result = await generateAiInsights({
    context,
    fallbackInput: {
      moneyLeftToSpend: body.summary.moneyLeftToSpend,
      expensesThisMonth: body.summary.expensesThisMonth,
      incomeThisMonth: body.summary.incomeThisMonth,
      diningSpent: dining?.spent ?? 0,
      diningLastMonth: dining ? dining.spent * 0.78 : 0,
      upcomingPaychecks: body.summary.upcomingPaychecks,
      upcomingBills: body.summary.upcomingBills,
    },
  });

  return NextResponse.json({ ...result, context });
}
