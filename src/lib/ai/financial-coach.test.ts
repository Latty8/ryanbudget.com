import { describe, expect, it } from "vitest";
import { buildFinancialCoachReport } from "@/lib/ai/financial-coach";
import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

const baseContext: AnonymizedBudgetContext = {
  monthLabel: "2026-05",
  currency: "USD",
  totalBalance: 3000,
  incomeThisMonth: 4000,
  expensesThisMonth: 2800,
  moneyLeftToSpend: 450,
  projectedEndOfMonthBalance: 1200,
  daysUntilNextPaycheck: 5,
  payFrequency: "bi-weekly",
  categoriesUnderBudget: 4,
  categoriesOverBudget: 1,
  categoryTotals: [
    { name: "Dining", budgeted: 200, spent: 280, deltaPct: 40 },
    { name: "Groceries", budgeted: 400, spent: 350, deltaPct: -12 },
  ],
  topSpendingIncreases: [{ name: "Dining", deltaPct: 40 }],
  upcomingBillsTotal: 600,
  upcomingBillsCount: 2,
};

describe("buildFinancialCoachReport", () => {
  it("includes weekly bi-weekly insight and spending habits", () => {
    const report = buildFinancialCoachReport(baseContext, [
      { id: "g1", name: "Emergency fund", target: 1000, current: 400, targetDate: "2026-12-31", icon: "Target", color: "#fff" },
    ]);
    expect(report.weekly.headline).toBeTruthy();
    expect(report.spendingHabits.length).toBeGreaterThan(0);
    expect(report.goalPredictions[0].name).toBe("Emergency fund");
    expect(report.coach.focusAreas.length).toBeGreaterThan(0);
  });
});
