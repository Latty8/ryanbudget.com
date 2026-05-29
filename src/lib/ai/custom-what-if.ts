import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type CustomWhatIfResult = {
  answer: string;
  estimatedMonthlyImpact: number;
  source: "openai" | "grok" | "rules";
};

const PURCHASE_HINTS: Array<{ pattern: RegExp; label: string; defaultMonthly: number }> = [
  { pattern: /car|auto|vehicle|suv|truck/i, label: "vehicle payment", defaultMonthly: 450 },
  { pattern: /house|home|mortgage|rent/i, label: "housing cost", defaultMonthly: 400 },
  { pattern: /phone|iphone|android|mobile plan/i, label: "phone plan", defaultMonthly: 80 },
  { pattern: /subscription|netflix|gym|membership/i, label: "subscription", defaultMonthly: 30 },
  { pattern: /vacation|trip|travel|flight/i, label: "travel", defaultMonthly: 200 },
  { pattern: /wedding|event|party/i, label: "one-time event", defaultMonthly: 150 },
];

function estimateImpact(question: string): { label: string; monthly: number } {
  for (const hint of PURCHASE_HINTS) {
    if (hint.pattern.test(question)) {
      const amountMatch = question.match(/\$?\s*([\d,]+)\s*(?:\/\s*mo(?:nth)?|per\s*month)?/i);
      const monthly = amountMatch
        ? Number.parseFloat(amountMatch[1].replace(/,/g, ""))
        : hint.defaultMonthly;
      return { label: hint.label, monthly };
    }
  }
  const generic = question.match(/\$?\s*([\d,]+)/);
  const monthly = generic ? Number.parseFloat(generic[1].replace(/,/g, "")) : 100;
  return { label: "new expense", monthly };
}

async function callLlm(system: string, user: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (response.ok) {
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return payload.choices?.[0]?.message?.content?.trim() ?? null;
    }
  }

  const grokKey = process.env.XAI_API_KEY ?? process.env.GROK_API_KEY;
  if (grokKey) {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${grokKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROK_MODEL ?? "grok-2-latest",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (response.ok) {
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return payload.choices?.[0]?.message?.content?.trim() ?? null;
    }
  }
  return null;
}

export async function answerCustomWhatIf(
  context: AnonymizedBudgetContext,
  question: string
): Promise<CustomWhatIfResult> {
  const { label, monthly } = estimateImpact(question);
  const perPaycheck =
    context.payFrequency === "bi-weekly" ? Math.round(monthly / 2) : Math.round(monthly / 4);
  const newSafe = context.moneyLeftToSpend - monthly;

  const userPrompt = `User question: "${question}"
Budget context: safe-to-spend $${context.moneyLeftToSpend}, income $${context.incomeThisMonth}/mo, pay ${context.payFrequency}, days to paycheck ${context.daysUntilNextPaycheck ?? "unknown"}.
Estimated ${label} impact ~$${monthly}/mo (~$${perPaycheck} per paycheck).
Reply in 3 short sentences. Be encouraging and practical. No JSON.`;

  const openai = await callLlm(
    "You are a paycheck-based budgeting coach. Never invent PII. Plain text only.",
    userPrompt
  );
  if (openai) {
    return { answer: openai, estimatedMonthlyImpact: monthly, source: "openai" };
  }

  const rulesAnswer =
    newSafe < 0
      ? `A ${label} around $${monthly}/mo would strain your plan — you'd be about $${Math.abs(newSafe)} short of your current safe-to-spend. Wait until after your next paycheck or trim ${context.topSpendingIncreases[0]?.name ?? "flexible"} spending first.`
      : `Adding ~$${monthly}/mo for a ${label} leaves about $${newSafe} safe to spend. That's roughly $${perPaycheck} per ${context.payFrequency === "bi-weekly" ? "paycheck" : "week"} — schedule it right after deposits to stay on track.`;

  return { answer: rulesAnswer, estimatedMonthlyImpact: monthly, source: "rules" };
}
