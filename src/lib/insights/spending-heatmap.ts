import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  getDay,
  isWeekend,
  parseISO,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export type HeatmapMetric = "spending" | "income" | "net";
export type HeatmapRange = "3" | "6" | "12" | "all";

export type HeatmapCategorySlice = {
  name: string;
  amount: number;
};

export type HeatmapDay = {
  date: string;
  label: string;
  spending: number;
  income: number;
  net: number;
  value: number;
  intensity: number;
  topCategories: HeatmapCategorySlice[];
  inRange: boolean;
};

export type HeatmapWeekColumn = {
  weekStart: string;
  days: (HeatmapDay | null)[];
};

export type HeatmapGrid = {
  weeks: HeatmapWeekColumn[];
  monthLabels: { weekIndex: number; label: string }[];
  dayLabels: string[];
  days: HeatmapDay[];
  maxValue: number;
};

export type HeatmapSummary = {
  averageDaily: number;
  highest: HeatmapDay | null;
  lowest: HeatmapDay | null;
  weekdayAverage: number;
  weekendAverage: number;
  /** Which period has higher average activity for the selected metric. */
  higherSpendPeriod: "weekday" | "weekend" | "tie" | null;
  activeDays: number;
  totalInRange: number;
};

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function metricValue(spending: number, income: number, metric: HeatmapMetric) {
  if (metric === "spending") return spending;
  if (metric === "income") return income;
  return income - spending;
}

