import {
  addDays,
  endOfDay,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
} from "date-fns";
import type { BudgetSettings, Transaction } from "@/lib/types";
import type { PeriodBounds } from "@/lib/period";
import { getPeriodBounds, isDateInPeriod } from "@/lib/period";
import { periodKey } from "@/lib/period-key";

export type AssignmentsMap = Record<string, Record<string, number>>;

export interface YnabPeriodSnapshot {
  bounds: PeriodBounds;
  key: string;
  income: number;
  assignedByCat: Record<string, number>;
  assignedTotal: number;
  activityByCat: Record<string, number>;
  /** Unassigned dollars after assignments this period (Ready to Assign). */
  readyToAssignEnd: number;
  /** Category envelope balances after this period. */
  availableEndByCat: Record<string, number>;
}

export function sumIncomeInPeriod(
  transactions: Transaction[],
  bounds: PeriodBounds
): number {
  return transactions
    .filter((t) => t.type === "income" && isDateInPeriod(t.date, bounds))
    .reduce((s, t) => s + t.amount, 0);
}

export function sumExpenseByCategory(
  transactions: Transaction[],
  bounds: PeriodBounds
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "expense" || !t.categoryId) continue;
    if (!isDateInPeriod(t.date, bounds)) continue;
    out[t.categoryId] = (out[t.categoryId] ?? 0) + t.amount;
  }
  return out;
}

function sumAssignedRow(
  row: Record<string, number> | undefined,
  categoryIds: string[]
): number {
  if (!row) return 0;
  return categoryIds.reduce((s, id) => s + (row[id] ?? 0), 0);
}

export function simulationDateRange(transactions: Transaction[]): {
  start: Date;
  end: Date;
} {
  const today = new Date();
  if (transactions.length === 0) {
    return { start: startOfDay(today), end: endOfDay(today) };
  }
  let minT = parseISO(transactions[0].date);
  let maxT = minT;
  for (const t of transactions) {
    const d = parseISO(t.date);
    if (d < minT) minT = d;
    if (d > maxT) maxT = d;
  }
  const end = maxT > today ? maxT : today;
  return { start: startOfDay(minT), end: endOfDay(end) };
}

/** Ensures the visible budget period is included in the simulation chain. */
export function simulationBoundsRange(
  transactions: Transaction[],
  ensureContains?: PeriodBounds
): { start: Date; end: Date } {
  const base = simulationDateRange(transactions);
  if (!ensureContains) return base;
  return {
    start: minDate([
      base.start,
      startOfDay(ensureContains.start),
    ]),
    end: maxDate([base.end, endOfDay(ensureContains.end)]),
  };
}

/** Budget periods from rangeStart through rangeEnd (inclusive), chronological. */
export function listOrderedPeriodBounds(
  settings: BudgetSettings,
  rangeStart: Date,
  rangeEnd: Date
): PeriodBounds[] {
  const list: PeriodBounds[] = [];
  const seen = new Set<string>();
  let d = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);

  let guard = 0;
  while (d <= end && guard++ < 5000) {
    const b = getPeriodBounds(settings, d);
    const k = periodKey(b);
    if (!seen.has(k)) {
      seen.add(k);
      list.push(b);
      d = addDays(b.end, 1);
    } else {
      d = addDays(d, 1);
    }
  }
  return list;
}

export function simulateYnabBudget(
  settings: BudgetSettings,
  transactions: Transaction[],
  assignmentsByPeriod: AssignmentsMap,
  categoryIds: string[],
  options?: { ensurePeriod?: PeriodBounds }
): Map<string, YnabPeriodSnapshot> {
  const { start, end } = simulationBoundsRange(
    transactions,
    options?.ensurePeriod
  );
  const periods = listOrderedPeriodBounds(settings, start, end);
  const map = new Map<string, YnabPeriodSnapshot>();

  let rta = 0;
  const avail: Record<string, number> = Object.fromEntries(
    categoryIds.map((id) => [id, 0])
  );

  for (const bounds of periods) {
    const key = periodKey(bounds);
    const income = sumIncomeInPeriod(transactions, bounds);
    const activity = sumExpenseByCategory(transactions, bounds);
    const row = assignmentsByPeriod[key] ?? {};
    const assignedByCat: Record<string, number> = {};
    for (const id of categoryIds) {
      assignedByCat[id] = row[id] ?? 0;
    }
    const assignedTotal = categoryIds.reduce(
      (s, id) => s + assignedByCat[id],
      0
    );

    const rtaMid = rta + income;
    const rtaEnd = rtaMid - assignedTotal;

    for (const id of categoryIds) {
      const a = assignedByCat[id];
      const sp = activity[id] ?? 0;
      avail[id] = avail[id] + a - sp;
    }

    rta = rtaEnd;

    map.set(key, {
      bounds,
      key,
      income,
      assignedByCat,
      assignedTotal,
      activityByCat: activity,
      readyToAssignEnd: rtaEnd,
      availableEndByCat: { ...avail },
    });
  }

  return map;
}

/** RTA pool before assigning this period (carry-forward RTA + income this period). */
export function getRtaBudgetPoolForPeriod(
  settings: BudgetSettings,
  transactions: Transaction[],
  assignmentsByPeriod: AssignmentsMap,
  categoryIds: string[],
  focusBounds: PeriodBounds
): number {
  const { start, end } = simulationBoundsRange(transactions, focusBounds);
  const periods = listOrderedPeriodBounds(settings, start, end);
  const focusKey = periodKey(focusBounds);
  let rta = 0;

  for (const bounds of periods) {
    const key = periodKey(bounds);
    const income = sumIncomeInPeriod(transactions, bounds);
    if (key === focusKey) {
      return rta + income;
    }
    const assignedTotal = sumAssignedRow(
      assignmentsByPeriod[key],
      categoryIds
    );
    rta = rta + income - assignedTotal;
  }

  return sumIncomeInPeriod(transactions, focusBounds);
}

export function maxAssignableForCategory(
  settings: BudgetSettings,
  transactions: Transaction[],
  assignmentsByPeriod: AssignmentsMap,
  categoryIds: string[],
  focusBounds: PeriodBounds,
  categoryId: string
): number {
  const pool = getRtaBudgetPoolForPeriod(
    settings,
    transactions,
    assignmentsByPeriod,
    categoryIds,
    focusBounds
  );
  const focusKey = periodKey(focusBounds);
  const row = assignmentsByPeriod[focusKey] ?? {};
  const sumOthers = categoryIds.reduce(
    (s, id) => (id === categoryId ? s : s + (row[id] ?? 0)),
    0
  );
  return Math.max(0, pool - sumOthers);
}

export function getSnapshotForPeriodBounds(
  settings: BudgetSettings,
  transactions: Transaction[],
  assignmentsByPeriod: AssignmentsMap,
  categoryIds: string[],
  focusBounds: PeriodBounds
): YnabPeriodSnapshot | undefined {
  const map = simulateYnabBudget(
    settings,
    transactions,
    assignmentsByPeriod,
    categoryIds,
    { ensurePeriod: focusBounds }
  );
  return map.get(periodKey(focusBounds));
}
