"use client";

import { Pencil, Trash2 } from "lucide-react";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { ElevatedCard } from "@/components/fintech/elevated-card";
import { ProgressBar, fintechForeground, fintechMuted } from "@/components/fintech/ui";
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
    <ElevatedCard accentColor={row.color} className="h-full min-h-[132px]">
      <div className="flex h-full flex-col px-4 py-4 sm:px-5 sm:py-4">
        <div className="flex items-start gap-3">
          <CategoryIconBadge name={row.icon} color={row.color} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={cn("truncate text-[15px] font-semibold leading-snug", fintechForeground)}>
                  {row.name}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium tabular-nums",
                    row.over ? "text-[var(--negative)]" : "text-[var(--muted)]"
                  )}
                >
                  {row.over
                    ? `${formatMoney(Math.abs(row.remaining), currency)} over`
                    : `${formatMoney(row.remaining, currency)} left`}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium",
                  row.over
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : row.pct >= 85
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}
              >
                {status}
              </span>
            </div>

            <ProgressBar pct={row.pct} over={row.over} size="slim" accentColor={row.color} className="mt-3" />

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className={cn("text-xs tabular-nums", fintechMuted)}>
                <span className="font-medium text-[var(--foreground)]">
                  {formatMoney(row.spent, currency)}
                </span>
                {" / "}
                {formatMoney(row.budgeted, currency)}
              </p>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
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
                  className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-500/10"
                  aria-label={`Delete ${row.name}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ElevatedCard>
  );
}
