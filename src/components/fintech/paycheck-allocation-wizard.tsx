"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Wallet, PiggyBank, PieChart, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import {
  GhostButton,
  ModalOverlay,
  PrimaryButton,
  ProgressBar,
  fintechForeground,
  fintechMuted,
} from "@/components/fintech/ui";
import {
  allocateRemainingToTargets,
  buildAllocationTargets,
  biWeeklyBillsEstimate,
  normalizeAllocations,
  splitAmountEvenly,
  splitByBudgetProportions,
  splitFromAverages,
  type AllocationTarget,
} from "@/lib/paycheck/build-allocation-suggestions";
import { logActivity } from "@/store/useActivityLogStore";
import { usePaycheckAllocationStore } from "@/store/usePaycheckAllocationStore";
import type { CurrencyCode } from "@/types/app-settings";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

type SplitMode = "averages" | "even" | "budget" | "manual";

type Props = {
  open: boolean;
  paycheckAmount: number;
  onClose: () => void;
};

export function PaycheckAllocationWizard({ open, paycheckAmount, onClose }: Props) {
  const { categories, goals, transactions, recurring, currency, contributeToGoal } = useAppDataStore(
    useShallow((s) => ({
      categories: s.categories,
      goals: s.goals,
      transactions: s.demoTransactions,
      recurring: s.demoRecurring,
      currency: s.preferences.currency,
      contributeToGoal: s.contributeToGoal,
    }))
  );
  const savePlan = usePaycheckAllocationStore((s) => s.savePlan);

  const targets = useMemo(
    () => buildAllocationTargets({ categories, goals, transactions, recurring }),
    [categories, goals, transactions, recurring]
  );

  const billsReserve = useMemo(() => biWeeklyBillsEstimate(recurring), [recurring]);
  const allocatable = Math.max(0, paycheckAmount - billsReserve);

  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<SplitMode>("averages");

  useEffect(() => {
    if (!open || targets.length === 0) return;
    setMode("averages");
    setAmounts(splitFromAverages(targets, allocatable));
  }, [open, paycheckAmount, targets, allocatable]);

  const allocated = Object.values(amounts).reduce((s, v) => s + (v || 0), 0);
  const remaining = Math.round((allocatable - allocated) * 100) / 100;
  const pct = allocatable > 0 ? Math.min(100, (allocated / allocatable) * 100) : 0;

  const applySplit = (split: SplitMode) => {
    setMode(split);
    let next: Record<string, number>;
    if (split === "even") next = splitAmountEvenly(targets, allocatable);
    else if (split === "budget") next = splitByBudgetProportions(targets, allocatable);
    else if (split === "averages") next = splitFromAverages(targets, allocatable);
    else return;
    setAmounts(normalizeAllocations(next, allocatable));
  };

  const fillRemaining = () => {
    if (remaining <= 0) return;
    setAmounts((prev) =>
      normalizeAllocations(allocateRemainingToTargets(prev, targets, remaining), allocatable)
    );
    setMode("manual");
  };

  const setLineAmount = (id: string, value: number) => {
    setMode("manual");
    setAmounts((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  };

  const apply = () => {
    const lines = targets
      .map((t) => ({
        target: t,
        amount: amounts[t.id] ?? 0,
      }))
      .filter((row) => row.amount > 0);

    for (const { target, amount } of lines) {
      if (target.type === "goal") {
        contributeToGoal(target.id, amount);
      }
    }

    savePlan({
      paycheckAmount,
      lines: lines.map(({ target, amount }) => ({
        targetId: target.id,
        targetType: target.type,
        label: target.label,
        amount,
      })),
    });

    const goalTotal = lines.filter((l) => l.target.type === "goal").reduce((s, l) => s + l.amount, 0);
    const categoryCount = lines.filter((l) => l.target.type === "category").length;

    logActivity(
      "created",
      "import",
      "Paycheck allocation",
      `${formatMoney(allocatable, currency)} across ${lines.length} envelopes`
    );

    toast.success("Paycheck allocated", {
      description:
        goalTotal > 0
          ? `${formatMoney(goalTotal, currency)} added to sinking funds${categoryCount ? ` · ${categoryCount} budget lines planned` : ""}.`
          : `${lines.length} budget lines planned for this pay period.`,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <ModalOverlay open={open} onClose={onClose} title="Allocate this paycheck">
      <div className="space-y-5">
        <div className="rounded-[var(--radius-inner)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
          <p className={cn("text-xs font-semibold uppercase tracking-wide text-[var(--accent)]")}>
            Paycheck received
          </p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", fintechForeground)}>
            {formatMoney(paycheckAmount, currency)}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <StatPill label="Total" value={formatMoney(paycheckAmount, currency)} />
            <StatPill
              label="Assigned"
              value={formatMoney(allocated, currency)}
              accent
            />
            <StatPill
              label="Remaining"
              value={formatMoney(Math.max(0, remaining), currency)}
              warn={remaining < -0.01}
            />
          </div>
          {billsReserve > 0 ? (
            <p className={cn("mt-3 text-xs", fintechMuted)}>
              ~{formatMoney(billsReserve, currency)} held for upcoming bills ·{" "}
              {formatMoney(allocatable, currency)} to assign
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <AllocationRing pct={pct} />
          <div className="w-full flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={cn("text-sm font-medium", fintechForeground)}>
                {remaining >= 0 ? (
                  <>
                    <span className="text-[var(--accent)]">{formatMoney(remaining, currency)}</span>{" "}
                    left to assign
                  </>
                ) : (
                  <span className="text-rose-400">
                    Over by {formatMoney(Math.abs(remaining), currency)}
                  </span>
                )}
              </p>
              {remaining > 0.01 ? (
                <GhostButton type="button" className="!text-xs" onClick={fillRemaining}>
                  <ArrowDownToLine className="mr-1 inline h-3.5 w-3.5" />
                  Allocate remaining
                </GhostButton>
              ) : null}
            </div>
            <ProgressBar pct={pct} className="mt-2" />
            <p className={cn("mt-1 text-xs tabular-nums", fintechMuted)}>
              {pct.toFixed(0)}% of this paycheck assigned
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <SplitChip
            active={mode === "averages"}
            onClick={() => applySplit("averages")}
            icon={Sparkles}
            label="From averages"
          />
          <SplitChip
            active={mode === "budget"}
            onClick={() => applySplit("budget")}
            icon={PieChart}
            label="Budget proportions"
          />
          <SplitChip
            active={mode === "even"}
            onClick={() => applySplit("even")}
            icon={Wallet}
            label="Evenly"
          />
        </div>

        {targets.length === 0 ? (
          <p className={cn("text-sm", fintechMuted)}>
            Add budget categories or sinking funds to get allocation suggestions.
          </p>
        ) : (
          <ul className="max-h-[min(42dvh,22rem)] space-y-3 overflow-y-auto overscroll-contain pr-1">
            {targets.map((target) => (
              <AllocationRow
                key={target.id}
                target={target}
                amount={amounts[target.id] ?? 0}
                max={allocatable}
                currency={currency}
                onChange={(v) => setLineAmount(target.id, v)}
              />
            ))}
          </ul>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:justify-end">
          <GhostButton type="button" onClick={onClose}>
            Skip for now
          </GhostButton>
          <PrimaryButton
            type="button"
            onClick={apply}
            disabled={targets.length === 0 || remaining < -0.01}
          >
            Confirm allocation
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

function StatPill({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface)]/80 px-2 py-1.5">
      <p className={cn("text-[10px] uppercase tracking-wide", fintechMuted)}>{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xs font-semibold tabular-nums sm:text-sm",
          warn ? "text-rose-400" : accent ? "text-[var(--accent)]" : fintechForeground
        )}
      >
        {value}
      </p>
    </div>
  );
}

function AllocationRing({ pct }: { pct: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0" aria-hidden>
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums",
          fintechForeground
        )}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function SplitChip({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
          : "border-[var(--border-subtle)] text-[var(--muted)] hover:border-[var(--border)]"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function AllocationRow({
  target,
  amount,
  max,
  currency,
  onChange,
}: {
  target: AllocationTarget;
  amount: number;
  max: number;
  currency: CurrencyCode;
  onChange: (value: number) => void;
}) {
  const Icon = target.type === "goal" ? PiggyBank : Wallet;
  const linePct = max > 0 ? Math.min(100, (amount / max) * 100) : 0;
  const sugPct =
    target.suggestedAmount > 0 && max > 0
      ? Math.min(100, (target.suggestedAmount / max) * 100)
      : 0;

  return (
    <li className="rounded-[var(--radius-inner)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3">
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${target.color}22`, color: target.color }}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn("text-sm font-medium", fintechForeground)}>{target.label}</p>
              <p className={cn("text-xs", fintechMuted)}>{target.subtitle}</p>
            </div>
            <span className={cn("text-sm font-semibold tabular-nums", fintechForeground)}>
              {formatMoney(amount, currency)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={amount}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--border-subtle)] accent-[var(--accent)]"
            aria-label={`Slider for ${target.label}`}
          />
          <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
            <div
              className="absolute h-full rounded-full bg-[var(--accent)]/40 transition-all"
              style={{ width: `${linePct}%` }}
            />
            {sugPct > 0 ? (
              <div
                className="absolute top-0 h-full w-0.5 bg-[var(--accent)]"
                style={{ left: `${sugPct}%` }}
                title={`Suggested ${formatMoney(target.suggestedAmount, currency)}`}
              />
            ) : null}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <NumberField
              value={amount}
              onChange={onChange}
              className="w-full max-w-[7rem] px-2 py-1 text-sm"
              aria-label={`Amount for ${target.label}`}
            />
            <span className={cn("text-xs tabular-nums", fintechMuted)}>
              sug. {formatMoney(target.suggestedAmount, currency)}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export function PaycheckAllocationHost() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const onAllocate = (e: Event) => {
      const detail = (e as CustomEvent<{ amount: number }>).detail;
      if (!detail?.amount || detail.amount <= 0) return;
      setAmount(detail.amount);
      setOpen(true);
    };
    window.addEventListener("planner:paycheck-allocate", onAllocate);
    return () => window.removeEventListener("planner:paycheck-allocate", onAllocate);
  }, []);

  return (
    <PaycheckAllocationWizard
      open={open}
      paycheckAmount={amount}
      onClose={() => setOpen(false)}
    />
  );
}
