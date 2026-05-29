import { describe, expect, it } from "vitest";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { createBiWeeklyHouseholdScenario } from "@/test/factories/budget";

describe("computeDashboardSummary", () => {
  it("computes daysUntilBroke from balance and monthly burn pace", () => {
    const scenario = createBiWeeklyHouseholdScenario();
    const summary = computeDashboardSummary({
      accounts: scenario.accounts,
      categories: scenario.categories,
      transactions: scenario.transactions,
      recurring: scenario.recurring,
    });

    expect(summary.totalBalance).toBe(7500);
    expect(summary.upcomingPaychecks.length).toBeGreaterThan(0);
    expect(summary.upcomingPaychecks[0].amount).toBe(1825);
    if (summary.daysUntilBroke !== null) {
      expect(summary.daysUntilBroke).toBeGreaterThan(0);
    }
  });

  it("includes bi-weekly paycheck projections from payroll rule", () => {
    const scenario = createBiWeeklyHouseholdScenario();
    const summary = computeDashboardSummary({
      accounts: scenario.accounts,
      categories: scenario.categories,
      transactions: [],
      recurring: scenario.recurring,
    });

    expect(summary.upcomingPaychecks[0]?.date).toBe("2026-05-15");
  });
});
