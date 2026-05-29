import { describe, expect, it, beforeEach } from "vitest";
import { addWeeks, differenceInCalendarDays } from "date-fns";
import { parseLocalDate } from "@/lib/dates/parse-local-date";
import { clearRecurringProjectionCache, projectRecurringRuns } from "@/lib/recurring/project-runs";
import { createBiWeeklyHouseholdScenario, createRecurringRule } from "@/test/factories/budget";

describe("projectRecurringRuns", () => {
  beforeEach(() => {
    clearRecurringProjectionCache();
  });
  it("projects bi-weekly paycheck dates 14 days apart", () => {
    const payroll = createRecurringRule({
      name: "Payroll",
      cadence: "bi-weekly",
      nextDate: "2026-05-15",
    });

    const runs = projectRecurringRuns([payroll], { runsPerRule: 4, maxResults: 4 });
    const payrollRuns = runs.filter((r) => r.name === "Payroll");

    expect(payrollRuns).toHaveLength(4);
    expect(differenceInCalendarDays(parseLocalDate(payrollRuns[1].date), parseLocalDate(payrollRuns[0].date))).toBe(14);
    expect(differenceInCalendarDays(parseLocalDate(payrollRuns[2].date), parseLocalDate(payrollRuns[1].date))).toBe(14);
  });

  it("respects endDate and stops generating runs", () => {
    const rule = createRecurringRule({
      cadence: "weekly",
      nextDate: "2026-05-01",
      endDate: "2026-05-15",
    });

    const runs = projectRecurringRuns([rule], { runsPerRule: 10, maxResults: 20 });
    expect(runs.every((r) => parseLocalDate(r.date) <= parseLocalDate("2026-05-15"))).toBe(true);
    expect(runs.length).toBeLessThan(10);
  });

  it("skips inactive rules", () => {
    const active = createRecurringRule({ id: "a", name: "Active", active: true });
    const inactive = createRecurringRule({ id: "b", name: "Inactive", active: false });

    const runs = projectRecurringRuns([active, inactive], { runsPerRule: 3, maxResults: 10 });
    expect(runs.every((r) => r.name === "Active")).toBe(true);
  });

  it("returns globally sorted upcoming runs across rules", () => {
    const { recurring } = createBiWeeklyHouseholdScenario();
    const runs = projectRecurringRuns(recurring, { runsPerRule: 3, maxResults: 6 });

    for (let i = 1; i < runs.length; i += 1) {
      expect(+new Date(runs[i].date)).toBeGreaterThanOrEqual(+new Date(runs[i - 1].date));
    }
  });

  it("weekly groceries advance by 7 days", () => {
    const groceries = createRecurringRule({
      name: "Groceries",
      cadence: "weekly",
      nextDate: "2026-05-08",
    });

    const runs = projectRecurringRuns([groceries], { runsPerRule: 3, maxResults: 3 });
    expect(differenceInCalendarDays(parseLocalDate(runs[1].date), parseLocalDate(runs[0].date))).toBe(7);
    expect(differenceInCalendarDays(parseLocalDate(runs[2].date), parseLocalDate(runs[1].date))).toBe(7);
  });

  it("caches identical projection requests", () => {
    const rule = createRecurringRule({ nextDate: "2026-05-01" });
    const a = projectRecurringRuns([rule], { runsPerRule: 2, maxResults: 2 });
    const b = projectRecurringRuns([rule], { runsPerRule: 2, maxResults: 2 });
    expect(a).toBe(b);
  });

  it("handles bi-weekly starting on month-end without skipping cadence", () => {
    const rule = createRecurringRule({
      cadence: "bi-weekly",
      nextDate: "2026-01-31",
    });
    const runs = projectRecurringRuns([rule], { runsPerRule: 3, maxResults: 3 });
    expect(runs[0].date).toBe("2026-01-31");
    expect(differenceInCalendarDays(parseLocalDate(runs[1].date), parseLocalDate(runs[0].date))).toBe(14);
  });
});
