import { addWeeks } from "date-fns";
import { formatLocalDate, parseLocalDate } from "@/lib/dates/parse-local-date";
import type { PaycheckProjection, RecurringFrequency } from "@/types/finance";

export type PaycheckRule = {
  id: string;
  name: string;
  amount: number;
  cadence: RecurringFrequency;
  nextDate: string;
};

export function isPayrollRule(rule: PaycheckRule): boolean {
  return rule.name.toLowerCase().includes("payroll") || rule.cadence === "bi-weekly";
}

/** Project the next N paychecks from recurring income rules. */
export function buildPaycheckProjections(
  rules: PaycheckRule[],
  count = 3,
  now = new Date()
): PaycheckProjection[] {
  const payroll = rules.find(isPayrollRule);
  if (!payroll) {
    return Array.from({ length: count }, (_, idx) => ({
      id: `pay-${idx + 1}`,
      date: formatLocalDate(addWeeks(now, idx + 1)),
      amount: 1825,
      status: "expected" as const,
    }));
  }

  let cursor = parseLocalDate(payroll.nextDate);
  const weekStep = payroll.cadence === "bi-weekly" ? 2 : 1;

  return Array.from({ length: count }, (_, idx) => {
    const entry: PaycheckProjection = {
      id: `${payroll.id}-${idx}`,
      date: formatLocalDate(cursor),
      amount: payroll.amount,
      status: "expected",
    };
    cursor = addWeeks(cursor, weekStep);
    return entry;
  });
}
