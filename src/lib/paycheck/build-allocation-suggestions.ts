import { subDays, parseISO, isAfter } from "date-fns";
import { computeCategoryBudgetRows, getEffectiveBudgetPeriod } from "@/lib/budget/period";
import { suggestBiWeeklyContribution } from "@/lib/goals/sinking-fund";
import type { AppCategory, AppGoal } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export type AllocationTargetType = "category" | "goal";

export type AllocationTarget = {
  id: string;
  type: AllocationTargetType;
  label: string;
  subtitle: string;
  color: string;
  /** Smart / average-based weight */
  weight: number;
  /** Bi-weekly (or period) budget envelope */
  budgetAmount: number;
  /** Average spend per pay period from history */
  avgPerPeriod: number;
  suggestedAmount: number;
};

const LOOKBACK_DAYS = 84;

function periodsForAverage(period: "monthly" | "weekly" | "bi-weekly") {
  if (period === "weekly") return 12;
  if (period === "bi-weekly") return 6;
  return 3;
}

function categoryAveragePerPeriod(
  transactions: DemoTransaction[],
  categoryName: string,
  period: "monthly" | "weekly" | "bi-weekly"
): number {
  const cutoff = subDays(new Date(), LOOKBACK_DAYS);
  const total = transactions
    .filter(
      (t) =>
        t.category === categoryName &&
        t.amount < 0 &&
        isAfter(parseISO(t.date), cutoff)
    )
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const periods = periodsForAverage(period);
  return periods > 0 ? Math.round((total / periods) * 100) / 100 : 0;
}

export function buildAllocationTargets(input: {
  categories: AppCategory[];
  goals: AppGoal[];
  transactions: DemoTransaction[];
  recurring: { cadence: string; paused?: boolean; name: string }[];
}): AllocationTarget[] {
  const period = getEffectiveBudgetPeriod(undefined, input.recurring);
  const rows = computeCategoryBudgetRows(input.categories, input.transactions, period);

  const categoryTargets: AllocationTarget[] = rows
    .filter((r) => r.budgeted > 0 && r.name !== "Income")
    .map((r) => {
      const need = Math.max(0, r.remaining);
      const avgPerPeriod = categoryAveragePerPeriod(input.transactions, r.name, period);
      const suggestedAmount = avgPerPeriod > 0 ? avgPerPeriod : need > 0 ? need : r.budgeted * 0.5;
      const weight = Math.max(need, avgPerPeriod, suggestedAmount * 0.5);
      return {
        id: r.id,
        type: "category" as const,
        label: r.name,
        subtitle:
          avgPerPeriod > 0
            ? `Avg ${period === "bi-weekly" ? "per paycheck" : "per period"} $${avgPerPeriod.toFixed(0)} · $${need.toFixed(0)} left in budget`
            : `Budget $${r.budgeted.toFixed(0)} · $${need.toFixed(0)} left`,
        color: r.color,
        weight,
        budgetAmount: r.budgeted,
        avgPerPeriod,
        suggestedAmount,
      };
    })
    .filter((t) => t.weight > 0)
    .sort((a, b) => b.suggestedAmount - a.suggestedAmount)
    .slice(0, 10);

  const goalTargets: AllocationTarget[] = input.goals
    .filter((g) => g.target > g.current)
    .map((g) => {
      const biweekly = suggestBiWeeklyContribution(g);
      const remaining = g.target - g.current;
      return {
        id: g.id,
        type: "goal" as const,
        label: g.name,
        subtitle: `$${remaining.toFixed(0)} to go · suggested $${biweekly.toFixed(0)}/paycheck`,
        color: g.color,
        weight: Math.max(biweekly, remaining * 0.05),
        budgetAmount: 0,
        avgPerPeriod: biweekly,
        suggestedAmount: biweekly,
      };
    })
    .sort((a, b) => b.suggestedAmount - a.suggestedAmount)
    .slice(0, 6);

  return [...categoryTargets, ...goalTargets];
}

/** Pre-fill from average spending patterns (capped to allocatable total) */
export function splitFromAverages(targets: AllocationTarget[], total: number): Record<string, number> {
  if (!targets.length || total <= 0) return {};
  const sumSuggested = targets.reduce((s, t) => s + t.suggestedAmount, 0);
  if (sumSuggested <= 0) return splitAmountEvenly(targets, total);
  return normalizeAllocations(
    targets.reduce(
      (acc, t) => {
        acc[t.id] = Math.round(((total * t.suggestedAmount) / sumSuggested) * 100) / 100;
        return acc;
      },
      {} as Record<string, number>
    ),
    total
  );
}

