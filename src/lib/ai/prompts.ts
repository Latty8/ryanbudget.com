import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export const INSIGHT_SYSTEM_PROMPT = `You are a calm, encouraging personal finance coach for a paycheck-based budgeting app.
Respond with JSON only: { "insights": [{ "id": string, "tone": "positive"|"warning"|"neutral", "title": string, "body": string }] }
Rules:
- Use 3-4 insights max.
- Reference only the anonymized aggregates provided — never invent merchant names or exact transaction details.
- Be specific with numbers from the data.
- Mention bi-weekly pay patterns when relevant.
- Keep each body under 160 characters.`;

export function buildInsightsUserPrompt(context: AnonymizedBudgetContext): string {
  return `Monthly snapshot (${context.monthLabel}):
- Balance: ${context.totalBalance} ${context.currency}
- Income: ${context.incomeThisMonth}, Expenses: ${context.expensesThisMonth}
- Safe to spend: ${context.moneyLeftToSpend}, Projected month-end: ${context.projectedEndOfMonthBalance}
- Pay frequency: ${context.payFrequency}, Days to next paycheck: ${context.daysUntilNextPaycheck ?? "unknown"}
- Categories under budget: ${context.categoriesUnderBudget}, over: ${context.categoriesOverBudget}
- Upcoming bills: ${context.upcomingBillsCount} totaling ${context.upcomingBillsTotal}
- Category breakdown: ${JSON.stringify(context.categoryTotals)}
- Largest increases: ${JSON.stringify(context.topSpendingIncreases)}

Generate: monthly summary, one anomaly if any category is >15% over, one savings advice for bi-weekly pay, one practical tip.`;
}

export function buildWhatIfPrompt(
  context: AnonymizedBudgetContext,
  scenario: { category: string; reductionPct: number }
): string {
  const row = context.categoryTotals.find((c) => c.name.toLowerCase() === scenario.category.toLowerCase());
  const monthlySavings = row ? Math.round((row.spent * scenario.reductionPct) / 100) : 0;
  return `What-if: user reduces "${scenario.category}" spending by ${scenario.reductionPct}%.
Current spent in category: ${row?.spent ?? 0}. Estimated monthly savings: ~${monthlySavings} ${context.currency}.
Safe to spend today: ${context.moneyLeftToSpend}. Pay frequency: ${context.payFrequency}.
Reply in 2-3 short sentences, encouraging and specific. No JSON.`;
}
