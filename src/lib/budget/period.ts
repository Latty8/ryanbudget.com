import { format, startOfMonth, subDays } from "date-fns";
import type { AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import { categoryUsesRollover, getCategoryRolloverBalance } from "@/lib/budget/rollover";

/** How the user thinks about their budget limits (stored monthly in category.budgeted). */
export type BudgetPeriod = "monthly" | "weekly" | "bi-weekly";

/** Monthly equivalents per 1 unit in each period (26 bi-weekly periods / year, etc.). */
const MONTHLY_FACTOR: Record<BudgetPeriod, number> = {
  monthly: 1,
  weekly: 52 / 12, // 4.333…
  "bi-weekly": 26 / 12, // 2.1667…
};

export const BUDGET_PERIODS: BudgetPeriod[] = ["monthly", "bi-weekly", "weekly"];

export const BUDGET_PERIOD_OPTIONS: {
  value: BudgetPeriod;
  label: string;
  prominent?: boolean;
}[] = [
  { value: "monthly", label: "Monthly" },
  { value: "bi-weekly", label: "Bi-weekly", prominent: true },
  { value: "weekly", label: "Weekly" },
];

export type BudgetAmounts = Record<BudgetPeriod, number>;

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

/** Cross-fill all three periods from an amount entered in one period. */
export function crossCalculateBudgetAmounts(
  source: BudgetPeriod,
  amount: number
): BudgetAmounts {
  const monthly = monthlyFromPeriodAmount(amount, source);
  return {
    monthly: roundMoney(periodAmountFromMonthly(monthly, "monthly")),
    "bi-weekly": roundMoney(periodAmountFromMonthly(monthly, "bi-weekly")),
    weekly: roundMoney(periodAmountFromMonthly(monthly, "weekly")),
  };
}

/** Build form state from stored monthly canonical value. */
export function budgetAmountsFromMonthly(monthly: number): BudgetAmounts {
  return crossCalculateBudgetAmounts("monthly", monthly);
}

/** Resolve canonical monthly for storage (prefers explicit monthly override). */
export function resolveMonthlyForStorage(
  amounts: BudgetAmounts,
  source: BudgetPeriod,
  overrides: ReadonlySet<BudgetPeriod>
) {
  if (overrides.has("monthly")) return amounts.monthly;
  return monthlyFromPeriodAmount(amounts[source], source);
}

export function autoCalcHint(target: BudgetPeriod, source: BudgetPeriod) {
  if (target === source) return null;
  return "(Auto-calculated)";
}

export const BUDGET_CONVERSION_TOOLTIP =
  "We convert between periods using standard pay-cycle math. Bi-weekly → monthly uses × 2.1667 (26 paychecks per year ÷ 12 months). Bi-weekly → weekly is ÷ 2. Weekly → monthly uses × 4.333 (52 weeks ÷ 12 months). Monthly amounts split evenly to the other periods.";

export function conversionDetail(source: BudgetPeriod, target: BudgetPeriod): string | null {
  if (source === target) return null;
  if (source === "bi-weekly" && target === "monthly") return "× 2.1667";
  if (source === "bi-weekly" && target === "weekly") return "÷ 2";
  if (source === "weekly" && target === "bi-weekly") return "× 2";
  if (source === "weekly" && target === "monthly") return "× 4.333";
  if (source === "monthly" && target === "bi-weekly") return "× 0.4615";
  if (source === "monthly" && target === "weekly") return "÷ 4.333";
  return null;
}

export function hasBiweeklyPaycheck(
  recurring: { cadence: string; paused?: boolean; name: string }[]
) {
  return recurring.some(
    (r) =>
      !r.paused &&
      (r.cadence === "bi-weekly" ||
        /payroll|paycheck|salary|wage|deposit/i.test(r.name))
  );
}

/** User's view preference, or bi-weekly when they have a bi-weekly paycheck and none is set. */
export function getEffectiveBudgetPeriod(
  preference: BudgetPeriod | undefined,
  recurring: { cadence: string; paused?: boolean; name: string }[]
): BudgetPeriod {
  if (preference) return preference;
  return hasBiweeklyPaycheck(recurring) ? "bi-weekly" : "monthly";
}

export function periodSpentLabel(period: BudgetPeriod) {
  if (period === "bi-weekly") return "Last 14 days";
  if (period === "weekly") return "Last 7 days";
  return "This month";
}

export function periodLabel(period: BudgetPeriod) {
  return BUDGET_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
}

export function periodBudgetLabel(period: BudgetPeriod) {
  if (period === "bi-weekly") return "Bi-weekly budget";
  if (period === "weekly") return "Weekly budget";
  return "Monthly budget";
}

/** Convert user-entered period amount → canonical monthly storage. */
export function monthlyFromPeriodAmount(amount: number, period: BudgetPeriod) {
  return Math.round(amount * MONTHLY_FACTOR[period] * 100) / 100;
}

/** Convert stored monthly amount → display amount for the active period. */
export function periodAmountFromMonthly(monthly: number, period: BudgetPeriod) {
  return Math.round((monthly / MONTHLY_FACTOR[period]) * 100) / 100;
}

export function spendRangeStart(period: BudgetPeriod, now = new Date()) {
  if (period === "monthly") return format(startOfMonth(now), "yyyy-MM-dd");
  if (period === "weekly") return format(subDays(now, 7), "yyyy-MM-dd");
  return format(subDays(now, 14), "yyyy-MM-dd");
}

export function transactionInBudgetPeriod(date: string, period: BudgetPeriod, now = new Date()) {
  if (period === "monthly") return date.startsWith(format(now, "yyyy-MM"));
  return date >= spendRangeStart(period, now);
}

export function reportCadenceFromBudgetPeriod(
  period: BudgetPeriod
): "monthly" | "biweekly" {
  return period === "monthly" ? "monthly" : "biweekly";
}

export type CategoryBudgetRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  group: string;
  monthlyBudgeted: number;
  /** Base envelope for this period (excludes rollover) */
  budgeted: number;
  /** Carried forward from prior period(s) */
  rollover: number;
  /** budgeted + rollover */
  effectiveBudgeted: number;
  spent: number;
  remaining: number;
  pct: number;
  over: boolean;
  rolloverEnabled: boolean;
};

