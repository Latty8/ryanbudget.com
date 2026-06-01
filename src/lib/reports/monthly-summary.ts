import { endOfMonth, startOfMonth } from "date-fns";
import { SYSTEM_UNCATEGORIZED_NAME } from "@/lib/categories/system-category";
import {
  computeReportData,
  type CategorySpend,
} from "@/lib/reports/compute-report-data";
import type { AppAccount, AppCategory, CurrencyCode } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export type MonthlySummary = {
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  topCategories: CategorySpend[];
};

export function computeMonthlySummary(input: {
  accounts: AppAccount[];
  categories: AppCategory[];
  transactions: DemoTransaction[];
  primaryCurrency: CurrencyCode;
  cadence?: "monthly" | "biweekly";
}): MonthlySummary {
  const now = new Date();
  const range = {
    preset: "this-month" as const,
    start: startOfMonth(now),
    end: endOfMonth(now),
    label: "This month",
  };
  const report = computeReportData({
    range,
    cadence: input.cadence ?? "biweekly",
    accounts: input.accounts,
    categories: input.categories,
    transactions: input.transactions,
    primaryCurrency: input.primaryCurrency,
  });
  const savingsRate =
    report.income > 0 ? Math.round(((report.net / report.income) * 100 + Number.EPSILON) * 10) / 10 : 0;

  return {
    income: report.income,
    expenses: report.expenses,
    net: report.net,
    savingsRate,
    topCategories: report.spendingByCategory
      .filter((c) => c.name !== SYSTEM_UNCATEGORIZED_NAME)
      .slice(0, 5),
  };
}
