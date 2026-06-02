"use client";

import { format, subMonths, startOfMonth } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, HeartPulse, Minus } from "lucide-react";
import {
  computeFinancialHealth,
  computePriorMonthHealthScore,
  healthBandColor,
  healthBandLabel,
  type FinancialHealthResult,
} from "@/lib/health/compute-financial-health";
import { useFinancialHealthStore } from "@/store/useFinancialHealthStore";
import { useBudgetViewPeriod } from "@/hooks/use-budget-view-period";
import {
  ModalOverlay,
  fintechCard,
  fintechForeground,
  fintechMuted,
  ProgressBar,
} from "@/components/fintech/ui";
import { useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

export function FinancialHealthScore() {
  const { accounts, categories, transactions, goals, recurring } = useAppDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      categories: s.categories,
      transactions: s.demoTransactions,
      goals: s.goals,
      recurring: s.demoRecurring,
    }))
  );
  const budgetPeriod = useBudgetViewPeriod(recurring);
  const getPriorScore = useFinancialHealthStore((s) => s.getPriorScore);
  const [detailOpen, setDetailOpen] = useState(false);
  const lastRecorded = useRef<string | null>(null);

  const health = useMemo(
    () =>
      computeFinancialHealth({
        accounts,
        categories,
        transactions,
        goals,
        budgetPeriod,
      }),
    [accounts, categories, transactions, goals, budgetPeriod]
  );

  useEffect(() => {
    const key = `${health.monthKey}:${health.score}`;
    if (lastRecorded.current === key) return;
    lastRecorded.current = key;
    useFinancialHealthStore.getState().recordSnapshot(health.monthKey, health.score);
  }, [health.monthKey, health.score]);

  const priorMonthKey = format(subMonths(startOfMonth(new Date()), 1), "yyyy-MM");
  const priorStored = getPriorScore(priorMonthKey);
  const priorComputed = useMemo(
    () =>
      computePriorMonthHealthScore({
        accounts,
        categories,
        transactions,
        goals,
        budgetPeriod,
      }),
    [accounts, categories, transactions, goals, budgetPeriod]
  );
  const priorScore = priorStored ?? priorComputed;
  const delta = health.score - priorScore;

  const color = healthBandColor(health.band);
  const displayScore = Number.isFinite(health.score) ? health.score : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className={cn(
          fintechCard,
          "w-full p-5 text-left transition hover:border-[var(--accent)]/40 sm:p-6"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <HeartPulse className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className={cn("text-xs font-semibold uppercase tracking-wide", fintechMuted)}>
                Financial health
              </p>
              <p className={cn("mt-0.5 text-sm font-medium", fintechForeground)}>
                {healthBandLabel(health.band)}
              </p>
            </div>
          </div>
          <TrendBadge delta={delta} />
        </div>
        <div className="mt-5 flex items-end gap-4">
          <p className="text-5xl font-bold tabular-nums tracking-tight" style={{ color }}>
            {displayScore}
          </p>
          <p className={cn("pb-2 text-sm", fintechMuted)}>/ 100</p>
        </div>
        <ProgressBar pct={displayScore} className="mt-4" />
        <p className={cn("mt-3 flex items-center gap-1 text-xs", fintechMuted)}>
          Tap for breakdown
          <ChevronRight className="h-3.5 w-3.5" />
        </p>
      </button>

      <HealthDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        health={health}
        delta={delta}
      />
    </>
  );
}

function TrendBadge({ delta }: { delta: number }) {
  const Icon = delta > 1 ? ArrowUp : delta < -1 ? ArrowDown : Minus;
  const label =
    delta > 1 ? `+${Math.round(delta)}` : delta < -1 ? `${Math.round(delta)}` : "Flat";
  const tone =
    delta > 1 ? "text-[var(--positive)]" : delta < -1 ? "text-rose-500" : fintechMuted;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-semibold tabular-nums", tone)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span className="font-normal text-[var(--muted)]">vs last month</span>
    </span>
  );
}

function HealthDetailModal({
  open,
  onClose,
  health,
  delta,
}: {
  open: boolean;
  onClose: () => void;
  health: FinancialHealthResult;
  delta: number;
}) {
  const color = healthBandColor(health.band);

  return (
    <ModalOverlay open={open} onClose={onClose} title="Financial health score">
      <p className={cn("text-sm", fintechMuted)}>
        Your score blends budget discipline, savings, spending rhythm, sinking funds, and debt
        — tuned for bi-weekly paycheck planning.
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {health.score}
        </span>
        <span className={cn("text-sm", fintechMuted)}>/ 100 · {healthBandLabel(health.band)}</span>
        <span className={cn("ml-auto text-sm font-medium", delta >= 0 ? "text-[var(--positive)]" : "text-rose-500")}>
          {delta >= 0 ? "+" : ""}
          {Math.round(delta)} vs prior month
        </span>
      </div>
      <ul className="mt-6 space-y-4">
        {health.factors.map((factor) => (
          <li key={factor.id}>
            <div className="flex items-center justify-between gap-2">
              <p className={cn("text-sm font-medium", fintechForeground)}>{factor.label}</p>
              <p className="text-sm font-semibold tabular-nums">{factor.score}</p>
            </div>
            <ProgressBar pct={factor.score} className="mt-2" />
            <p className={cn("mt-1.5 text-xs", fintechMuted)}>{factor.detail}</p>
          </li>
        ))}
      </ul>
    </ModalOverlay>
  );
}
