"use client";

import { format, parseISO } from "date-fns";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import {
  fintechForeground,
  fintechLabel,
  fintechMuted,
  fintechSurface,
  ShellCard,
} from "@/components/fintech/ui";
import { computeCashFlowSummary } from "@/lib/cashflow/compute-cash-flow";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { useDeviceUiStore } from "@/store/useDeviceUiStore";

type CashFlowAlignmentProps = {
  className?: string;
  /** Compact mode for dashboard widgets */
  compact?: boolean;
};

export function CashFlowAlignment({ className, compact = false }: CashFlowAlignmentProps) {
  const accounts = useAppDataStore((s) => s.accounts);
  const recurring = useAppDataStore((s) => s.demoRecurring);
  const preferences = useAppDataStore((s) => s.preferences);
  const alignmentEnabled = useDeviceUiStore((s) => s.biweeklyIncomeMonthlyBills ?? true);

  const summary = useMemo(() => {
    if (!alignmentEnabled) return null;
    const startingBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    return computeCashFlowSummary({
      startingBalance,
      recurring: recurring.filter((r) => !r.paused),
      horizonDays: compact ? 30 : 45,
    });
  }, [accounts, recurring, alignmentEnabled, compact]);

  if (!alignmentEnabled || !summary) return null;

  const chartDays = summary.days.slice(0, compact ? 21 : 31);
  const minBal = Math.min(...chartDays.map((d) => d.balance), 0);
  const maxBal = Math.max(...chartDays.map((d) => d.balance), 1);
  const range = maxBal - minBal || 1;

  return (
    <ShellCard className={cn("p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={fintechLabel}>Budget alignment</p>
          <p className={cn("mt-1 text-sm", fintechMuted)}>
            Cash flow through the month — bi-weekly pay vs monthly bills
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-xs", fintechMuted)}>Safe to spend</p>
          <p className={cn("text-lg font-semibold tabular-nums text-[var(--positive)]")}>
            {formatMoney(summary.safeToSpend, preferences.currency)}
          </p>
        </div>
      </div>

      {summary.timingWarning ? (
        <div
          className="mt-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-800 dark:text-amber-200"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Timing pinch ahead</p>
            <p className="mt-0.5 text-xs opacity-90">
              Balance may dip to{" "}
              <span className="font-semibold tabular-nums">
                {formatMoney(summary.lowestBalance, preferences.currency)}
              </span>{" "}
              on {format(parseISO(summary.lowestBalanceDate), "MMM d")} before your next paycheck
              {summary.nextIncomeDate
                ? ` (${format(parseISO(summary.nextIncomeDate), "MMM d")})`
                : ""}
              . Your overall month may still balance — this is about when money moves.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <div className="flex items-end gap-0.5 sm:gap-1" style={{ height: compact ? 56 : 72 }}>
          {chartDays.map((day) => {
            const pct = ((day.balance - minBal) / range) * 100;
            const negative = day.balance < 0;
            const hasEvent = day.events.length > 0;
            return (
              <div
                key={day.date}
                className="group relative flex-1 min-w-0"
                title={`${format(parseISO(day.date), "MMM d")}: ${formatMoney(day.balance, preferences.currency)}`}
              >
                <div
                  className={cn(
                    "mx-auto w-full max-w-[8px] rounded-t transition-colors",
                    negative ? "bg-rose-500/70" : hasEvent ? "bg-[var(--accent)]" : "bg-[var(--accent)]/35"
                  )}
                  style={{ height: `${Math.max(8, pct)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[var(--muted)]">
          <span>Today</span>
          <span className="inline-flex items-center gap-1">
            <TrendingDown className="h-3 w-3" aria-hidden />
            Lowest: {formatMoney(summary.lowestBalance, preferences.currency)}
          </span>
          <span>{format(parseISO(chartDays.at(-1)!.date), "MMM d")}</span>
        </div>
      </div>

      {summary.nextIncomeDate ? (
        <p className={cn("mt-3 text-xs", fintechMuted)}>
          Next income{" "}
          <span className={cn("font-medium tabular-nums", fintechForeground)}>
            {formatMoney(summary.nextIncomeAmount, preferences.currency)}
          </span>{" "}
          on {format(parseISO(summary.nextIncomeDate), "MMM d, yyyy")}
        </p>
      ) : null}
    </ShellCard>
  );
}
