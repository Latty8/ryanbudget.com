import { describe, expect, it } from "vitest";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { buildPaycheckProjections } from "@/lib/recurring/build-paychecks";
import { createRecurringRule } from "@/test/factories/budget";

describe("buildPaycheckProjections", () => {
  it("uses bi-weekly payroll rule with 14-day spacing", () => {
    const payroll = createRecurringRule({
      id: "pay",
      name: "Payroll",
      cadence: "bi-weekly",
      amount: 2000,
      nextDate: "2026-05-15",
    });

    const paychecks = buildPaycheckProjections([payroll], 3);
    expect(paychecks).toHaveLength(3);
    expect(paychecks[0].amount).toBe(2000);
    expect(paychecks[0].date).toBe("2026-05-15");
    expect(differenceInCalendarDays(parseISO(paychecks[1].date), parseISO(paychecks[0].date))).toBe(14);
  });

  it("falls back to default amounts when no payroll rule exists", () => {
    const bills = [
      createRecurringRule({ name: "Rent", cadence: "monthly", amount: 1200, nextDate: "2026-05-01" }),
    ];
    const paychecks = buildPaycheckProjections(bills, 2, new Date("2026-05-01"));
    expect(paychecks).toHaveLength(2);
    expect(paychecks[0].amount).toBe(1825);
  });
});
