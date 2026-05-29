import { describe, expect, it } from "vitest";
import {
  computeDaysUntilBroke,
  computeDaysUntilPaycheck,
  generateInsights,
} from "@/lib/insights/generate-insights";

describe("computeDaysUntilBroke", () => {
  it("returns null when burn rate is zero", () => {
    expect(computeDaysUntilBroke(1000, 0)).toBeNull();
  });

  it("returns 0 when balance is zero or negative", () => {
    expect(computeDaysUntilBroke(0, 50)).toBe(0);
    expect(computeDaysUntilBroke(-10, 50)).toBe(0);
  });

  it("estimates days from balance and daily burn", () => {
    expect(computeDaysUntilBroke(300, 30)).toBe(10);
  });
});

describe("computeDaysUntilPaycheck", () => {
  it("returns days until next paycheck", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const iso = future.toISOString().slice(0, 10);
    const days = computeDaysUntilPaycheck([{ id: "1", date: iso, amount: 1800, status: "expected" }]);
    expect(days).toBeGreaterThanOrEqual(4);
    expect(days).toBeLessThanOrEqual(6);
  });
});

describe("generateInsights", () => {
  it("warns when spending exceeds income", () => {
    const insights = generateInsights({
      moneyLeftToSpend: 100,
      expensesThisMonth: 4000,
      incomeThisMonth: 3000,
      diningSpent: 200,
      diningLastMonth: 150,
      upcomingPaychecks: [{ id: "p", date: "2026-06-01", amount: 1800, status: "expected" }],
      upcomingBills: [],
    });
    expect(insights.some((i) => i.id === "over-income")).toBe(true);
  });
});
