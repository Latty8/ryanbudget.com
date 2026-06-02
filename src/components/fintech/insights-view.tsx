"use client";

import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SpendingHeatmapTeaser } from "@/components/fintech/spending-heatmap";
import { ReportsChartFrame } from "@/components/fintech/reports-chart-frame";
import {
  reportChartAxis,
  reportChartGrid,
  reportTooltipStyle,
  formatReportTooltipValue,
} from "@/components/fintech/reports-chart-config";
import {
  PageFrame,
  ShellCard,
  fintechForeground,
  fintechMuted,
  fintechSurface,
  MotionSection,
} from "@/components/fintech/ui";
import { useBudgetViewPeriod } from "@/hooks/use-budget-view-period";
import {
  analyticsInsightLines,
  computeSpendingAnalytics,
} from "@/lib/insights/compute-spending-analytics";
import { generateInsights } from "@/lib/insights/generate-insights";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

export function InsightsView({ embedded = false }: { embedded?: boolean }) {
  const { categories, transactions, recurring, preferences, accounts } = useAppDataStore(
    useShallow((s) => ({
      categories: s.categories,
      transactions: s.demoTransactions,
      recurring: s.demoRecurring,
      preferences: s.preferences,
      accounts: s.accounts,
    }))
  );
  const budgetPeriod = useBudgetViewPeriod(recurring);
  const currency = preferences.currency;
  const [range, setRange] = useState<6 | 12>(12);

  const tooltipProps = {
    ...reportTooltipStyle,
    formatter: (value: unknown, name: unknown) =>
      formatReportTooltipValue(value, name, currency),
  };

  const analytics = useMemo(
    () => computeSpendingAnalytics(transactions, { months: range, budgetPeriod }),
    [transactions, range, budgetPeriod]
  );

  const aiLines = useMemo(() => analyticsInsightLines(analytics), [analytics]);

  const ruleInsights = useMemo(() => {
    const summary = computeDashboardSummary({
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
          cadence: r.cadence,
          nextDate: r.nextDate,
        })),
    });
    const dining = transactions.filter(
      (t) => t.category === "Dining" && t.amount < 0 && t.date.startsWith(new Date().toISOString().slice(0, 7))
    );
    const diningLast = transactions.filter(
      (t) =>
        t.category === "Dining" &&
        t.amount < 0 &&
        t.date.startsWith(
          new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)
        )
    );
    return generateInsights({
      moneyLeftToSpend: summary.moneyLeftToSpend,
      expensesThisMonth: summary.expensesThisMonth,
      incomeThisMonth: summary.incomeThisMonth,
      diningSpent: Math.abs(dining.reduce((s, t) => s + t.amount, 0)),
      diningLastMonth: Math.abs(diningLast.reduce((s, t) => s + t.amount, 0)),
      upcomingPaychecks: summary.upcomingPaychecks,
      upcomingBills: summary.upcomingBills,
    });
  }, [accounts, categories, transactions, budgetPeriod, recurring]);

  const body = (
    <>
      <MotionSection className="flex flex-wrap gap-2">
        {([6, 12] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setRange(m)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              range === m
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border-subtle)] text-[var(--muted)]"
            )}
          >
            {m} months
          </button>
        ))}
      </MotionSection>

      <MotionSection delay={0.05} className="mt-6 grid gap-4 sm:grid-cols-2">
        <CompareCard
          title="This month vs last"
          current={analytics.periodComparison.currentExpenses}
          previous={analytics.periodComparison.previousExpenses}
          changePct={analytics.periodComparison.changePct}
          currency={currency}
        />
        <CompareCard
          title="Year to date vs last year"
          current={analytics.yearComparison.ytdExpenses}
          previous={analytics.yearComparison.priorYtdExpenses}
          changePct={analytics.yearComparison.changePct}
          currency={currency}
        />
      </MotionSection>

      <MotionSection delay={0.07} className="mt-6">
        <SpendingHeatmapTeaser />
      </MotionSection>

      <MotionSection delay={0.08} className="mt-6">
        <ShellCard className="p-4 sm:p-5">
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Spending trend</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>Monthly expenses & income</p>
          <ReportsChartFrame className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={reportChartGrid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: reportChartAxis }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: reportChartAxis }} width={48} tickFormatter={(v) => `$${v}`} />
                <Tooltip {...tooltipProps} />
                <Line type="monotone" dataKey="expenses" stroke="#e11d48" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ReportsChartFrame>
        </ShellCard>
      </MotionSection>

      <MotionSection delay={0.1} className="mt-6 grid gap-4 lg:grid-cols-2">
        <ShellCard className="p-4 sm:p-5">
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Bi-weekly rhythm</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>This month by pay-period half</p>
          <ReportsChartFrame className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.biWeeklyPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke={reportChartGrid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: reportChartAxis }} hide />
                <YAxis tick={{ fill: reportChartAxis }} width={48} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="expenses" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportsChartFrame>
        </ShellCard>

        <ShellCard className="p-4 sm:p-5">
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Biggest movers</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>Vs prior month</p>
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {analytics.categoryDeltas.slice(0, 8).map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className={fintechForeground}>{row.name}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 tabular-nums text-xs font-medium",
                    row.change >= 0 ? "text-rose-500" : "text-[var(--positive)]"
                  )}
                >
                  {row.change >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {row.change >= 0 ? "+" : ""}
                  {formatMoney(row.change, currency)}
                </span>
              </li>
            ))}
          </ul>
        </ShellCard>
      </MotionSection>

      <MotionSection delay={0.12} className="mt-6">
        <div className={cn(fintechSurface, "p-4 sm:p-5")}>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
            Observations
          </p>
          <ul className="mt-3 space-y-2">
            {[...aiLines, ...ruleInsights.map((i) => i.body)].slice(0, 6).map((line) => (
              <li key={line} className={cn("text-sm leading-relaxed", fintechMuted)}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </MotionSection>
    </>
  );

  if (embedded) return body;

  return (
    <PageFrame
      title="Insights"
      description="Trends, comparisons, and observations across your spending."
    >
      {body}
    </PageFrame>
  );
}

function CompareCard({
  title,
  current,
  previous,
  changePct,
  currency,
}: {
  title: string;
  current: number;
  previous: number;
  changePct: number;
  currency: Parameters<typeof formatMoney>[1];
}) {
  const up = changePct > 0;
  return (
    <ShellCard className="p-4 sm:p-5">
      <p className={cn("text-xs font-medium uppercase tracking-wide", fintechMuted)}>{title}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", fintechForeground)}>
        {formatMoney(current, currency)}
      </p>
      <p className={cn("mt-1 text-xs", fintechMuted)}>
        vs {formatMoney(previous, currency)} prior ·{" "}
        <span className={up ? "text-rose-500" : "text-[var(--positive)]"}>
          {up ? "+" : ""}
          {Math.round(changePct)}%
        </span>
      </p>
    </ShellCard>
  );
}
