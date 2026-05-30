"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { DashboardCashflowMinimal } from "@/components/fintech/dashboard-cashflow-minimal";
import { Skeleton } from "@/components/fintech/ui";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { useMounted } from "@/components/use-mounted";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { RecurringFrequency } from "@/types/finance";
import { useShallow } from "zustand/react/shallow";

function UpcomingList({
  paychecks,
  bills,
  currency,
}: {
  paychecks: { date: string; amount: number }[];
  bills: { name: string; date: string; amount: number }[];
  currency: ReturnType<typeof useAppDataStore.getState>["preferences"]["currency"];
}) {
  const items = [
    ...paychecks.slice(0, 1).map((p) => ({ name: "Paycheck", date: p.date, amount: p.amount, kind: "Paycheck" as const })),
    ...bills.slice(0, 3).map((b) => ({ ...b, kind: "Bill" as const })),
  ].slice(0, 4);

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Add recurring bills in{" "}
        <Link href="/recurring" className="text-slate-700 underline">
          Recurring
        </Link>{" "}
        to see what&apos;s coming up.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={`${item.kind}-${item.name}-${item.date}`} className="flex items-center justify-between py-3.5">
          <div>
            <p className="text-sm font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">
              {item.kind} · {format(parseISO(item.date), "MMM d")}
            </p>
          </div>
          <p className={cn("text-sm font-medium", item.kind === "Paycheck" ? "text-emerald-600" : "text-slate-700")}>
            {item.kind === "Paycheck" ? "+" : "−"}
            {formatMoney(Math.abs(item.amount), currency)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function DashboardView() {
  const mounted = useMounted();
  const { accounts, categories, transactions, recurring, preferences, onboardingComplete } =
    useAppDataStore(
      useShallow((s) => ({
        accounts: s.accounts,
        categories: s.categories,
        transactions: s.demoTransactions,
        recurring: s.demoRecurring,
        preferences: s.preferences,
        onboardingComplete: s.onboardingComplete,
      }))
    );

  const data = useMemo(
    () =>
      computeDashboardSummary({
        accounts,
        categories,
        transactions,
        recurring: recurring.map((r) => ({
          id: r.id,
          name: r.name,
          amount: r.amount,
          cadence: r.cadence as RecurringFrequency,
          nextDate: r.nextDate,
        })),
      }),
    [accounts, categories, transactions, recurring]
  );

  const needsSetup = !onboardingComplete || accounts.length === 0;

  if (!mounted) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 md:pb-0">
      {needsSetup ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-900">Welcome — start with your paycheck</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Tell us when you get paid and which bills repeat each month. We&apos;ll show how much is safe to spend.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white"
          >
            Set up in 2 minutes
          </Link>
        </section>
      ) : null}

      <header className="space-y-1">
        <p className="text-sm text-slate-500">Current balance</p>
        <p className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          {formatMoney(data.totalBalance, preferences.currency)}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-8 border-y border-slate-200 py-8">
        <div>
          <p className="text-sm text-slate-500">Income this month</p>
          <p className="mt-1 text-2xl font-medium text-emerald-600">
            {formatMoney(data.incomeThisMonth, preferences.currency)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Expenses this month</p>
          <p className="mt-1 text-2xl font-medium text-slate-800">
            {formatMoney(data.expensesThisMonth, preferences.currency)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 px-8 py-10 text-white">
        <p className="text-sm font-medium text-slate-300">Money left to spend</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {formatMoney(data.moneyLeftToSpend, preferences.currency)}
        </p>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          {data.daysUntilNextPaycheck != null
            ? `Before your next paycheck in ${data.daysUntilNextPaycheck} days.`
            : "Based on your budgets and spending this month."}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-sm font-medium text-slate-900">Coming up</h2>
        <div className="mt-4">
          <UpcomingList
            paychecks={data.upcomingPaychecks}
            bills={data.upcomingBills}
            currency={preferences.currency}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-sm font-medium text-slate-900">Cash flow</h2>
        <p className="mt-1 text-xs text-slate-500">Income vs expenses over recent months</p>
        <div className="mt-6">
          <DashboardCashflowMinimal data={data.cashflow} currency={preferences.currency} />
        </div>
      </section>

      <p className="text-center text-xs text-slate-400">
        <Link href="/recurring" className="underline hover:text-slate-600">
          Recurring bills
        </Link>
        {" · "}
        <Link href="/accounts" className="underline hover:text-slate-600">
          Accounts
        </Link>
        {" · "}
        <Link href="/more" className="underline hover:text-slate-600">
          More tools
        </Link>
      </p>
    </div>
  );
}
