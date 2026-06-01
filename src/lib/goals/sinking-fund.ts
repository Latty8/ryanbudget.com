import { differenceInCalendarDays, parseISO } from "date-fns";
import type { AppGoal } from "@/types/app-settings";

export const SINKING_FUND_TYPES = [
  { id: "general", label: "General" },
  { id: "vacation", label: "Vacation" },
  { id: "holiday", label: "Holiday / Gifts" },
  { id: "emergency", label: "Emergency" },
  { id: "repair", label: "Repairs" },
  { id: "other", label: "Other" },
] as const;

export type SinkingFundType = (typeof SINKING_FUND_TYPES)[number]["id"];

const BIWEEKLY_DAYS = 14;

export function paychecksUntilTarget(goal: AppGoal): number {
  const days = differenceInCalendarDays(parseISO(goal.targetDate), new Date());
  if (days <= 0) return 0;
  return Math.max(1, Math.ceil(days / BIWEEKLY_DAYS));
}

export function monthsUntilTarget(goal: AppGoal): number {
  const days = differenceInCalendarDays(parseISO(goal.targetDate), new Date());
  return Math.max(0, Math.ceil(days / 30.4375));
}

export function suggestMonthlyContribution(goal: AppGoal): number {
  const remaining = Math.max(0, goal.target - goal.current);
  if (remaining <= 0) return 0;
  if (goal.monthlyContribution && goal.monthlyContribution > 0) return goal.monthlyContribution;

  const months = monthsUntilTarget(goal);
  if (months <= 0) return remaining;
  return Math.ceil((remaining / months) * 100) / 100;
}

/** Amount to set aside each bi-weekly paycheck to hit the target date */
export function suggestBiWeeklyContribution(goal: AppGoal): number {
  const remaining = Math.max(0, goal.target - goal.current);
  if (remaining <= 0) return 0;
  if (goal.monthlyContribution && goal.monthlyContribution > 0) {
    return Math.ceil((goal.monthlyContribution / 2) * 100) / 100;
  }

  const paychecks = paychecksUntilTarget(goal);
  if (paychecks <= 0) return remaining;
  return Math.ceil((remaining / paychecks) * 100) / 100;
}

export function fundProgressPct(goal: AppGoal): number {
  if (goal.target <= 0) return 0;
  return Math.min(100, (goal.current / goal.target) * 100);
}