function aggregateDay(
  transactions: DemoTransaction[],
  date: string,
  metric: HeatmapMetric
): Omit<HeatmapDay, "date" | "label" | "intensity" | "inRange"> {
  let spending = 0;
  let income = 0;
  const expenseCats = new Map<string, number>();
  const incomeCats = new Map<string, number>();

  for (const tx of transactions) {
    if (!tx.date.startsWith(date)) continue;
    if (tx.amount < 0) {
      const amt = Math.abs(tx.amount);
      spending += amt;
      expenseCats.set(tx.category, (expenseCats.get(tx.category) ?? 0) + amt);
    } else if (tx.amount > 0) {
      income += tx.amount;
      incomeCats.set(tx.category, (incomeCats.get(tx.category) ?? 0) + tx.amount);
    }
  }

  let topCategories: HeatmapCategorySlice[];
  if (metric === "income") {
    topCategories = [...incomeCats.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  } else if (metric === "spending") {
    topCategories = [...expenseCats.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  } else {
    topCategories = [
      ...[...expenseCats.entries()].map(([name, amount]) => ({
        name: `Out · ${name}`,
        amount,
      })),
      ...[...incomeCats.entries()].map(([name, amount]) => ({
        name: `In · ${name}`,
        amount,
      })),
    ]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }

  const value = metricValue(spending, income, metric);
  return { spending, income, net: income - spending, value, topCategories };
}

function rangeStartDate(range: HeatmapRange, transactions: DemoTransaction[], now = new Date()) {
  if (range === "all") {
    const dates = transactions.map((t) => t.date.slice(0, 10)).sort();
    if (dates.length === 0) return subMonths(now, 3);
    return parseISO(dates[0]!);
  }
  const months = range === "3" ? 3 : range === "6" ? 6 : 12;
  return subMonths(now, months);
}

export function computeSpendingHeatmapGrid(
  transactions: DemoTransaction[],
  options: {
    range: HeatmapRange;
    metric: HeatmapMetric;
    weekStartsOn?: 0 | 1;
    now?: Date;
  }
): HeatmapGrid {
  const now = options.now ?? new Date();
  const weekStartsOn = options.weekStartsOn ?? 1;
  const rangeStart = rangeStartDate(options.range, transactions, now);
  const rangeEnd = now;

  const gridStart = startOfWeek(rangeStart, { weekStartsOn });
  const gridEnd = endOfWeek(rangeEnd, { weekStartsOn });

  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const rangeStartKey = dayKey(rangeStart);

  const rawDays: HeatmapDay[] = calendarDays.map((d) => {
    const date = dayKey(d);
    const agg = aggregateDay(transactions, date, options.metric);
    const inRange = date >= rangeStartKey && date <= dayKey(rangeEnd);
    return {
      date,
      label: format(d, "EEE, MMM d, yyyy"),
      ...agg,
      inRange,
      intensity: 0,
    };
  });

  const inRangeDays = rawDays.filter((d) => d.inRange);
  const valuesForScale = inRangeDays
    .map((d) => (options.metric === "net" ? Math.abs(d.value) : d.value))
    .filter((v) => v > 0);
  const maxValue = Math.max(1, ...valuesForScale);

  for (const day of rawDays) {
    if (!day.inRange) {
      day.intensity = 0;
      continue;
    }
    const v = options.metric === "net" ? Math.abs(day.value) : day.value;
    day.intensity = v <= 0 ? 0 : v / maxValue;
  }

  const weeks: HeatmapWeekColumn[] = [];
  for (let i = 0; i < rawDays.length; i += 7) {
    weeks.push({
      weekStart: rawDays[i]!.date,
      days: rawDays.slice(i, i + 7).map((d) => d),
    });
  }

  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = "";
  weeks.forEach((w, wi) => {
    const first = w.days.find((d) => d != null);
    if (!first) return;
    const month = format(parseISO(first.date), "MMM");
    if (month !== lastMonth) {
      monthLabels.push({ weekIndex: wi, label: month });
      lastMonth = month;
    }
  });

  const dayLabels =
    weekStartsOn === 1
      ? ["Mon", "", "Wed", "", "Fri", "", "Sun"]
      : ["Sun", "", "Tue", "", "Thu", "", "Sat"];

  return {
    weeks,
    monthLabels,
    dayLabels,
    days: inRangeDays,
    maxValue,
  };
}

export function computeHeatmapSummary(
  days: HeatmapDay[],
  metric: HeatmapMetric
): HeatmapSummary {
  const active = days.filter((d) => {
    if (metric === "spending") return d.spending > 0;
    if (metric === "income") return d.income > 0;
    return d.value !== 0;
  });

  const totalInRange = days.reduce((s, d) => s + Math.abs(d.value), 0);
  const averageDaily = days.length > 0 ? totalInRange / days.length : 0;

  const compare = (d: HeatmapDay) =>
    metric === "net" ? Math.abs(d.value) : metric === "income" ? d.income : d.spending;

  const withActivity = active.filter((d) => compare(d) > 0);
  const highest =
    withActivity.length > 0
      ? withActivity.reduce((a, b) => (compare(a) >= compare(b) ? a : b))
      : null;
  const lowest =
    withActivity.length > 0
      ? withActivity.reduce((a, b) => (compare(a) <= compare(b) ? a : b))
      : null;

  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  for (const d of withActivity) {
    const dow = getDay(parseISO(d.date));
    const isWe = isWeekend(dow);
    const v = compare(d);
    if (isWe) {
      weekendTotal += v;
      weekendCount += 1;
    } else {
      weekdayTotal += v;
      weekdayCount += 1;
    }
  }

  const weekdayAverage = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
  const weekendAverage = weekendCount > 0 ? weekendTotal / weekendCount : 0;

  let higherSpendPeriod: HeatmapSummary["higherSpendPeriod"] = null;
  if (weekdayCount > 0 && weekendCount > 0) {
    const diff = Math.abs(weekdayAverage - weekendAverage);
    const threshold = Math.max(weekdayAverage, weekendAverage) * 0.02;
    if (diff <= threshold) higherSpendPeriod = "tie";
    else if (weekendAverage > weekdayAverage) higherSpendPeriod = "weekend";
    else higherSpendPeriod = "weekday";
  }

  return {
    averageDaily,
    highest,
    lowest,
    weekdayAverage,
    weekendAverage,
    higherSpendPeriod,
    activeDays: withActivity.length,
    totalInRange,
  };
}

export function heatmapLevel(intensity: number): 0 | 1 | 2 | 3 | 4 {
  if (intensity <= 0) return 0;
  if (intensity < 0.2) return 1;
  if (intensity < 0.45) return 2;
  if (intensity < 0.7) return 3;
  return 4;
}

/** Soft teal scale aligned with app accent — calm, not alarm-red. */
export const HEATMAP_CELL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-[var(--surface-elevated)] ring-1 ring-inset ring-[var(--border-subtle)]",
  1: "bg-[var(--accent)]/[0.12]",
  2: "bg-[var(--accent)]/[0.28]",
  3: "bg-[var(--accent)]/[0.48]",
  4: "bg-[var(--accent)]/[0.72]",
};

export const HEATMAP_NET_POSITIVE_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-[var(--surface-elevated)] ring-1 ring-inset ring-[var(--border-subtle)]",
  1: "bg-emerald-500/15",
  2: "bg-emerald-500/28",
  3: "bg-emerald-500/42",
  4: "bg-emerald-500/58",
};

export const HEATMAP_NET_NEGATIVE_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-[var(--surface-elevated)] ring-1 ring-inset ring-[var(--border-subtle)]",
  1: "bg-amber-500/12",
  2: "bg-amber-500/22",
  3: "bg-amber-500/34",
  4: "bg-amber-500/48",
};
