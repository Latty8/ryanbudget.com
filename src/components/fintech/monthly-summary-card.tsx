"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  fintechForeground,
  fintechInnerCard,
  fintechLabel,
  fintechMuted,
  fintechCard,
} from "@/components/fintech/ui";
import { computeMonthlySummary } from "@/lib/reports/monthly-summary";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { useShallow } from "zustand/react/shallow";

type Props = {
  className?: string;
  compact?: boolean;
};

export function MonthlySummaryCard({ className, compact }: Props) {
  const { accounts, categories, transactions, currency } = useAppDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      categories: s.categories,
      transactions: s.demoTransactions,
      currency: s.preferences.currency,
    }))
  );

  const summary = useMemo(
    () =>
      computeMonthlySummary({
        accounts,
        categories,
        transactions,
        primaryCurrency: currency,
      }),
    [accounts, categories, transactions, currency]
  );

  const metrics = [
    { label: "Income", value: summary.income, icon: TrendingUp, positive: true },
    { label: "Expenses", value: summary.expenses, icon: TrendingDown, positive: false },
    { label: "Net", value: summary.net, icon: Wallet, positive: summary.net >= 0 },
  ];

  return (
    <section className={cn(fintechCard, "p-6 md:p-8", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Monthly summary</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>This calendar month</p>
        </div>
        <p className={cn("text-sm font-semibold tabular-nums", fintechForeground)}>
          Savings rate{" "}
          <span className={summary.savingsRate >= 0 ? "text-[var(--positive)]" : "text-rose-500"}>
            {summary.savingsRate}%
          </span>
        </p>
      </div>

      <div className={cn("mt-5 grid gap-3", compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3")}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={cn(fintechInnerCard, "px-4 py-3")}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.75} />
                <p className={fintechLabel}>{m.label}</p>
              </div>
              <p
                className={cn(
                  "mt-2 text-xl font-semibold tabular-nums tracking-tight",
                  m.positive && m.label !== "Expenses" ? "text-[var(--positive)]" : fintechForeground
                )}
              >
                {formatMoney(m.value, currency)}
              </p>
            </div>
          );
        })}
      </div>

      {summary.topCategories.length > 0 ? (
        <div className="mt-6">
          <p className={fintechLabel}>Top spending</p>
          <ul className="mt-3 space-y-2.5">
            {summary.topCategories.map((cat) => {
              const max = summary.topCategories[0]?.value ?? 1;
              const pct = max > 0 ? Math.round((cat.value / max) * 100) : 0;
              return (
                <li key={cat.name}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className={cn("truncate font-medium", fintechForeground)}>{cat.name}</span>
                    <span className={cn("shrink-0 tabular-nums", fintechMuted)}>
                      {formatMoney(cat.value, currency)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className={cn("mt-6 text-sm", fintechMuted)}>No spending recorded this month yet.</p>
      )}
    </section>
  );
}
