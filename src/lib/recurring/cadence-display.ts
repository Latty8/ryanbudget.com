import type { RecurringFrequency } from "@/types/finance";

export const CADENCE_META: Record<
  RecurringFrequency,
  { label: string; short: string; biweekly?: boolean }
> = {
  weekly: { label: "Weekly", short: "Wk" },
  "bi-weekly": { label: "Every 2 weeks", short: "2wk", biweekly: true },
  monthly: { label: "Monthly", short: "Mo" },
  yearly: { label: "Yearly", short: "Yr" },
};

export function isIncomeRecurring(name: string) {
  return /payroll|paycheck|salary|income|deposit|wage/i.test(name);
}
