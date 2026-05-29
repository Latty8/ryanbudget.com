import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type SpendingAnomaly = {
  id: string;
  category: string;
  deltaPct: number;
  severity: "low" | "medium" | "high";
  explanation: string;
};

/** Detect budget anomalies from anonymized aggregates only. */
export function detectSpendingAnomalies(context: AnonymizedBudgetContext): SpendingAnomaly[] {
  const anomalies: SpendingAnomaly[] = [];

  for (const row of context.categoryTotals) {
    if (row.deltaPct < 15) continue;
    const severity: SpendingAnomaly["severity"] =
      row.deltaPct >= 40 ? "high" : row.deltaPct >= 25 ? "medium" : "low";
    anomalies.push({
      id: `anomaly-${row.name.toLowerCase().replace(/\s+/g, "-")}`,
      category: row.name,
      deltaPct: row.deltaPct,
      severity,
      explanation: `${row.name} is ${row.deltaPct}% over budget ($${row.spent} vs $${row.budgeted} planned). Consider a weekly cap until your next paycheck.`,
    });
  }

  if (context.expensesThisMonth > context.incomeThisMonth * 1.05) {
    anomalies.push({
      id: "anomaly-over-income",
      category: "Overall",
      deltaPct: Math.round(
        ((context.expensesThisMonth - context.incomeThisMonth) / Math.max(context.incomeThisMonth, 1)) * 100
      ),
      severity: "high",
      explanation: `Spending ($${context.expensesThisMonth}) has passed income ($${context.incomeThisMonth}) this month. Pause discretionary categories until the next deposit.`,
    });
  }

  return anomalies.sort((a, b) => b.deltaPct - a.deltaPct).slice(0, 5);
}
