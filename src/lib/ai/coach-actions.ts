import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type CoachActionStep = {
  id: string;
  title: string;
  detail: string;
  href?: string;
};

/** Short, encouraging next steps — keeps the coach panel calm, not overwhelming. */
export function buildCoachActionSteps(context: AnonymizedBudgetContext): CoachActionStep[] {
  const steps: CoachActionStep[] = [];

  if (context.daysUntilNextPaycheck !== null && context.daysUntilNextPaycheck <= 5) {
    steps.push({
      id: "pay-bills",
      title: "Cover essentials first",
      detail: `${context.upcomingBillsCount} bill(s) (~$${context.upcomingBillsTotal}) before discretionary spending.`,
      href: "/recurring",
    });
  }

  if (context.moneyLeftToSpend < 150) {
    steps.push({
      id: "tight-buffer",
      title: "Light spending until payday",
      detail: `Only $${context.moneyLeftToSpend} safe to spend — pause non-essentials for a few days.`,
      href: "/transactions",
    });
  } else if (context.payFrequency === "bi-weekly") {
    steps.push({
      id: "biweekly-split",
      title: "Split this paycheck half-and-half",
      detail: `Assign ~$${Math.round(context.moneyLeftToSpend / 2)} to the first week and the rest to week two.`,
      href: "/budgets",
    });
  }

  const topOver = context.categoryTotals
    .filter((c) => c.budgeted > 0 && c.spent > c.budgeted)
    .sort((a, b) => b.spent - b.budgeted - (a.spent - a.budgeted))[0];

  if (topOver) {
    steps.push({
      id: "trim-category",
      title: `Ease up on ${topOver.name}`,
      detail: `About $${topOver.spent - topOver.budgeted} over budget — try the What-if tab to model a trim.`,
      href: "/dashboard",
    });
  } else if (context.moneyLeftToSpend >= 200) {
    steps.push({
      id: "savings-nudge",
      title: "Move a slice to savings",
      detail: `You have room — consider $${Math.max(25, Math.round(context.incomeThisMonth * 0.05))} after your next deposit.`,
      href: "/goals",
    });
  }

  return steps.slice(0, 3);
}
