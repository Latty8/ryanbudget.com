import { format, startOfMonth } from "date-fns";
import type { AppCategory } from "@/types/app-settings";
import type { BudgetPeriod, CategoryBudgetRow } from "@/lib/budget/period";

export function currentBudgetPeriodKey(period: BudgetPeriod, now = new Date()): string {
  if (period === "monthly") return format(startOfMonth(now), "yyyy-MM");
  return format(now, "yyyy-'W'II");
}

export function categoryUsesRollover(category: AppCategory, globalRolloverEnabled: boolean): boolean {
  if (category.budgetBehavior === "rollover") return true;
  if (category.budgetBehavior === "fixed" || category.budgetBehavior === "flexible") {
    return false;
  }
  return globalRolloverEnabled;
}

export function getCategoryRolloverBalance(category: AppCategory): number {
  return Math.max(0, category.rolloverBalance ?? 0);
}

/** Patches to apply when a new budget period starts (carry unused funds forward). */
export function buildAutoRolloverPatches(
  categories: AppCategory[],
  rows: CategoryBudgetRow[],
  globalRolloverEnabled: boolean
): Array<{ id: string; rolloverBalance: number }> {
  const patches: Array<{ id: string; rolloverBalance: number }> = [];
  for (const row of rows) {
    const cat = categories.find((c) => c.id === row.id);
    if (!cat || !categoryUsesRollover(cat, globalRolloverEnabled)) continue;
    if (row.remaining <= 0) continue;
    const next = getCategoryRolloverBalance(cat) + row.remaining;
    patches.push({ id: cat.id, rolloverBalance: Math.round(next * 100) / 100 });
  }
  return patches;
}
