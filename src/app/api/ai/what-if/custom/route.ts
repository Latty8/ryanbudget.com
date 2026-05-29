import { NextResponse } from "next/server";
import { buildAnonymizedContext } from "@/lib/ai/anonymized-context";
import { answerCustomWhatIf } from "@/lib/ai/custom-what-if";
import { rateLimit } from "@/lib/api/rate-limit";
import type { DashboardSummary } from "@/types/finance";
import type { AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`ai-whatif-custom:${ip}`, 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const premium = request.headers.get("x-premium") === "true";
  if (!premium) {
    return NextResponse.json({ error: "Custom what-if is a Premium feature" }, { status: 403 });
  }

  const body = (await request.json()) as {
    summary: DashboardSummary;
    categories?: AppCategory[];
    transactions?: DemoTransaction[];
    currency?: string;
    question: string;
  };

  if (!body.summary || !body.question?.trim()) {
    return NextResponse.json({ error: "summary and question are required" }, { status: 400 });
  }

  const context = buildAnonymizedContext({
    summary: body.summary,
    categories: body.categories ?? [],
    transactions: body.transactions ?? [],
    currency: body.currency,
  });

  const result = await answerCustomWhatIf(context, body.question.trim());
  return NextResponse.json(result);
}
