import { format, startOfMonth, subMonths } from "date-fns";
import {
  computeCategoryBudgetRows,
  sumBudgetTotals,
  type BudgetPeriod,
} from "@/lib/budget/period";
import type { AppAccount, AppCategory, AppGoal } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export type HealthFactorId =
  | "budget"
  | "savings"
  | "consistency"
  | "goals"
  | "debt";

export type HealthFactor = {
  id: HealthFactorId;
  label: string;
  score: number;
  maxScore: number;
  detail: string;
};

export type FinancialHealthResult = {
  score: number;
  band: "good" | "okay" | "attention";
  factors: HealthFactor[];
  monthKey: string;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

function spendingConsistencyScore(transactions: DemoTransaction[]): number {
  const monthPrefix = format(new Date(), "yyyy-MM");
  const weekly = [0, 0, 0, 0, 0];
  for (const t of transactions) {
    if (t.amount >= 0 || !t.date.startsWith(monthPrefix)) continue;
    const day = Number.parseInt(t.date.slice(8, 10), 10);
    const bucket = Math.min(4, Math.floor((day - 1) / 7));
    weekly[bucket] += Math.abs(t.amount);
  }
  const active = weekly.filter((w) => w > 0);
  if (active.length <= 1) return 55;
  const avg = active.reduce((s, v) => s + v, 0) / active.length;
  const variance =
    active.reduce((s, v) => s + (v - avg) ** 2, 0) / active.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
  return clamp(Math.round(100 - cv * 45));
}

export function computeFinancialHealth(input: {
  accounts: AppAccount[];
  categories: AppCategory[];
  transactions: DemoTransaction[];
  goals: AppGoal[];
  budgetPeriod?: BudgetPeriod;
  now?: Date;
}): FinancialHealthResult {
  const now = input.now ?? new Date();
  const period = input.budgetPeriod ?? "bi-weekly";
  const monthKey = format(startOfMonth(now), "yyyy-MM");

  const rows = computeCategoryBudgetRows(input.categories, input.transactions, period);
  const { totalBudgeted, totalSpent } = sumBudgetTotals(rows);
  const budgetAdherence =
    totalBudgeted > 0
      ? clamp(Math.round(100 - Math.max(0, (totalSpent / totalBudgeted) * 100 - 85) * 2))
      : 70;

  const monthPrefix = monthKey;
  const income = input.transactions
    .filter((t) => t.amount > 0 && t.date.startsWith(monthPrefix))
    .reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(
    input.transactions
      .filter((t) => t.amount < 0 && t.date.startsWith(monthPrefix))
      .reduce((s, t) => s + t.amount, 0)
  );
  const savingsRate = income > 0 ? clamp(Math.round(((income - expenses) / income) * 100)) : 50;
  const savingsScore = clamp(savingsRate * 1.1);

  const consistencyScore = spendingConsistencyScore(input.transactions);

  const activeGoals = input.goals.filter((g) => g.target > 0);
  const goalPct =
    activeGoals.length > 0
      ? activeGoals.reduce((s, g) => s + Math.min(100, (g.current / g.target) * 100), 0) /
        activeGoals.length
      : 60;
  const goalsScore = clamp(Math.round(goalPct));

  const liabilities = input.accounts
    .filter((a) => a.kind === "credit")
    .reduce((s, a) => s + Math.abs(Math.min(0, a.balance)), 0);
  const assets = input.accounts
    .filter((a) => a.kind !== "credit")
    .reduce((s, a) => s + Math.max(0, a.balance), 0);
  const debtRatio = assets > 0 ? liabilities / assets : liabilities > 0 ? 1 : 0;
  const debtScore = clamp(Math.round(100 - debtRatio * 120));

  const factors: HealthFactor[] = [
    {
      id: "budget",
      label: "Budget adherence",
      score: budgetAdherence,
      maxScore: 100,
      detail:
        totalBudgeted > 0
          ? `${Math.round((totalSpent / totalBudgeted) * 100)}% of your ${period === "bi-weekly" ? "bi-weekly" : "period"} budget used`
          : "Set category budgets to track adherence",
    },
    {
      id: "savings",
      label: "Savings rate",
      score: savingsScore,
      maxScore: 100,
      detail:
        income > 0
          ? `${savingsRate}% of income left after expenses this month`
          : "Log income to measure savings rate",
    },
    {
      id: "consistency",
      label: "Spending consistency",
      score: consistencyScore,
      maxScore: 100,
      detail: "Even pacing across the month beats boom-and-bust weeks",
    },
    {
      id: "goals",
      label: "Sinking fund progress",
      score: goalsScore,
      maxScore: 100,
      detail:
        activeGoals.length > 0
          ? `Average ${Math.round(goalPct)}% funded across ${activeGoals.length} goal${activeGoals.length === 1 ? "" : "s"}`
          : "Add sinking funds to boost this factor",
    },
    {
      id: "debt",
      label: "Debt management",
      score: debtScore,
      maxScore: 100,
      detail:
        liabilities > 0
          ? `Credit balances are ${Math.round(debtRatio * 100)}% of liquid assets`
          : "No credit card debt on tracked accounts",
    },
  ];

  const weights: Record<HealthFactorId, number> = {
    budget: 0.28,
    savings: 0.24,
    consistency: 0.16,
    goals: 0.18,
    debt: 0.14,
  };

  const score = Math.round(
    factors.reduce((s, f) => s + f.score * weights[f.id], 0)
  );

  const band: FinancialHealthResult["band"] =
    score >= 75 ? "good" : score >= 50 ? "okay" : "attention";

  return { score, band, factors, monthKey };
}

/** Prior month score for trend (same formula, shifted month). */
export function computePriorMonthHealthScore(
  input: Omit<Parameters<typeof computeFinancialHealth>[0], "now">,
  now = new Date()
): number {
  const prior = subMonths(startOfMonth(now), 1);
  const prefix = format(prior, "yyyy-MM");
  const priorTx = input.transactions.filter((t) => t.date.startsWith(prefix));
  if (priorTx.length < 3) return computeFinancialHealth({ ...input, now }).score - 3;
  return computeFinancialHealth({
    ...input,
    transactions: priorTx,
    now: prior,
  }).score;
}

export function healthBandColor(band: FinancialHealthResult["band"]) {
  if (band === "good") return "var(--positive)";
  if (band === "okay") return "#eab308";
  return "#f43f5e";
}

export function healthBandLabel(band: FinancialHealthResult["band"]) {
  if (band === "good") return "Good";
  if (band === "okay") return "Okay";
  return "Needs attention";
}
