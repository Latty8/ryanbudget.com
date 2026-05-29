import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type SpendingHabitInsight = {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
};

export function analyzeSpendingHabits(context: AnonymizedBudgetContext): SpendingHabitInsight[] {
  const habits: SpendingHabitInsight[] = [];

  const overspenders = context.categoryTotals
    .filter((c) => c.budgeted > 0 && c.spent > c.budgeted)
    .sort((a, b) => b.spent - b.budgeted - (a.spent - a.budgeted));

  if (overspenders.length > 0) {
    const top = overspenders[0];
    habits.push({
      id: "habit-overspend",
      title: `${top.name} runs over budget`,
      detail: `Spent $${top.spent} vs $${top.budgeted} budgeted (+${top.deltaPct}%). Trim here first before your next paycheck.`,
      tone: "warning",
    });
  }

  const steady = context.categoryTotals.filter(
    (c) => c.budgeted > 0 && c.spent <= c.budgeted && c.spent >= c.budgeted * 0.5
  );
  if (steady.length >= 3) {
    habits.push({
      id: "habit-steady",
      title: "Steady spending in core categories",
      detail: `${steady.length} categories are on pace — keep your current rhythm through the pay period.`,
      tone: "positive",
    });
  }

  if (context.payFrequency === "bi-weekly" && context.daysUntilNextPaycheck !== null) {
    if (context.daysUntilNextPaycheck <= 4 && context.moneyLeftToSpend < context.incomeThisMonth * 0.15) {
      habits.push({
        id: "habit-paycheck-gap",
        title: "Pre-paycheck squeeze",
        detail: `Only ${context.daysUntilNextPaycheck} days until payday with $${context.moneyLeftToSpend} safe to spend. Delay discretionary purchases until after deposit.`,
        tone: "warning",
      });
    } else if (context.daysUntilNextPaycheck > 7) {
      habits.push({
        id: "habit-mid-cycle",
        title: "Mid pay-cycle window",
        detail: "Good time to assign dollars to goals or bills due before your next bi-weekly deposit.",
        tone: "neutral",
      });
    }
  }

  const increases = context.topSpendingIncreases[0];
  if (increases && increases.deltaPct >= 20) {
    habits.push({
      id: "habit-spike",
      title: `${increases.name} trending up`,
      detail: `Up ${increases.deltaPct}% vs budget — set a weekly cap or use cash for this category.`,
      tone: "warning",
    });
  }

  return habits.slice(0, 4);
}
