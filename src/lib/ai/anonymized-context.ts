import type { AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { DashboardSummary } from "@/types/finance";

/** Aggregated, non-PII snapshot safe to send to an LLM. */
export type AnonymizedBudgetContext = {
  monthLabel: string;
  currency: string;
  totalBalance: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  moneyLeftToSpend: number;
  projectedEndOfMonthBalance: number;
  daysUntilNextPaycheck: number | null;
  payFrequency: "bi-weekly" | "weekly" | "monthly" | "mixed";
  categoriesUnderBudget: number;
  categoriesOverBudget: number;
  categoryTotals: Array<{
    name: string;
    budgeted: number;
    spent: number;
    deltaPct: number;
  }>;
  topSpendingIncreases: Array<{ name: string; deltaPct: number }>;
  upcomingBillsTotal: number;
  upcomingBillsCount: number;
};

export function buildAnonymizedContext(input: {
  summary: DashboardSummary;
  categories: AppCategory[];
  transactions: DemoTransaction[];
  currency?: string;
}): AnonymizedBudgetContext {
  const { summary, transactions } = input;
  const monthPrefix = new Date().toISOString().slice(0, 7);

  const categoryTotals = summary.categoryProgress.map((row) => {
    const deltaPct =
      row.budgeted > 0 ? Math.round(((row.spent - row.budgeted) / row.budgeted) * 100) : 0;
    return { name: row.name, budgeted: row.budgeted, spent: row.spent, deltaPct };
  });

  const categoriesUnderBudget = categoryTotals.filter((c) => c.spent <= c.budgeted).length;
  const categoriesOverBudget = categoryTotals.filter((c) => c.spent > c.budgeted).length;

  const topSpendingIncreases = categoryTotals
    .filter((c) => c.deltaPct > 0)
    .sort((a, b) => b.deltaPct - a.deltaPct)
    .slice(0, 3);

  const hasBiweekly = transactions.some((t) => t.recurring && t.amount > 0);
  const payFrequency: AnonymizedBudgetContext["payFrequency"] = hasBiweekly
    ? "bi-weekly"
    : "monthly";

  return {
    monthLabel: monthPrefix,
    currency: input.currency ?? "USD",
    totalBalance: Math.round(summary.totalBalance),
    incomeThisMonth: Math.round(summary.incomeThisMonth),
    expensesThisMonth: Math.round(summary.expensesThisMonth),
    moneyLeftToSpend: Math.round(summary.moneyLeftToSpend),
    projectedEndOfMonthBalance: Math.round(summary.projectedEndOfMonthBalance),
    daysUntilNextPaycheck: summary.daysUntilNextPaycheck,
    payFrequency,
    categoriesUnderBudget,
    categoriesOverBudget,
    categoryTotals,
    topSpendingIncreases,
    upcomingBillsTotal: Math.round(
      summary.upcomingBills.reduce((sum, bill) => sum + bill.amount, 0)
    ),
    upcomingBillsCount: summary.upcomingBills.length,
  };
}
