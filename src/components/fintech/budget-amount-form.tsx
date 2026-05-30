"use client";

import { useCallback } from "react";
import { Info } from "lucide-react";
import { NumberField } from "@/components/fintech/number-field";
import { FieldLabel, fintechMuted } from "@/components/fintech/ui";
import {
  autoCalcHint,
  BUDGET_CONVERSION_TOOLTIP,
  BUDGET_PERIODS,
  conversionDetail,
  budgetAmountsFromMonthly,
  crossCalculateBudgetAmounts,
  periodBudgetLabel,
  type BudgetAmounts,
  type BudgetPeriod,
} from "@/lib/budget/period";
import { cn } from "@/lib/utils";

export type BudgetAmountFormState = {
  amounts: BudgetAmounts;
  source: BudgetPeriod;
};

export function createBudgetAmountFormState(
  initial?: Partial<{ monthly: number; source?: BudgetPeriod }>
): BudgetAmountFormState {
  const monthly = initial?.monthly ?? 0;
  const source = initial?.source ?? "bi-weekly";
  const amounts = budgetAmountsFromMonthly(monthly);
  return { amounts, source };
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="rounded-full p-0.5 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        aria-label="How conversions work"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--modal-solid)] p-3 text-[11px] leading-relaxed text-[var(--foreground)] shadow-[var(--shadow-modal)] group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

export function BudgetAmountForm({
  state,
  onChange,
}: {
  state: BudgetAmountFormState;
  onChange: (next: BudgetAmountFormState) => void;
}) {
  const { amounts, source } = state;

  const handleChange = useCallback(
    (period: BudgetPeriod, value: number) => {
      const calculated = crossCalculateBudgetAmounts(period, value);
      calculated[period] = value;
      onChange({ amounts: calculated, source: period });
    },
    [onChange]
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2.5">
        <p className={cn("flex-1 text-xs leading-relaxed", fintechMuted)}>
          We&apos;ll automatically adjust the other periods for you.
        </p>
        <InfoTooltip text={BUDGET_CONVERSION_TOOLTIP} />
      </div>

      {BUDGET_PERIODS.map((period) => {
        const isSource = period === source;
        const autoLabel = autoCalcHint(period, source);
        const isBiweekly = period === "bi-weekly";
        const detail = conversionDetail(source, period);

        return (
          <label key={period} className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <FieldLabel>
                <span className={cn(isBiweekly && "font-semibold text-[var(--accent-deep)]")}>
                  {periodBudgetLabel(period)}
                </span>
              </FieldLabel>
              {isBiweekly ? (
                <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-deep)]">
                  Best for bi-weekly paychecks
                </span>
              ) : null}
              {!isSource && autoLabel ? (
                <span className={cn("text-[10px] font-medium", fintechMuted)}>{autoLabel}</span>
              ) : null}
              {!isSource && detail ? (
                <span className={cn("text-[10px] tabular-nums", fintechMuted)}>{detail}</span>
              ) : null}
            </div>
            <NumberField
              value={amounts[period]}
              onChange={(v) => handleChange(period, v)}
              aria-label={periodBudgetLabel(period)}
              className={cn(!isSource && "opacity-90")}
            />
          </label>
        );
      })}
    </div>
  );
}
