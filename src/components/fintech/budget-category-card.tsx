"use client";

import { Pencil, Trash2 } from "lucide-react";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { ProgressBar, fintechForeground, fintechGlass, fintechMuted } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/store/useAppDataStore";
import type { CurrencyCode } from "@/types/app-settings";

export type BudgetCardRow = {
  id: string;
  name: string;
  icon: string;
  spent: number;
  budgeted: number;
  remaining: number;
  pct: number;
  over: boolean;
  monthlyBudgeted: number;
  color: string;
};

type BudgetCategoryCardProps = {
  row: BudgetCardRow;
  currency: CurrencyCode;
  onEdit: () => void;
  onDelete: () => void;
};

function statusLabel(row: BudgetCardRow) {
  if (row.over) return "Over";
  if (row.pct >= 85) return "Close";
  return "On track";
}

export function BudgetCategoryCard({ row, currency, onEdit, onDelete }: BudgetCategoryCardProps) {
  const status = statusLabel(row);

  return (
    <article
      className={cn(
        fintechGlass,
        "group relative px-4 py-4 transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] sm:px-5 sm:py-5"
      )}
    >
      <div className="flex items-start gap-3">
        <CategoryIconBadge name={row.icon} color={row.color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn("truncate text-base font-semibold leading-snug", fintechForeground)}>
                {row.name}
              </p>
              <p
                className={cn(
                  "mt-1 text-sm font-semibold tabular-nums",
                  row.over ? "text-[var(--negative)]" : "text-[var(--positive)]"
                )}
              >
                {row.over
                  ? `Over by ${formatMoney(Math.abs(row.remaining), currency)}`
                  : `${formatMoney(row.remaining, currency)} left`}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                row.over
                  ? "bg-rose-500/15 text-rose-400"
                  : row.pct >= 85
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {status}
            </span>
          </div>

          <ProgressBar pct={row.pct} over={row.over} className="mt-3" />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn("text-sm tabular-nums", fintechMuted)}>
              <span className="font-medium text-[var(--foreground)]">{formatMoney(row.spent, currency)}</span>
              {" spent · "}
              {formatMoney(row.budgeted, currency)} budgeted
            </p>
            <div className="flex shrink-0 gap-1 self-end sm:self-auto">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                aria-label={`Edit ${row.name}`}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10"
                aria-label={`Delete ${row.name}`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
