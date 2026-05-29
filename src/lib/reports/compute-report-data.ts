import {
  addMonths,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { convertAmount } from "@/lib/currency/exchange-rates";
import type { AppAccount, AppCategory, CurrencyCode } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export type ReportDatePreset = "this-month" | "last-3-months" | "this-year" | "custom";

export type ReportRange = {
  preset: ReportDatePreset;
  start: Date;
  end: Date;
  label: string;
};

export type CashflowPoint = {
  label: string;
  income: number;
  expenses: number;
  net: number;
};

export type CategorySpend = {
  name: string;
  value: number;
  color: string;
};

export type BudgetVsActual = {
  name: string;
  budgeted: number;
  spent: number;
};

export type NetWorthPoint = {
  label: string;
  netWorth: number;
};

export function resolveReportRange(
  preset: ReportDatePreset,
  customStart?: string,
  customEnd?: string
): ReportRange {
  const now = new Date();
  if (preset === "this-month") {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return { preset, start, end, label: format(start, "MMMM yyyy") };
  }
  if (preset === "last-3-months") {
    const start = startOfMonth(subMonths(now, 2));
    const end = endOfMonth(now);
    return {
      preset,
      start,
      end,
      label: `${format(start, "MMM yyyy")} – ${format(end, "MMM yyyy")}`,
    };
  }
  if (preset === "this-year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = endOfMonth(now);
    return { preset, start, end, label: `${now.getFullYear()} year to date` };
  }
  const start = customStart ? parseISO(customStart) : startOfMonth(now);
  const end = customEnd ? parseISO(customEnd) : endOfMonth(now);
  return {
    preset,
    start,
    end,
    label: `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`,
  };
}

function inRange(dateStr: string, range: ReportRange) {
  const d = parseISO(dateStr);
  return isWithinInterval(d, { start: range.start, end: range.end });
}

function toPrimary(amount: number, from: CurrencyCode | undefined, primary: CurrencyCode) {
  return convertAmount(amount, from ?? primary, primary);
}

export function computeReportData({
  range,
  cadence,
  accounts,
  categories,
  transactions,
  primaryCurrency = "USD",
}: {
  range: ReportRange;
  cadence: "monthly" | "biweekly";
  accounts: AppAccount[];
  categories: AppCategory[];
  transactions: DemoTransaction[];
  primaryCurrency?: CurrencyCode;
}) {
  const scoped = transactions.filter((t) => inRange(t.date, range));

  const income = scoped
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + toPrimary(t.amount, t.currency, primaryCurrency), 0);
  const expenses = Math.abs(
    scoped
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + toPrimary(t.amount, t.currency, primaryCurrency), 0)
  );
  const net = income - expenses;
  const balance = accounts
    .filter((a) => !a.hidden)
    .reduce((s, a) => s + toPrimary(a.balance, a.currency, primaryCurrency), 0);

  const bucketCount =
    cadence === "biweekly"
      ? Math.max(1, Math.ceil(scoped.length / 8) || 4)
      : Math.max(
          1,
          (range.end.getFullYear() - range.start.getFullYear()) * 12 +
            range.end.getMonth() -
            range.start.getMonth() +
            1
        );

  const cashflow: CashflowPoint[] = [];
  if (cadence === "monthly") {
    let cursor = startOfMonth(range.start);
    while (cursor <= range.end) {
      const key = format(cursor, "yyyy-MM");
      const monthTx = scoped.filter((t) => t.date.startsWith(key));
      const inc = monthTx
        .filter((t) => t.amount > 0)
        .reduce((s, t) => s + toPrimary(t.amount, t.currency, primaryCurrency), 0);
      const exp = Math.abs(
        monthTx
          .filter((t) => t.amount < 0)
          .reduce((s, t) => s + toPrimary(t.amount, t.currency, primaryCurrency), 0)
      );
      cashflow.push({
        label: format(cursor, "MMM"),
        income: inc,
        expenses: exp,
        net: inc - exp,
      });
      cursor = addMonths(cursor, 1);
    }
  } else {
    const chunk = Math.max(1, Math.ceil(scoped.length / bucketCount));
    for (let i = 0; i < bucketCount; i++) {
      const slice = scoped.slice(i * chunk, (i + 1) * chunk);
      const inc = slice
        .filter((t) => t.amount > 0)
        .reduce((s, t) => s + toPrimary(t.amount, t.currency, primaryCurrency), 0);
      const exp = Math.abs(
        slice
          .filter((t) => t.amount < 0)
          .reduce((s, t) => s + toPrimary(t.amount, t.currency, primaryCurrency), 0)
      );
      cashflow.push({ label: `P${i + 1}`, income: inc, expenses: exp, net: inc - exp });
    }
  }

  const byCategory = new Map<string, number>();
  for (const t of scoped.filter((tx) => tx.amount < 0)) {
    byCategory.set(
      t.category,
      (byCategory.get(t.category) ?? 0) +
        Math.abs(toPrimary(t.amount, t.currency, primaryCurrency))
    );
  }

  const spendingByCategory: CategorySpend[] = [...byCategory.entries()]
    .map(([name, value]) => {
      const cat = categories.find((c) => c.name === name);
      return { name, value, color: cat?.color ?? "#38bdf8" };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const budgetVsActual: BudgetVsActual[] = categories.map((c) => ({
    name: c.name,
    budgeted: c.budgeted,
    spent: Math.abs(
      scoped
        .filter((t) => t.category === c.name && t.amount < 0)
        .reduce((s, t) => s + toPrimary(t.amount, t.currency, primaryCurrency), 0)
    ),
  }));

  const netWorthTrend: NetWorthPoint[] = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const monthKey = format(monthDate, "yyyy-MM");
    const monthNet = transactions
      .filter((t) => t.date.startsWith(monthKey))
      .reduce((s, t) => s + t.amount, 0);
    return {
      label: format(monthDate, "MMM"),
      netWorth: balance - monthNet * (5 - i) * 0.15,
    };
  });

  return {
    income,
    expenses,
    net,
    balance,
    cashflow,
    spendingByCategory,
    budgetVsActual,
    netWorthTrend,
  };
}
