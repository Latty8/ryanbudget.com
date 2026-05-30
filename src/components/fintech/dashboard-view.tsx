"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Calendar, ChevronRight, ReceiptText } from "lucide-react";
import { HouseholdSharedBanner } from "@/components/fintech/household-shared-banner";
import { ShellCard, Skeleton, useShellTheme } from "@/components/fintech/ui";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { useMounted } from "@/components/use-mounted";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { RecurringFrequency } from "@/types/finance";
import { useShallow } from "zustand/react/shallow";

export function DashboardView() {
  const mounted = useMounted();
  const { isLight } = useShellTheme();

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

  const recent = transactions.slice(0, 5);

  if (!mounted) {
    return (
      <div className="space-y-6 pb-24">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  const muted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {!onboardingComplete && accounts.length === 0 ? (
        <ShellCard className="border-sky-200 bg-sky-50/80 p-5 dark:border-sky-800 dark:bg-sky-950/30">
          <p className="text-sm font-medium text-sky-800 dark:text-sky-200">Finish setup to see your plan</p>
          <p className={cn("mt-1 text-sm", muted)}>
            Add your paycheck and main bills — takes about two minutes.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950"
          >
            Continue setup
          </Link>
        </ShellCard>
      ) : null}

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-neutral-800/80 md:p-8">
        <p className={cn("text-sm font-medium", muted)}>Safe to spend</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {formatMoney(data.moneyLeftToSpend, preferences.currency)}
        </p>
        <p className={cn("mt-2 max-w-md text-sm", muted)}>
          What you can use before your next paycheck and scheduled bills.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div>
            <p className={muted}>Next paycheck</p>
            <p className="mt-0.5 font-medium">
              {data.daysUntilNextPaycheck != null ? `in ${data.daysUntilNextPaycheck} days` : "—"}
            </p>
          </div>
          <div>
            <p className={muted}>Bills before pay</p>
            <p className="mt-0.5 font-medium">{data.billsBeforeNextPaycheck}</p>
          </div>
          <div>
            <p className={muted}>Balance</p>
            <p className="mt-0.5 font-medium">{formatMoney(data.totalBalance, preferences.currency)}</p>
          </div>
        </div>
      </section>

      <HouseholdSharedBanner />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/transactions">
          <ShellCard className="flex items-center justify-between p-5 transition hover:border-sky-300/50">
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-sky-500" />
              <div>
                <p className="font-medium">Transactions</p>
                <p className={cn("text-sm", muted)}>View and search spending</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5", muted)} />
          </ShellCard>
        </Link>
        <Link href="/budgets">
          <ShellCard className="flex items-center justify-between p-5 transition hover:border-sky-300/50">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-medium">Budgets</p>
                <p className={cn("text-sm", muted)}>Category limits this month</p>
              </div>
            </div>
            <ChevronRight className={cn("h-5 w-5", muted)} />
          </ShellCard>
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Link href="/transactions" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <ShellCard className="p-6 text-center">
            <p className={cn("text-sm", muted)}>No transactions yet.</p>
            <p className={cn("mt-1 text-xs", muted)}>Tap the + button to log your first one.</p>
          </ShellCard>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-neutral-800/80">
            {recent.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{tx.merchant}</p>
                  <p className={cn("text-xs", muted)}>
                    {tx.date} · {tx.category}
                  </p>
                </div>
                <p className={tx.amount >= 0 ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"}>
                  {formatMoney(tx.amount, preferences.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={cn("text-center text-xs", muted)}>
        Advanced tools (reports, goals, AI) live under{" "}
        <Link href="/more" className="text-sky-600 hover:underline dark:text-sky-400">
          More
        </Link>
        .
      </p>
    </div>
  );
}
