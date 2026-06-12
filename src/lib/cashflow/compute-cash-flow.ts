import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { isIncomeRecurring } from "@/lib/recurring/cadence-display";
import { projectRecurringSchedule } from "@/lib/recurring/project-schedule";
import type { AppRecurringRule } from "@/types/app-settings";

export type CashFlowEvent = {
  date: string;
  name: string;
  amount: number;
  kind: "income" | "expense";
};

export type CashFlowDay = {
  date: string;
  balance: number;
  events: CashFlowEvent[];
};

export type CashFlowSummary = {
  days: CashFlowDay[];
  startingBalance: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  /** True when balance dips below zero before next income, even if month-end is fine */
  timingWarning: boolean;
  /** Spendable now without going negative before next paycheck (conservative) */
  safeToSpend: number;
  nextIncomeDate: string | null;
  nextIncomeAmount: number;
};

function isIncomeRule(rule: AppRecurringRule): boolean {
  return (
    isIncomeRecurring(rule.name) ||
    /payroll|paycheck|salary|deposit|income/i.test(rule.name)
  );
}

export function buildCashFlowEvents(
  recurring: AppRecurringRule[],
  horizonDays = 45
): CashFlowEvent[] {
  const monthsAhead = Math.ceil(horizonDays / 28);
  const schedule = projectRecurringSchedule(recurring, { monthsAhead, maxPerRule: 12 });
  const cutoff = addDays(new Date(), horizonDays);
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const events: CashFlowEvent[] = [];
  for (const item of schedule) {
    if (item.skipped) continue;
    const d = parseISO(item.date);
    if (d > cutoff || item.date < todayKey) continue;
    const rule = recurring.find((r) => r.id === item.ruleId);
    if (!rule) continue;
    if (rule.paused && !rule.pausedUntil) continue;

    const income = isIncomeRule(rule);
    events.push({
      date: item.date,
      name: item.name,
      amount: income ? Math.abs(item.amount) : -Math.abs(item.amount),
      kind: income ? "income" : "expense",
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function computeCashFlowSummary(input: {
  startingBalance: number;
  recurring: AppRecurringRule[];
  horizonDays?: number;
}): CashFlowSummary {
  const horizonDays = input.horizonDays ?? 45;
  const events = buildCashFlowEvents(input.recurring, horizonDays);
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");

  const byDate = new Map<string, CashFlowEvent[]>();
  for (const ev of events) {
    if (!byDate.has(ev.date)) byDate.set(ev.date, []);
    byDate.get(ev.date)!.push(ev);
  }

  const days: CashFlowDay[] = [];
  let balance = input.startingBalance;
  let lowestBalance = balance;
  let lowestBalanceDate = todayKey;

  for (let i = 0; i <= horizonDays; i++) {
    const d = addDays(today, i);
    const key = format(d, "yyyy-MM-dd");
    const dayEvents = byDate.get(key) ?? [];
    for (const ev of dayEvents) balance += ev.amount;
    balance = Math.round(balance * 100) / 100;
    if (balance < lowestBalance) {
      lowestBalance = balance;
      lowestBalanceDate = key;
    }
    days.push({ date: key, balance, events: dayEvents });
  }

  const futureIncome = events.filter((e) => e.kind === "income" && e.date >= todayKey);
  const nextIncome = futureIncome[0] ?? null;

  const expensesBeforeNextIncome = nextIncome
    ? events.filter(
        (e) =>
          e.kind === "expense" &&
          e.date >= todayKey &&
          e.date <= nextIncome.date
      )
    : events.filter((e) => e.kind === "expense" && e.date >= todayKey);

  const expenseTotal = expensesBeforeNextIncome.reduce((s, e) => s + Math.abs(e.amount), 0);
  const safeToSpend = Math.max(
    0,
    Math.round((input.startingBalance - expenseTotal) * 100) / 100
  );

  const timingWarning =
    lowestBalance < 0 &&
    (nextIncome == null || parseISO(lowestBalanceDate) <= parseISO(nextIncome.date));

  return {
    days,
    startingBalance: input.startingBalance,
    lowestBalance,
    lowestBalanceDate,
    timingWarning,
    safeToSpend,
    nextIncomeDate: nextIncome?.date ?? null,
    nextIncomeAmount: nextIncome?.amount ?? 0,
  };
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInCalendarDays(parseISO(dateStr), new Date());
}