export type ComputeBudgetRowsOptions = {
  globalRolloverEnabled?: boolean;
  now?: Date;
};

export function computeCategoryBudgetRows(
  categories: AppCategory[],
  transactions: DemoTransaction[],
  period: BudgetPeriod,
  options: ComputeBudgetRowsOptions = {}
): CategoryBudgetRow[] {
  const now = options.now ?? new Date();
  const globalRollover = options.globalRolloverEnabled ?? false;

  return categories
    .filter((c) => c.name !== "Income")
    .map((cat) => {
      const spent = transactions
        .filter(
          (t) =>
            t.category === cat.name &&
            t.amount < 0 &&
            transactionInBudgetPeriod(t.date, period, now)
        )
        .reduce((s, t) => s + Math.abs(t.amount), 0);

      const budgeted = periodAmountFromMonthly(cat.budgeted, period);
      const rollover = categoryUsesRollover(cat, globalRollover)
        ? getCategoryRolloverBalance(cat)
        : 0;
      const effectiveBudgeted = budgeted + rollover;
      const remaining = effectiveBudgeted - spent;
      const pct = effectiveBudgeted > 0 ? (spent / effectiveBudgeted) * 100 : 0;

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        group: cat.group,
        monthlyBudgeted: cat.budgeted,
        budgeted,
        rollover,
        effectiveBudgeted,
        spent,
        remaining,
        pct,
        over: remaining < 0,
        rolloverEnabled: categoryUsesRollover(cat, globalRollover),
      };
    });
}

export function sumBudgetTotals(rows: CategoryBudgetRow[]) {
  const totalBudgeted = rows.reduce((s, r) => s + r.effectiveBudgeted, 0);
  const totalRollover = rows.reduce((s, r) => s + r.rollover, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  return {
    totalBudgeted,
    totalRollover,
    totalSpent,
    totalLeft: Math.max(0, totalBudgeted - totalSpent),
    overallPct: totalBudgeted > 0 ? Math.min(100, (totalSpent / totalBudgeted) * 100) : 0,
  };
}
