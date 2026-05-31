"use client";

import { Pencil, Trash2 } from "lucide-react";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { ElevatedCard } from "@/components/fintech/elevated-card";
import {
  ProgressBar,
  fintechCardBody,
  fintechDeleteIconButton,
  fintechForeground,
  fintechIconButton,
  fintechMuted,
} from "@/components/fintech/ui";
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
  highlight?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function statusLabel(row: BudgetCardRow) {
  if (row.over) return "Over";
  if (row.pct >= 85) return "Close";
  return "On track";
}

function StatusBadge({ row }: { row: BudgetCardRow }) {
  const status = statusLabel(row);
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[10px] font-medium",
        row.over
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          : row.pct >= 85
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      )}
    >
      {status}
    </span>
  );
}

export function BudgetCategoryCard({
  row,
  currency,
  highlight,
  onEdit,
  onDelete,
}: BudgetCategoryCardProps) {
  return (
    <ElevatedCard
      accentColor={row.color}
      className={cn("h-full min-h-[132px]", highlight && "row-highlight")}
    >
      <div className={cn("flex h-full flex-col", fintechCardBody)}>
        <div className="flex items-start gap-3">
          <CategoryIconBadge name={row.icon} color={row.color} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
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
              <div className="flex shrink-0 items-center gap-1">
                <StatusBadge row={row} />
                <button
                  type="button"
                  onClick={onEdit}
                  className={fintechIconButton}
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
                  className={cn(fintechIconButton, fintechDeleteIconButton)}
                  aria-label={`Delete ${row.name}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <ProgressBar pct={row.pct} over={row.over} size="slim" accentColor={row.color} className="mt-3" />

            <p className={cn("mt-3 text-xs tabular-nums", fintechMuted)}>
              <span className="font-medium text-[var(--foreground)]">{formatMoney(row.spent, currency)}</span>
              {" / "}
              {formatMoney(row.budgeted, currency)}
            </p>
          </div>
        </div>
      </div>
    </ElevatedCard>
  );
}
