import {
  addMonths,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { BudgetPeriod } from "@/lib/budget/period";

export type MonthlySpendPoint = {
  month: string;
  label: string;
  expenses: number;
  income: number;
};

export type CategoryDelta = {
  name: string;
  current: number;
  previous: number;
  change: number;
  changePct: number;
};

export type BiWeeklyBucket = {
  label: string;
  expenses: number;
};

export type SpendingAnalytics = {
  monthlyTrend: MonthlySpendPoint[];
  categoryDeltas: CategoryDelta[];
  biWeeklyPattern: BiWeeklyBucket[];
  periodComparison: {
    currentExpenses: number;
    previousExpenses: number;
    changePct: number;
  };
  yearComparison: {
    ytdExpenses: number;
    priorYtdExpenses: number;
    changePct: number;
  };
  topCategories: Array<{ name: string; spent: number; pct: number }>;
};

function monthKey(d: Date) {
  return format(startOfMonth(d), "yyyy-MM");
}

export function computeSpendingAnalytics(
  transactions: DemoTransaction[],
  options?: { months?: number; budgetPeriod?: BudgetPeriod }
): SpendingAnalytics {
  const months = options?.months ?? 12;
  const now = new Date();
  const monthlyTrend: MonthlySpendPoint[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const m = subMonths(startOfMonth(now), i);
    const key = monthKey(m);
    const inMonth = transactions.filter((t) => t.date.startsWith(key));
    monthlyTrend.push({
      month: key,
      label: format(m, "MMM yyyy"),
      expenses: Math.abs(
        inMonth.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
      ),
      income: inMonth.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    });
  }

  const currentKey = monthKey(now);
  const prevKey = monthKey(subMonths(now, 1));

  const spendByCategory = (key: string) => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (!t.date.startsWith(key) || t.amount >= 0) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    return map;
  };

  const currentMap = spendByCategory(currentKey);
  const prevMap = spendByCategory(prevKey);
  const allCats = new Set([...currentMap.keys(), ...prevMap.keys()]);

  const categoryDeltas: CategoryDelta[] = [...allCats]
    .map((name) => {
      const current = currentMap.get(name) ?? 0;
      const previous = prevMap.get(name) ?? 0;
      const change = current - previous;
      const changePct = previous > 0 ? (change / previous) * 100 : current > 0 ? 100 : 0;
      return { name, current, previous, change, changePct };
    })
    .filter((r) => r.current > 0 || r.previous > 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 12);

  const period = options?.budgetPeriod ?? "bi-weekly";
  const biWeeklyPattern: BiWeeklyBucket[] = [
    { label: "Pay period 1 (days 1–14)", expenses: 0 },
    { label: "Pay period 2 (days 15–31)", expenses: 0 },
  ];
  for (const t of transactions) {
    if (t.amount >= 0 || !t.date.startsWith(currentKey)) continue;
    const day = parseISO(t.date).getDate();
    const bucket = day <= 14 ? 0 : 1;
    biWeeklyPattern[bucket].expenses += Math.abs(t.amount);
  }

  const currentExpenses = monthlyTrend.at(-1)?.expenses ?? 0;
  const previousExpenses = monthlyTrend.at(-2)?.expenses ?? 0;
  const periodComparison = {
    currentExpenses,
    previousExpenses,
    changePct:
      previousExpenses > 0
        ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
        : 0,
  };

  const year = now.getFullYear();
  const ytd = transactions.filter(
    (t) => t.amount < 0 && t.date.startsWith(String(year))
  );
  const priorYtd = transactions.filter(
    (t) => t.amount < 0 && t.date.startsWith(String(year - 1))
  );
  const ytdExpenses = Math.abs(ytd.reduce((s, t) => s + t.amount, 0));
  const priorYtdExpenses = Math.abs(priorYtd.reduce((s, t) => s + t.amount, 0));

  const totalCurrent = [...currentMap.values()].reduce((s, v) => s + v, 0);
  const topCategories = [...currentMap.entries()]
    .map(([name, spent]) => ({
      name,
      spent,
      pct: totalCurrent > 0 ? (spent / totalCurrent) * 100 : 0,
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 8);

  return {
    monthlyTrend,
    categoryDeltas,
    biWeeklyPattern,
    periodComparison,
    yearComparison: {
      ytdExpenses,
      priorYtdExpenses,
      changePct:
        priorYtdExpenses > 0
          ? ((ytdExpenses - priorYtdExpenses) / priorYtdExpenses) * 100
          : 0,
    },
    topCategories,
  };
}

export function analyticsInsightLines(analytics: SpendingAnalytics): string[] {
  const lines: string[] = [];
  const { periodComparison, yearComparison, categoryDeltas, biWeeklyPattern } = analytics;

  if (periodComparison.changePct <= -10) {
    lines.push(
      `Spending is down ${Math.abs(Math.round(periodComparison.changePct))}% vs last month — nice discipline.`
    );
  } else if (periodComparison.changePct >= 15) {
    lines.push(
      `Expenses rose ${Math.round(periodComparison.changePct)}% month over month. Review your top movers below.`
    );
  }

  const biggestUp = categoryDeltas.find((c) => c.change > 50);
  if (biggestUp) {
    lines.push(
      `${biggestUp.name} increased $${biggestUp.change.toFixed(0)} vs last month (${Math.round(biggestUp.changePct)}%).`
    );
  }

  const biggestDown = categoryDeltas.find((c) => c.change < -50);
  if (biggestDown) {
    lines.push(
      `${biggestDown.name} decreased $${Math.abs(biggestDown.change).toFixed(0)} — keep it up.`
    );
  }

  const [p1, p2] = biWeeklyPattern;
  if (p1.expenses > 0 && p2.expenses > 0) {
    const heavier = p1.expenses > p2.expenses ? p1.label : p2.label;
    lines.push(`Heavier spending in ${heavier.toLowerCase()} this month.`);
  }

  if (yearComparison.changePct < -5) {
    lines.push(`Year-to-date spending is ${Math.abs(Math.round(yearComparison.changePct))}% below last year.`);
  }

  return lines.slice(0, 5);
}
