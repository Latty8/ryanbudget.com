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
      headline: "Almost payday — you've got this",
      body: `Payday is in ${context.daysUntilNextPaycheck} days. You have $${context.moneyLeftToSpend} safe to spend with ${context.upcomingBillsCount} bill(s) (~$${context.upcomingBillsTotal}) ahead. Essentials first, then a little room for goals if anything's left.`,
    };
  }

  if (context.payFrequency === "bi-weekly") {
    const perWeek = Math.round(context.moneyLeftToSpend / 2);
    return {
      weekLabel,
      headline: "Your bi-weekly rhythm",
      body: `About $${perWeek}/week left in this pay cycle. ${context.categoriesUnderBudget} categories on track.${context.categoriesOverBudget > 0 ? ` Ease one over-budget category — small cuts add ~$${Math.round(context.incomeThisMonth * 0.03)}/paycheck.` : " Nice work staying aligned with your plan."}`,
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
