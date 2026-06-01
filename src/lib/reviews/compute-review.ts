import {
  endOfMonth,
  endOfYear,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";
import type { AppGoal } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export type ReviewPeriod = "month" | "year";

export type ReviewSelection = {
  period: ReviewPeriod;
  /** yyyy-MM for month, yyyy for year */
  key: string;
};

export type CategoryHighlight = {
  name: string;
  spent: number;
  pct: number;
};

export type MonthHighlight = {
  key: string;
  label: string;
  net: number;
  expenses: number;
};

export type GoalHighlight = {
  id: string;
  name: string;
  pct: number;
  current: number;
  target: number;
};

export type ReviewData = {
  label: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
  transactionCount: number;
  prevIncome: number;
  prevExpenses: number;
  prevNet: number;
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  topCategories: CategoryHighlight[];
  insights: string[];
  bestMonth: MonthHighlight | null;
  worstMonth: MonthHighlight | null;
  goalHighlights: GoalHighlight[];
};

function txInRange(t: DemoTransaction, start: Date, end: Date) {
  const d = parseISO(t.date);
  return isWithinInterval(d, { start, end });
}

function sumPeriod(transactions: DemoTransaction[], start: Date, end: Date) {
  let income = 0;
  let expenses = 0;
  let count = 0;
  for (const t of transactions) {
    if (!txInRange(t, start, end)) continue;
    count += 1;
    if (t.amount > 0) income += t.amount;
    else expenses += Math.abs(t.amount);
  }
  return { income, expenses, net: income - expenses, count };
}

function categorySpend(transactions: DemoTransaction[], start: Date, end: Date) {
  const map = new Map<string, number>();
  let total = 0;
  for (const t of transactions) {
    if (!txInRange(t, start, end) || t.amount >= 0) continue;
    const spent = Math.abs(t.amount);
    total += spent;
    map.set(t.category, (map.get(t.category) ?? 0) + spent);
  }
  const rows = [...map.entries()]
    .map(([name, spent]) => ({ name, spent, pct: total > 0 ? (spent / total) * 100 : 0 }))
    .sort((a, b) => b.spent - a.spent);
  return { rows, total };
}

function monthKeysInYear(year: number) {
  return Array.from({ length: 12 }, (_, i) => format(new Date(year, i, 1), "yyyy-MM"));
}

function resolveRange(selection: ReviewSelection): { start: Date; end: Date; label: string } {
  if (selection.period === "year") {
    const y = Number(selection.key);
    const start = startOfYear(new Date(y, 0, 1));
    const end = endOfYear(start);
    return { start, end, label: `${y}` };
  }
  const start = startOfMonth(parseISO(`${selection.key}-01`));
  const end = endOfMonth(start);
  return { start, end, label: format(start, "MMMM yyyy") };
}

function prevRange(selection: ReviewSelection): { start: Date; end: Date } {
  if (selection.period === "year") {
    const y = Number(selection.key) - 1;
    const start = startOfYear(new Date(y, 0, 1));
    return { start, end: endOfYear(start) };
  }
  const start = startOfMonth(subMonths(parseISO(`${selection.key}-01`), 1));
  return { start, end: endOfMonth(start) };
}

function buildInsights(
  current: ReturnType<typeof sumPeriod>,
  prev: ReturnType<typeof sumPeriod>,
  top: CategoryHighlight[]
): string[] {
  const lines: string[] = [];
  if (current.net > 0) {
    lines.push(`You kept ${((current.net / Math.max(current.income, 1)) * 100).toFixed(0)}% of income after expenses.`);
  } else if (current.expenses > current.income) {
    lines.push("Spending exceeded income this period — check recurring bills and discretionary categories.");
  }
  if (prev.expenses > 0) {
    const delta = ((current.expenses - prev.expenses) / prev.expenses) * 100;
    if (delta <= -8) lines.push(`Expenses dropped ${Math.abs(delta).toFixed(0)}% vs the previous period.`);
    if (delta >= 12) lines.push(`Expenses rose ${delta.toFixed(0)}% vs the previous period.`);
  }
  if (top[0]) lines.push(`${top[0].name} was your largest category at ${top[0].pct.toFixed(0)}% of spending.`);
  if (lines.length === 0) lines.push("Keep logging transactions for richer insights next period.");
  return lines.slice(0, 4);
}

function bestWorstMonths(transactions: DemoTransaction[], year: number): {
  best: MonthHighlight | null;
  worst: MonthHighlight | null;
} {
  const highlights: MonthHighlight[] = monthKeysInYear(year).map((key) => {
    const start = startOfMonth(parseISO(`${key}-01`));
    const end = endOfMonth(start);
    const { net, expenses } = sumPeriod(transactions, start, end);
    return { key, label: format(start, "MMM yyyy"), net, expenses };
  });
  const withSpend = highlights.filter((h) => h.expenses > 0);
  if (!withSpend.length) return { best: null, worst: null };
  const best = [...withSpend].sort((a, b) => b.net - a.net)[0] ?? null;
  const worst = [...withSpend].sort((a, b) => a.net - b.net)[0] ?? null;
  return { best, worst };
}

function goalHighlights(goals: AppGoal[]): GoalHighlight[] {
  return [...goals]
    .filter((g) => g.target > 0)
    .map((g) => ({
      id: g.id,
      name: g.name,
      pct: Math.min(100, (g.current / g.target) * 100),
      current: g.current,
      target: g.target,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
}

export function computeReview(
  transactions: DemoTransaction[],
  selection: ReviewSelection,
  goals: AppGoal[] = []
): ReviewData {
  const { start, end, label } = resolveRange(selection);
  const prev = prevRange(selection);
  const current = sumPeriod(transactions, start, end);
  const previous = sumPeriod(transactions, prev.start, prev.end);
  const cats = categorySpend(transactions, start, end);

  const incomeChangePct =
    previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : null;
  const expenseChangePct =
    previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : null;

  const year = selection.period === "year" ? Number(selection.key) : start.getFullYear();
  const { best, worst } =
    selection.period === "year"
      ? bestWorstMonths(transactions, year)
      : { best: null, worst: null };

  return {
    label,
    income: current.income,
    expenses: current.expenses,
    net: current.net,
    savingsRate: current.income > 0 ? (current.net / current.income) * 100 : 0,
    transactionCount: current.count,
    prevIncome: previous.income,
    prevExpenses: previous.expenses,
    prevNet: previous.net,
    incomeChangePct,
    expenseChangePct,
    topCategories: cats.rows.slice(0, 6),
    insights: buildInsights(current, previous, cats.rows),
    bestMonth: best,
    worstMonth: worst,
    goalHighlights: goalHighlights(goals),
  };
}

export function formatReviewMonthKey(key: string): string {
  return format(startOfMonth(parseISO(`${key}-01`)), "MMMM yyyy");
}

export function defaultReviewSelection(): ReviewSelection {
  return { period: "month", key: format(new Date(), "yyyy-MM") };
}

export function reviewYearOptions(count = 4): number[] {
  const y = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => y - i);
}

export function reviewMonthOptions(count = 12): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => format(subMonths(now, i), "yyyy-MM"));
}
