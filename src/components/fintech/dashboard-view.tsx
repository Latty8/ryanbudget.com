"use client";

import Link from "next/link";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { DashboardAiInsights } from "@/components/fintech/dashboard-ai-insights";
import { DashboardBudgetProgress } from "@/components/fintech/dashboard-budget-progress";
import { DashboardCashflowMinimal } from "@/components/fintech/dashboard-cashflow-minimal";
import { getEffectiveBudgetPeriod, periodLabel, periodSpentLabel } from "@/lib/budget/period";
import {
  fintechDivide,
  fintechDisplay,
  fintechForeground,
  fintechGlass,
  fintechHero,
  fintechLabel,
  fintechLink,
  fintechMuted,
  fintechSurface,
  Skeleton,
} from "@/components/fintech/ui";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { useMounted } from "@/components/use-mounted";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { RecurringFrequency } from "@/types/finance";
import { useShallow } from "zustand/react/shallow";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

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
      <p className={cn("text-sm", fintechMuted)}>
        Add recurring in{" "}
        <Link href="/recurring" className={fintechLink}>
          Recurring
        </Link>
      </p>
    );
  }

  return (
    <ul className={cn("divide-y", fintechDivide)}>
      {items.map((item) => (
        <li key={`${item.kind}-${item.name}-${item.date}`} className="flex items-center justify-between py-3.5">
          <div>
            <p className={cn("text-sm font-medium", fintechForeground)}>{item.name}</p>
            <p className={cn("text-xs", fintechMuted)}>
              {item.kind} · {format(parseISO(item.date), "MMM d")}
            </p>
          </div>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              item.kind === "Paycheck" ? "text-[var(--positive)]" : fintechForeground
            )}
          >
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

  const budgetPeriod = useMemo(
    () => getEffectiveBudgetPeriod(preferences.budgetPeriod, recurring),
    [preferences.budgetPeriod, recurring]
  );

  const data = useMemo(
    () =>
      computeDashboardSummary({
        accounts,
        categories,
        transactions,
        budgetPeriod,
        recurring: recurring
          .filter((r) => !r.paused)
          .map((r) => ({
            id: r.id,
            name: r.name,
            amount: r.amount,
            cadence: r.cadence as RecurringFrequency,
            nextDate: r.nextDate,
          })),
      }),
    [accounts, categories, transactions, recurring, budgetPeriod]
  );

  const needsSetup = !onboardingComplete || accounts.length === 0;
  const underBudget = Math.max(0, data.moneyLeftToSpend);

  if (!mounted) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-28 rounded-[var(--radius-card)]" />
        <Skeleton className="h-40 rounded-[var(--radius-card)]" />
        <Skeleton className="h-56 rounded-[var(--radius-card)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 md:space-y-10 md:pb-0">
      {needsSetup ? (
        <motion.section {...fadeUp} className={cn(fintechGlass, "p-8 text-center")}>
          <p className={cn("text-lg font-semibold", fintechForeground)}>Welcome — start with your paycheck</p>
          <p className={cn("mx-auto mt-2 max-w-sm text-sm leading-relaxed", fintechMuted)}>
            Tell us when you get paid and which bills repeat each month.
          </p>
          <SetupOnboardingLink className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-glow)] transition hover:brightness-110">
            Set up in 2 minutes
          </SetupOnboardingLink>
        </motion.section>
      ) : null}

      <motion.header {...fadeUp} transition={{ delay: 0.05 }} className="space-y-2">
        <p className={fintechLabel}>Current balance</p>
        <p className={cn("text-4xl md:text-5xl", fintechDisplay)}>
          {formatMoney(data.totalBalance, preferences.currency)}
        </p>
      </motion.header>

      <motion.section
        {...fadeUp}
        transition={{ delay: 0.1 }}
        className={cn(fintechHero, "relative overflow-hidden px-8 py-10")}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <p className="text-sm font-medium text-white/70">Money left to spend</p>
        <p className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
          {formatMoney(data.moneyLeftToSpend, preferences.currency)}
        </p>
        <p className="mt-3 max-w-md text-sm text-white/60">
          {data.daysUntilNextPaycheck != null
            ? `Before your next paycheck in ${data.daysUntilNextPaycheck} days.`
            : "Based on your budgets and spending this month."}
          {underBudget > 0 && data.daysUntilNextPaycheck != null
            ? ` You're about ${formatMoney(underBudget, preferences.currency)} under budget.`
            : null}
        </p>
      </motion.section>

      <motion.div
        {...fadeUp}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-4 md:gap-6"
      >
        <div className={cn(fintechGlass, "p-5")}>
          <p className={fintechLabel}>Income</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--positive)]">
            {formatMoney(data.incomeThisMonth, preferences.currency)}
          </p>
          <p className={cn("mt-1 text-xs", fintechMuted)}>This month</p>
        </div>
        <div className={cn(fintechGlass, "p-5")}>
          <p className={fintechLabel}>Expenses</p>
          <p className={cn("mt-2 text-2xl font-semibold", fintechForeground)}>
            {formatMoney(data.expensesThisMonth, preferences.currency)}
          </p>
          <p className={cn("mt-1 text-xs", fintechMuted)}>This month</p>
        </div>
      </motion.div>

      {!needsSetup && data.categoryProgress.length > 0 ? (
        <motion.div {...fadeUp} transition={{ delay: 0.18 }}>
          <DashboardBudgetProgress
            categories={data.categoryProgress}
            currency={preferences.currency}
            budgetPeriod={budgetPeriod}
          />
        </motion.div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-5 md:gap-8">
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.2 }}
          className={cn(fintechSurface, "p-6 md:col-span-3 md:p-8")}
        >
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Cash flow</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>Income vs expenses</p>
          <div className="mt-6">
            <DashboardCashflowMinimal data={data.cashflow} currency={preferences.currency} />
          </div>
        </motion.section>

        <motion.section
          {...fadeUp}
          transition={{ delay: 0.25 }}
          className={cn(fintechSurface, "p-6 md:col-span-2 md:p-7")}
        >
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Coming up</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>Paycheck & bills</p>
          <div className="mt-4">
            <UpcomingList
              paychecks={data.upcomingPaychecks}
              bills={data.upcomingBills}
              currency={preferences.currency}
            />
          </div>
        </motion.section>
      </div>

      {!needsSetup ? (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <DashboardAiInsights
            summary={data}
            categories={categories}
            transactions={transactions}
            currency={preferences.currency}
            baselineInsights={data.insights}
          />
        </motion.div>
      ) : null}

      <p className={cn("text-center text-xs", fintechMuted)}>
        <Link href="/recurring" className={fintechLink}>
          Recurring
        </Link>
        {" · "}
        <Link href="/accounts" className={fintechLink}>
          Accounts
        </Link>
        {" · "}
        <Link href="/more" className={fintechLink}>
          More
        </Link>
      </p>
    </div>
  );
}
