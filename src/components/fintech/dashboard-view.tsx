"use client";

import { RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import { useMemo } from "react";
import { differenceInCalendarDays, format, parseISO, startOfMonth, startOfToday } from "date-fns";
import { motion } from "framer-motion";
import { DashboardBudgetProgress } from "@/components/fintech/dashboard-budget-progress";
import { DashboardCashflowMinimal } from "@/components/fintech/dashboard-cashflow-minimal";
import { MonthlySummaryCard } from "@/components/fintech/monthly-summary-card";
import { usePageCloudSync } from "@/hooks/use-page-cloud-sync";
import { useBudgetViewPeriod } from "@/hooks/use-budget-view-period";
import { periodLabel, periodSpentLabel } from "@/lib/budget/period";
import {
  fintechDivide,
  fintechDisplay,
  fintechForeground,
  fintechHero,
  fintechLabel,
  fintechLink,
  fintechMuted,
  EmptyState,
  fintechCard,
  Skeleton,
} from "@/components/fintech/ui";
import { ExportPdfButton } from "@/components/fintech/export-pdf-button";
import { DashboardCustomizeButton } from "@/components/fintech/dashboard-customize-panel";
import {
  selectEnabledWidgetKey,
  useDashboardWidgetsStore,
  type DashboardWidgetId,
} from "@/store/useDashboardWidgetsStore";
import { computeCategoryBudgetRows } from "@/lib/budget/period";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { CashFlowAlignment } from "@/components/fintech/cash-flow-alignment";
import { buildNetWorthItems, sumNetWorth } from "@/lib/net-worth/compute-net-worth";
import { useDeviceUiStore } from "@/store/useDeviceUiStore";
import { useNetWorthStore } from "@/store/useNetWorthStore";
import { useMounted } from "@/components/use-mounted";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { RecurringFrequency } from "@/types/finance";
import { useShallow } from "zustand/react/shallow";

const AiFinancialCoach = dynamic(
  () => import("@/components/fintech/ai-financial-coach").then((m) => ({ default: m.AiFinancialCoach })),
  { loading: () => <Skeleton className="h-56 rounded-[var(--radius-card)]" /> }
);

const FinancialHealthScore = dynamic(
  () =>
    import("@/components/fintech/financial-health-score").then((m) => ({
      default: m.FinancialHealthScore,
    })),
  { loading: () => <Skeleton className="h-36 rounded-[var(--radius-card)]" />, ssr: false }
);

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const DEFAULT_ENABLED_WIDGETS: DashboardWidgetId[] = [
  "financial_health",
  "balance",
  "money_left",
  "monthly_summary",
  "income_expenses",
  "budget_progress",
  "cashflow",
  "upcoming",
  "ai_insights",
];

function parseEnabledWidgetKey(key: string): DashboardWidgetId[] {
  if (!key) return [];
  return key.split("\0").filter(Boolean) as DashboardWidgetId[];
}

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
      <EmptyState
        icon={RefreshCw}
        title="Nothing scheduled yet"
        description="Add your bi-weekly paycheck and recurring bills to see what's coming up."
        action={
          <Link href="/recurring" className={cn("text-sm font-medium", fintechLink)}>
            Set up recurring
          </Link>
        }
      />
    );
  }

  const today = startOfToday();

  return (
    <ul className={cn("divide-y", fintechDivide)}>
      {items.map((item) => {
        const daysUntil = differenceInCalendarDays(parseISO(item.date), today);
        const dueLabel =
          item.kind === "Bill"
            ? daysUntil < 0
              ? "Overdue"
              : daysUntil === 0
                ? "Due today"
                : daysUntil <= 3
                  ? `Due in ${daysUntil}d`
                  : null
            : daysUntil === 0
              ? "Today"
              : daysUntil > 0 && daysUntil <= 7
                ? `In ${daysUntil}d`
                : null;
        const dueUrgent = item.kind === "Bill" && daysUntil >= 0 && daysUntil <= 3;

        return (
        <li key={`${item.kind}-${item.name}-${item.date}`} className="flex items-center justify-between gap-2 py-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("text-sm font-medium", fintechForeground)}>{item.name}</p>
              {dueLabel ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    dueUrgent || dueLabel === "Overdue"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-[var(--surface-elevated)] text-[var(--muted)]"
                  )}
                >
                  {dueLabel}
                </span>
              ) : null}
            </div>
            <p className={cn("text-xs", fintechMuted)}>
              {item.kind} · {format(parseISO(item.date), "MMM d")}
            </p>
          </div>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              item.amount > 0 ? "text-[var(--positive)]" : item.amount < 0 ? "text-rose-500 dark:text-rose-400" : fintechForeground
            )}
          >
            {item.amount > 0 ? "+" : item.amount < 0 ? "−" : ""}
            {formatMoney(Math.abs(item.amount), currency)}
          </p>
        </li>
        );
      })}
    </ul>
  );
}

