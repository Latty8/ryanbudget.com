import { generateInsights, type DashboardInsight } from "@/lib/insights/generate-insights";
import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";
import { INSIGHT_SYSTEM_PROMPT, buildInsightsUserPrompt, buildWhatIfPrompt } from "@/lib/ai/prompts";
import type { BillProjection, PaycheckProjection } from "@/types/finance";

type GenerateOptions = {
  context: AnonymizedBudgetContext;
  fallbackInput: {
    moneyLeftToSpend: number;
    expensesThisMonth: number;
    incomeThisMonth: number;
    diningSpent: number;
    diningLastMonth: number;
    upcomingPaychecks: PaycheckProjection[];
    upcomingBills: BillProjection[];
  };
};

function ruleBasedFromContext(context: AnonymizedBudgetContext): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  insights.push({
    id: "ai-summary",
    tone: context.categoriesOverBudget === 0 ? "positive" : "neutral",
    title:
      context.categoriesOverBudget === 0
        ? `You're doing great — under budget in ${context.categoriesUnderBudget} categories`
        : `On track in ${context.categoriesUnderBudget} of ${context.categoriesUnderBudget + context.categoriesOverBudget} categories`,
    body: `Spent $${context.expensesThisMonth} of $${context.incomeThisMonth} income with $${context.moneyLeftToSpend} safe to spend.`,
  });

  const anomaly = context.topSpendingIncreases[0];
  if (anomaly && anomaly.deltaPct >= 15) {
    insights.push({
      id: "ai-anomaly",
      tone: "warning",
      title: `${anomaly.name} spending +${anomaly.deltaPct}% vs budget`,
      body: `This category is running hot. Consider a weekly cap until your next paycheck.`,
    });
  }

  const savingsTarget = Math.max(50, Math.round(context.incomeThisMonth * 0.1));
  insights.push({
    id: "ai-advice",
    tone: "positive",
    title: "Bi-weekly savings suggestion",
    body:
      context.payFrequency === "bi-weekly"
        ? `With bi-weekly pay, try moving $${savingsTarget} to savings right after each paycheck.`
        : `Set aside $${savingsTarget} after income lands to stay ahead of bills.`,
  });

  return insights;
}

async function callOpenAI(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content ?? null;
}

async function callGrok(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY ?? process.env.GROK_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROK_MODEL ?? "grok-2-latest",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content ?? null;
}

function parseInsightsJson(raw: string): DashboardInsight[] | null {
  try {
    const parsed = JSON.parse(raw) as { insights?: DashboardInsight[] };
    if (!Array.isArray(parsed.insights)) return null;
    return parsed.insights
      .filter((row) => row.title && row.body)
      .slice(0, 4)
      .map((row, idx) => ({
        id: row.id ?? `ai-${idx}`,
        tone: row.tone ?? "neutral",
        title: row.title,
        body: row.body,
      }));
  } catch {
    return null;
  }
}

export async function generateAiInsights(options: GenerateOptions): Promise<{
  insights: DashboardInsight[];
  source: "openai" | "grok" | "rules";
}> {
  const userPrompt = buildInsightsUserPrompt(options.context);
  const openAiRaw = await callOpenAI(INSIGHT_SYSTEM_PROMPT, userPrompt);
  const openAiInsights = openAiRaw ? parseInsightsJson(openAiRaw) : null;
  if (openAiInsights?.length) return { insights: openAiInsights, source: "openai" };

  const grokRaw = await callGrok(INSIGHT_SYSTEM_PROMPT, userPrompt);
  const grokInsights = grokRaw ? parseInsightsJson(grokRaw) : null;
  if (grokInsights?.length) return { insights: grokInsights, source: "grok" };

  const rules = ruleBasedFromContext(options.context);
  const legacy = generateInsights(options.fallbackInput);
  const merged = [...rules, ...legacy.filter((r) => !rules.some((x) => x.title === r.title))].slice(0, 4);
  return { insights: merged, source: "rules" };
}

export async function generateWhatIfAnswer(
  context: AnonymizedBudgetContext,
  scenario: { category: string; reductionPct: number }
): Promise<{ answer: string; source: "openai" | "grok" | "rules" }> {
  const userPrompt = buildWhatIfPrompt(context, scenario);
  const row = context.categoryTotals.find((c) => c.name.toLowerCase() === scenario.category.toLowerCase());
  const savings = row ? Math.round((row.spent * scenario.reductionPct) / 100) : 0;

  const openAi = await callOpenAI(
    "You are a helpful budgeting assistant. Reply in plain text only, max 3 sentences.",
    userPrompt
  );
  if (openAi) return { answer: openAi.trim(), source: "openai" };

  const grok = await callGrok(
    "You are a helpful budgeting assistant. Reply in plain text only, max 3 sentences.",
    userPrompt
  );
  if (grok) return { answer: grok.trim(), source: "grok" };

  return {
    answer: `Cutting ${scenario.category} by ${scenario.reductionPct}% could free about $${savings}/month — roughly $${Math.round(savings / 2)} per paycheck if you're paid bi-weekly. That could boost your safe-to-spend buffer without touching essentials.`,
    source: "rules",
  };
}