export function splitAmountEvenly(targets: AllocationTarget[], total: number): Record<string, number> {
  if (!targets.length || total <= 0) return {};
  const per = Math.floor((total / targets.length) * 100) / 100;
  const out: Record<string, number> = {};
  let assigned = 0;
  targets.forEach((t, i) => {
    const isLast = i === targets.length - 1;
    const amt = isLast ? Math.round((total - assigned) * 100) / 100 : per;
    out[t.id] = amt;
    assigned += amt;
  });
  return out;
}

export function splitAmountSmart(targets: AllocationTarget[], total: number): Record<string, number> {
  return splitFromAverages(targets, total);
}

/** Allocate by bi-weekly budget envelope proportions (categories only; goals by weight) */
export function splitByBudgetProportions(
  targets: AllocationTarget[],
  total: number
): Record<string, number> {
  if (!targets.length || total <= 0) return {};

  const categories = targets.filter((t) => t.type === "category" && t.budgetAmount > 0);
  const goals = targets.filter((t) => t.type === "goal");
  const catBudgetSum = categories.reduce((s, t) => s + t.budgetAmount, 0);
  const goalWeightSum = goals.reduce((s, t) => s + t.weight, 0);

  const categoryShare = catBudgetSum > 0 ? total * 0.75 : 0;
  const goalShare = total - categoryShare;

  const out: Record<string, number> = {};
  let assigned = 0;

  categories.forEach((t, i) => {
    const isLast = i === categories.length - 1 && goals.length === 0;
    const raw = catBudgetSum > 0 ? (categoryShare * t.budgetAmount) / catBudgetSum : 0;
    const amt = isLast
      ? Math.round((total - assigned) * 100) / 100
      : Math.round(raw * 100) / 100;
    out[t.id] = amt;
    assigned += amt;
  });

  if (goalWeightSum > 0 && goals.length > 0) {
    goals.forEach((t, i) => {
      const isLast = i === goals.length - 1;
      const raw = (goalShare * t.weight) / goalWeightSum;
      const amt = isLast
        ? Math.round((total - assigned) * 100) / 100
        : Math.round(raw * 100) / 100;
      out[t.id] = Math.max(0, amt);
      assigned += out[t.id];
    });
  }

  return out;
}

export function allocateRemainingToTargets(
  amounts: Record<string, number>,
  targets: AllocationTarget[],
  remaining: number
): Record<string, number> {
  if (remaining <= 0.01) return amounts;
  const next = { ...amounts };
  const sorted = [...targets].sort((a, b) => {
    const aRoom = (a.suggestedAmount || 0) - (amounts[a.id] ?? 0);
    const bRoom = (b.suggestedAmount || 0) - (amounts[b.id] ?? 0);
    return bRoom - aRoom;
  });
  let left = remaining;
  for (const t of sorted) {
    if (left <= 0) break;
    const add = Math.min(left, Math.max(0, t.suggestedAmount - (next[t.id] ?? 0)));
    if (add <= 0) {
      const bump = Math.min(left, 5);
      next[t.id] = (next[t.id] ?? 0) + bump;
      left -= bump;
    } else {
      next[t.id] = (next[t.id] ?? 0) + add;
      left -= add;
    }
  }
  if (left > 0.01 && sorted[0]) {
    next[sorted[0].id] = (next[sorted[0].id] ?? 0) + Math.round(left * 100) / 100;
  }
  return next;
}

export function normalizeAllocations(
  amounts: Record<string, number>,
  maxTotal: number
): Record<string, number> {
  const sum = Object.values(amounts).reduce((s, v) => s + v, 0);
  if (sum <= maxTotal) return amounts;
  const scale = maxTotal / sum;
  const out: Record<string, number> = {};
  for (const [id, val] of Object.entries(amounts)) {
    out[id] = Math.round(val * scale * 100) / 100;
  }
  return out;
}

export function biWeeklyBillsEstimate(
  recurring: { name: string; amount: number; cadence: string; paused?: boolean }[]
): number {
  let total = 0;
  for (const r of recurring) {
    if (r.paused) continue;
    if (/payroll|paycheck|salary/i.test(r.name)) continue;
    const amt = Math.abs(r.amount);
    if (r.cadence === "weekly") total += amt * 2;
    else if (r.cadence === "bi-weekly") total += amt;
    else if (r.cadence === "monthly") total += amt / 2;
    else if (r.cadence === "yearly") total += amt / 26;
  }
  return Math.round(total * 100) / 100;
}
