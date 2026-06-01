"use client";

import { useMemo, useState } from "react";
import { PiggyBank, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { ReviewAiInsights } from "@/components/fintech/review-ai-insights";
import {
  PageFrame,
  ProgressBar,
  SegmentToggle,
  ShellCard,
  ShellSelect,
  fintechForeground,
  fintechMuted,
} from "@/components/fintech/ui";
import {
  computeReview,
  defaultReviewSelection,
  formatReviewMonthKey,
  reviewMonthOptions,
  reviewYearOptions,
  type ReviewPeriod,
  type ReviewSelection,
} from "@/lib/reviews/compute-review";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

function ChangeBadge({ pct, invert }: { pct: number | null; invert?: boolean }) {
  if (pct == null || Number.isNaN(pct)) return <span className={cn("text-xs", fintechMuted)}>—</span>;
  const good = invert ? pct < 0 : pct > 0;
  const Icon = pct >= 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        good ? "text-[var(--positive)]" : "text-rose-400"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {pct > 0 ? "+" : ""}
      {pct.toFixed(0)}% vs prior
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: "positive" | "neutral";
}) {
  return (
    <ShellCard className="p-4">
      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", fintechMuted)}>{label}</p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold tabular-nums sm:text-2xl",
          accent === "positive" ? "text-[var(--positive)]" : fintechForeground
        )}
      >
        {value}
      </p>
      {sub ? <div className="mt-1.5">{sub}</div> : null}
    </ShellCard>
  );
}

export function ReviewsView() {
  const { transactions, goals, accounts, categories, recurring, currency } = useAppDataStore(
    useShallow((s) => ({
      transactions: s.demoTransactions,
      goals: s.goals,
      accounts: s.accounts,
      categories: s.categories,
      recurring: s.demoRecurring,
      currency: s.preferences.currency,
    }))
  );

  const [selection, setSelection] = useState<ReviewSelection>(defaultReviewSelection);

  const review = useMemo(
    () => computeReview(transactions, selection, goals),
    [transactions, selection, goals]
  );

  const period: ReviewPeriod = selection.period;
  const monthOptions = reviewMonthOptions();
  const yearOptions = reviewYearOptions();

  return (
    <PageFrame
      title="Reviews"
      description="Monthly and yearly snapshots — compare to last period, spot trends, and get AI-powered takeaways."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SegmentToggle
          value={period}
          onChange={(next) =>
            setSelection(
              next === "year"
                ? { period: "year", key: String(new Date().getFullYear()) }
                : defaultReviewSelection()
            )
          }
          options={[
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly" },
          ]}
        />
        <ShellSelect
          className="w-full sm:max-w-xs"
          value={selection.key}
          onChange={(e) => setSelection({ period, key: e.target.value })}
          aria-label={period === "month" ? "Select month" : "Select year"}
        >
          {period === "month"
            ? monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatReviewMonthKey(key)}
                </option>
              ))
            : yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
        </ShellSelect>
      </div>

      <ShellCard className="mt-6 border-[var(--accent)]/15 bg-gradient-to-br from-[var(--accent)]/5 to-transparent p-5 sm:p-6">
        <p className={cn("text-sm font-medium text-[var(--accent)]")}>
          {period === "month" ? "Month in review" : "Year in review"}
        </p>
        <p className={cn("mt-1 text-2xl font-semibold tracking-tight sm:text-3xl", fintechForeground)}>
          {review.label}
        </p>
        <p className={cn("mt-2 text-sm", fintechMuted)}>
          {review.transactionCount} transactions · Net {formatMoney(review.net, currency)}
        </p>
      </ShellCard>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Income"
          value={formatMoney(review.income, currency)}
          sub={<ChangeBadge pct={review.incomeChangePct} />}
        />
        <StatCard
          label="Expenses"
          value={formatMoney(review.expenses, currency)}
          sub={<ChangeBadge pct={review.expenseChangePct} invert />}
        />
        <StatCard
          label="Net"
          value={formatMoney(review.net, currency)}
          accent={review.net >= 0 ? "positive" : "neutral"}
          sub={
            <span className={cn("text-xs", fintechMuted)}>
              Prior {formatMoney(review.prevNet, currency)}
            </span>
          }
        />
        <StatCard
          label="Savings rate"
          value={`${review.savingsRate.toFixed(0)}%`}
          sub={
            <span className={cn("text-xs", fintechMuted)}>Of income kept after expenses</span>
          }
        />
      </div>

      {selection.period === "year" && (review.bestMonth || review.worstMonth) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {review.bestMonth ? (
            <ShellCard className="flex items-start gap-3 border-[var(--positive)]/25 p-4">
              <Trophy className="h-5 w-5 shrink-0 text-[var(--positive)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--positive)]">
                  Best month
                </p>
                <p className={cn("mt-1 font-semibold", fintechForeground)}>{review.bestMonth.label}</p>
                <p className={cn("text-sm tabular-nums", fintechMuted)}>
                  Net {formatMoney(review.bestMonth.net, currency)}
                </p>
              </div>
            </ShellCard>
          ) : null}
          {review.worstMonth ? (
            <ShellCard className="flex items-start gap-3 border-rose-500/20 p-4">
              <TrendingDown className="h-5 w-5 shrink-0 text-rose-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">
                  Tightest month
                </p>
                <p className={cn("mt-1 font-semibold", fintechForeground)}>{review.worstMonth.label}</p>
                <p className={cn("text-sm tabular-nums", fintechMuted)}>
                  Net {formatMoney(review.worstMonth.net, currency)}
                </p>
              </div>
            </ShellCard>
          ) : null}
        </div>
      ) : null}

      {review.goalHighlights.length > 0 ? (
        <ShellCard className="mt-4 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-[var(--accent)]" />
            <p className={cn("text-sm font-semibold", fintechForeground)}>Sinking fund progress</p>
          </div>
          <ul className="mt-4 space-y-4">
            {review.goalHighlights.map((g) => (
              <li key={g.id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className={fintechForeground}>{g.name}</span>
                  <span className={cn("tabular-nums", fintechMuted)}>
                    {formatMoney(g.current, currency)} / {formatMoney(g.target, currency)}
                  </span>
                </div>
                <ProgressBar pct={g.pct} className="mt-2" />
                <p className={cn("mt-1 text-xs", fintechMuted)}>{g.pct.toFixed(0)}% funded</p>
              </li>
            ))}
          </ul>
        </ShellCard>
      ) : null}

      <ShellCard className="mt-4 p-4 sm:p-5">
        <p className={cn("text-sm font-semibold", fintechForeground)}>Top spending categories</p>
        {review.topCategories.length === 0 ? (
          <p className={cn("mt-3 text-sm", fintechMuted)}>No spending recorded this period.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {review.topCategories.map((cat) => (
              <li key={cat.name}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className={fintechForeground}>{cat.name}</span>
                  <span className={cn("tabular-nums", fintechMuted)}>
                    {formatMoney(cat.spent, currency)} · {cat.pct.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar pct={cat.pct} className="mt-2" />
              </li>
            ))}
          </ul>
        )}
      </ShellCard>

      <div className="mt-4">
        <ReviewAiInsights
          selection={selection}
          accounts={accounts}
          categories={categories}
          transactions={transactions}
          recurring={recurring}
          baselineInsights={review.insights}
        />
      </div>
    </PageFrame>
  );
}
