import type { AppGoal } from "@/types/app-settings";
import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";
import { buildMonthlyCoachMessage, type CoachMessage } from "@/lib/ai/coach-message";
import { predictGoalCompletion, type GoalPrediction } from "@/lib/ai/goal-predictions";
import { analyzeSpendingHabits, type SpendingHabitInsight } from "@/lib/ai/spending-habits";

export type WeeklyCoachInsight = {
  weekLabel: string;
  headline: string;
  body: string;
};

export type FinancialCoachReport = {
  coach: CoachMessage;
  weekly: WeeklyCoachInsight;
  goalPredictions: GoalPrediction[];
  spendingHabits: SpendingHabitInsight[];
};

function buildWeeklyInsight(context: AnonymizedBudgetContext): WeeklyCoachInsight {
  const now = new Date();
  const weekLabel = `Week of ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  if (context.daysUntilNextPaycheck !== null && context.daysUntilNextPaycheck <= 3) {
    return {
      weekLabel,
      headline: "Paycheck week — protect your buffer",
      body: `Payday is in ${context.daysUntilNextPaycheck} days. You have $${context.moneyLeftToSpend} safe to spend and ${context.upcomingBillsCount} bills ($${context.upcomingBillsTotal}) ahead. Pay essentials first, then assign leftovers to goals.`,
    };
  }

  if (context.payFrequency === "bi-weekly") {
    return {
      weekLabel,
      headline: "Bi-weekly rhythm check",
      body: `Mid-cycle with $${context.moneyLeftToSpend} safe to spend. ${context.categoriesUnderBudget} categories on track. ${context.categoriesOverBudget > 0 ? `Recalibrate ${context.categoriesOverBudget} over-budget categories before the next 14-day stretch.` : "Keep steady — you're aligned with your paycheck plan."}`,
    };
  }

  return {
    weekLabel,
    headline: "This week's focus",
    body: `Spent $${context.expensesThisMonth} of $${context.incomeThisMonth} income. Projected month-end balance: $${context.projectedEndOfMonthBalance}.`,
  };
}

export function buildFinancialCoachReport(
  context: AnonymizedBudgetContext,
  goals: AppGoal[] = []
): FinancialCoachReport {
  return {
    coach: buildMonthlyCoachMessage(context),
    weekly: buildWeeklyInsight(context),
    goalPredictions: predictGoalCompletion(goals, context),
    spendingHabits: analyzeSpendingHabits(context),
  };
}
