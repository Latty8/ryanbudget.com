import { differenceInCalendarDays, parseISO } from "date-fns";
import type { AppGoal } from "@/types/app-settings";
import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type GoalPrediction = {
  goalId: string;
  name: string;
  onTrack: boolean;
  projectedCompletionDate: string | null;
  weeksRemaining: number | null;
  weeklyContributionNeeded: number;
  message: string;
};

export function predictGoalCompletion(
  goals: AppGoal[],
  context: AnonymizedBudgetContext
): GoalPrediction[] {
  const surplusPerPaycheck =
    context.payFrequency === "bi-weekly"
      ? Math.max(0, Math.round(context.moneyLeftToSpend / 2))
      : Math.max(0, Math.round(context.moneyLeftToSpend / 4));

  const defaultWeekly =
    surplusPerPaycheck > 0
      ? context.payFrequency === "bi-weekly"
        ? surplusPerPaycheck / 2
        : surplusPerPaycheck
      : Math.max(25, Math.round(context.incomeThisMonth * 0.05 / 4));

  return goals.map((goal) => {
    const remaining = Math.max(0, goal.target - goal.current);
    const targetDate = parseISO(goal.targetDate);
    const daysLeft = differenceInCalendarDays(targetDate, new Date());
    const weeksRemaining = daysLeft > 0 ? Math.ceil(daysLeft / 7) : null;
    const weeklyNeeded =
      weeksRemaining && weeksRemaining > 0
        ? Math.ceil(remaining / weeksRemaining)
        : remaining > 0
          ? defaultWeekly
          : 0;

    const weeksToComplete =
      weeklyNeeded > 0 ? Math.ceil(remaining / weeklyNeeded) : remaining === 0 ? 0 : null;

    let projectedCompletionDate: string | null = null;
    if (weeksToComplete !== null && weeksToComplete >= 0) {
      const projected = new Date();
      projected.setDate(projected.getDate() + weeksToComplete * 7);
      projectedCompletionDate = projected.toISOString().slice(0, 10);
    }

    const onTrack =
      remaining === 0 ||
      (weeksRemaining !== null &&
        weeksToComplete !== null &&
        weeksToComplete <= weeksRemaining);

    let message: string;
    if (remaining === 0) {
      message = "Goal reached — nice work!";
    } else if (onTrack) {
      message = `On track with ~$${weeklyNeeded}/week. Projected done by ${projectedCompletionDate ?? "your target date"}.`;
    } else {
      message = `Needs ~$${weeklyNeeded}/week to hit ${goal.targetDate}. Consider $${Math.min(weeklyNeeded, defaultWeekly + 25)}/paycheck after deposits.`;
    }

    return {
      goalId: goal.id,
      name: goal.name,
      onTrack,
      projectedCompletionDate,
      weeksRemaining,
      weeklyContributionNeeded: weeklyNeeded,
      message,
    };
  });
}
