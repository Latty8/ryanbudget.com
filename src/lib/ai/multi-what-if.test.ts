import { describe, expect, it } from "vitest";
import { runMultiWhatIfScenarios } from "@/lib/ai/multi-what-if";
import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

const context: AnonymizedBudgetContext = {
  monthLabel: "2026-05",
  currency: "USD",
  totalBalance: 2000,
  incomeThisMonth: 3650,
  expensesThisMonth: 2400,
  moneyLeftToSpend: 400,
  projectedEndOfMonthBalance: 2100,
  daysUntilNextPaycheck: 6,
  payFrequency: "bi-weekly",
  categoriesUnderBudget: 3,
  categoriesOverBudget: 1,
  categoryTotals: [
    { name: "Dining", budgeted: 120, spent: 140, deltaPct: 17 },
    { name: "Groceries", budgeted: 300, spent: 250, deltaPct: -17 },
  ],
  topSpendingIncreases: [{ name: "Dining", deltaPct: 17 }],
  upcomingBillsTotal: 1200,
  upcomingBillsCount: 2,
};

describe("runMultiWhatIfScenarios", () => {
  it("computes savings per scenario", () => {
    const results = runMultiWhatIfScenarios(context, [
      { id: "d", label: "Dining −20%", category: "Dining", reductionPct: 20 },
    ]);
    expect(results[0].monthlySavings).toBe(28);
    expect(results[0].newSafeToSpend).toBe(428);
  });
});