export function DashboardView() {
  usePageCloudSync();
  const mounted = useMounted();
  const { accounts, categories, transactions, recurring, preferences, onboardingComplete, goals } =
    useAppDataStore(
      useShallow((s) => ({
        accounts: s.accounts,
        categories: s.categories,
        transactions: s.demoTransactions,
        recurring: s.demoRecurring,
        preferences: s.preferences,
        onboardingComplete: s.onboardingComplete,
        goals: s.goals,
      }))
    );
  const manualNetItems = useNetWorthStore((s) => s.manualItems);
  const netSnapshots = useNetWorthStore((s) => s.snapshots);
  /** Primitive selector — arrays from filter/map break getServerSnapshot (infinite loop). */
  const enabledWidgetKey = useDashboardWidgetsStore(selectEnabledWidgetKey);
  const enabledWidgetIds = useMemo(
    () => parseEnabledWidgetKey(enabledWidgetKey),
    [enabledWidgetKey]
  );
  const widgetOn = (id: DashboardWidgetId) => enabledWidgetIds.includes(id);
  const anyWidgetEnabled = enabledWidgetIds.length > 0;

  const budgetPeriod = useBudgetViewPeriod(recurring);
  const biweeklyIncomeMonthlyBills = useDeviceUiStore((s) => s.biweeklyIncomeMonthlyBills ?? true);

  const data = useMemo(
    () =>
      computeDashboardSummary({
        accounts,
        categories,
        transactions,
        budgetPeriod,
        biweeklyIncomeMonthlyBills,
        fullRecurring: recurring.filter((r) => !r.paused),
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
    [accounts, categories, transactions, recurring, budgetPeriod, biweeklyIncomeMonthlyBills]
  );

  const needsSetup = !onboardingComplete || accounts.length === 0;
  const underBudget = Math.max(0, data.moneyLeftToSpend);

  const budgetRows = useMemo(
    () => computeCategoryBudgetRows(categories, transactions, budgetPeriod),
    [categories, transactions, budgetPeriod]
  );

  const netWorthPdf = useMemo(() => {
    const items = buildNetWorthItems(accounts, manualNetItems);
    const { netWorth } = sumNetWorth(items);
    const sorted = [...netSnapshots].sort((a, b) => a.date.localeCompare(b.date));
    const prior = sorted.length >= 2 ? sorted[sorted.length - 2] : sorted[0];
    const change = prior ? netWorth - prior.netWorth : undefined;
    return { netWorth, change };
  }, [accounts, manualNetItems, netSnapshots]);

  const spendingChartPdf = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.amount >= 0 || parseISO(t.date) < monthStart) continue;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    const total = [...byCat.values()].reduce((s, v) => s + v, 0);
    if (total <= 0) return [];
    return [...byCat.entries()]
      .map(([name, spent]) => ({ name, spent, pct: (spent / total) * 100 }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8);
  }, [transactions]);

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
      <div className="flex flex-wrap justify-end gap-2">
        <DashboardCustomizeButton />
        <ExportPdfButton
          variant="ghost"
          label="Export PDF"
          eventName="pdf_export_dashboard"
          buildPayload={() => ({
            title: `Dashboard · ${format(new Date(), "MMMM yyyy")}`,
            reportKind: "dashboard" as const,
            cadence: budgetPeriod === "bi-weekly" ? "biweekly" : "monthly",
            income: data.incomeThisMonth,
            expenses: data.expensesThisMonth,
            net: data.incomeThisMonth - data.expensesThisMonth,
            balance: data.totalBalance,
            savingsRate:
              data.incomeThisMonth > 0
                ? ((data.incomeThisMonth - data.expensesThisMonth) / data.incomeThisMonth) * 100
                : 0,
            categories: budgetRows.map((r) => ({
              name: r.name,
              budgeted: r.budgeted,
              spent: r.spent,
            })),
            cashflow: data.cashflow.map((p) => ({
              label: p.month,
              income: p.income,
              expenses: p.expenses,
              net: p.income - p.expenses,
            })),
            goals: goals.map((g) => ({
              name: g.name,
              current: g.current,
              target: g.target,
              pct: g.target > 0 ? (g.current / g.target) * 100 : 0,
            })),
            recurring: recurring
              .filter((r) => !r.paused)
              .map((r) => ({
                name: r.name,
                amount: r.amount,
                cadence: r.cadence,
                nextDate: r.nextDate,
              })),
            netWorth: netWorthPdf.netWorth,
            netWorthChange: netWorthPdf.change,
            spendingChart: spendingChartPdf,
            topSpend: spendingChartPdf,
          })}
        />
      </div>
      {!anyWidgetEnabled && !needsSetup ? (
        <motion.section {...fadeUp} className={cn(fintechCard, "p-6 text-center sm:p-8")}>
          <p className={cn("text-lg font-semibold", fintechForeground)}>Dashboard is empty</p>
          <p className={cn("mx-auto mt-2 max-w-sm text-sm leading-relaxed", fintechMuted)}>
            All widgets are hidden. Open Customize and turn on balance, money left, or other sections.
          </p>
        </motion.section>
      ) : null}

      {widgetOn("financial_health") && !needsSetup && mounted ? (
        <motion.div {...fadeUp} transition={{ delay: 0.04 }}>
          <FinancialHealthScore />
        </motion.div>
      ) : null}

      {needsSetup ? (
        <motion.section {...fadeUp} className={cn(fintechCard, "p-6 text-center sm:p-8")}>
          <p className={cn("text-lg font-semibold", fintechForeground)}>Welcome — start with your paycheck</p>
          <p className={cn("mx-auto mt-2 max-w-sm text-sm leading-relaxed", fintechMuted)}>
            Tell us when you get paid and which bills repeat each month.
          </p>
          <SetupOnboardingLink className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent-foreground)] shadow-sm transition hover:brightness-105">
            Set up in 2 minutes
          </SetupOnboardingLink>
        </motion.section>
      ) : null}

      {widgetOn("balance") ? (
        <motion.header {...fadeUp} transition={{ delay: 0.05 }} className="space-y-2">
          <p className={fintechLabel}>Current balance</p>
          <p className={cn("text-4xl md:text-5xl", fintechDisplay)}>
            {formatMoney(data.totalBalance, preferences.currency)}
          </p>
        </motion.header>
      ) : null}

      {widgetOn("money_left") ? (
      <motion.section
        {...fadeUp}
        transition={{ delay: 0.1 }}
        className={cn(fintechHero, "relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10")}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-2xl"
          aria-hidden
        />
        <p className="text-sm font-medium text-white/70">Money left to spend</p>
        <p className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
          {formatMoney(data.moneyLeftToSpend, preferences.currency)}
        </p>
        <p className="mt-3 max-w-md text-sm text-white/60">
          {biweeklyIncomeMonthlyBills && data.cashFlowSafeToSpend != null
            ? `Cash-flow aware — accounts for bills due before your next paycheck.`
            : data.daysUntilNextPaycheck != null
              ? `Before your next paycheck in ${data.daysUntilNextPaycheck} days.`
              : "Based on your budgets and spending this month."}
          {data.cashFlowTimingWarning ? (
            <span className="mt-1 block text-amber-200/90">
              Heads up: balance may dip mid-month before income arrives — see Budget Alignment below.
            </span>
          ) : null}
          {underBudget > 0 && data.daysUntilNextPaycheck != null && !data.cashFlowTimingWarning
            ? ` You're about ${formatMoney(underBudget, preferences.currency)} under budget.`
            : null}
        </p>
      </motion.section>
      ) : null}

      {!needsSetup && biweeklyIncomeMonthlyBills ? (
        <motion.div {...fadeUp} transition={{ delay: 0.11 }}>
          <CashFlowAlignment compact />
        </motion.div>
      ) : null}

      {!needsSetup && widgetOn("monthly_summary") ? (
        <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
          <MonthlySummaryCard />
        </motion.div>
      ) : null}

      {widgetOn("income_expenses") ? (
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-4 md:gap-6"
      >
        <div className={cn(fintechCard, "p-4 sm:p-5")}>
          <p className={fintechLabel}>Income</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--positive)]">
            {formatMoney(data.incomeThisMonth, preferences.currency)}
          </p>
          <p className={cn("mt-1 text-xs", fintechMuted)}>This month</p>
        </div>
        <div className={cn(fintechCard, "p-4 sm:p-5")}>
          <p className={fintechLabel}>Expenses</p>
          <p className={cn("mt-2 text-2xl font-semibold", fintechForeground)}>
            {formatMoney(data.expensesThisMonth, preferences.currency)}
          </p>
          <p className={cn("mt-1 text-xs", fintechMuted)}>This month</p>
        </div>
      </motion.div>
      ) : null}

      {!needsSetup && data.categoryProgress.length > 0 && widgetOn("budget_progress") ? (
        <motion.div {...fadeUp} transition={{ delay: 0.18 }}>
          <DashboardBudgetProgress
            categories={data.categoryProgress}
            currency={preferences.currency}
            budgetPeriod={budgetPeriod}
          />
        </motion.div>
      ) : null}

      {(widgetOn("cashflow") || widgetOn("upcoming")) ? (
      <div className="grid gap-6 md:grid-cols-5 md:gap-8">
        {widgetOn("cashflow") ? (
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.2 }}
          className={cn(fintechCard, "p-6 md:col-span-3 md:p-8")}
        >
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Cash flow</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>Income vs expenses</p>
          <div className="mt-6 min-h-56 w-full min-w-0">
            {mounted ? (
              <DashboardCashflowMinimal data={data.cashflow} currency={preferences.currency} />
            ) : (
              <Skeleton className="h-56 w-full rounded-[var(--radius-inner)]" />
            )}
          </div>
        </motion.section>
        ) : null}

        {widgetOn("upcoming") ? (
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.25 }}
          className={cn(fintechCard, "p-6 md:col-span-2 md:p-7", !widgetOn("cashflow") && "md:col-span-5")}
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
        ) : null}
      </div>
      ) : null}

      {widgetOn("net_worth") && !needsSetup ? (
        <motion.div {...fadeUp} transition={{ delay: 0.28 }} className={cn(fintechCard, "p-5")}>
          <p className={fintechLabel}>Net worth</p>
          <p className={cn("mt-2 text-2xl font-semibold tabular-nums", fintechForeground)}>
            {formatMoney(netWorthPdf.netWorth, preferences.currency)}
          </p>
          {netWorthPdf.change != null ? (
            <p className={cn("mt-1 text-xs", fintechMuted)}>
              {netWorthPdf.change >= 0 ? "+" : ""}
              {formatMoney(netWorthPdf.change, preferences.currency)} vs last snapshot
            </p>
          ) : null}
          <Link href="/insights?tab=net-worth" className={cn("mt-3 inline-block text-xs font-medium", fintechLink)}>
            View details
          </Link>
        </motion.div>
      ) : null}

      {!needsSetup && widgetOn("ai_insights") ? (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <AiFinancialCoach
            summary={data}
            categories={categories}
            transactions={transactions}
            goals={goals}
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
