"use client";

import Link from "next/link";
import {
  fintechForeground,
  fintechGlass,
  fintechLabel,
  fintechLink,
  fintechMuted,
  ProgressBar,
} from "@/components/fintech/ui";
import { periodLabel, periodSpentLabel, type BudgetPeriod } from "@/lib/budget/period";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/store/useAppDataStore";
import type { CurrencyCode } from "@/types/app-settings";

type CategoryProgress = {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
};

export function DashboardBudgetProgress({
  categories,
  currency,
  budgetPeriod,
}: {
  categories: CategoryProgress[];
  currency: CurrencyCode;
  budgetPeriod: BudgetPeriod;
}) {
  const rows = [...categories]
    .filter((c) => c.budgeted > 0)
    .sort((a, b) => b.spent / Math.max(b.budgeted, 1) - a.spent / Math.max(a.budgeted, 1))
    .slice(0, 5);

  if (rows.length === 0) return null;

  return (
    <section className={cn(fintechGlass, "p-6 md:p-7")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Budget progress</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>
            {periodLabel(budgetPeriod)} view · {periodSpentLabel(budgetPeriod)}
          </p>
        </div>
        <Link href="/budgets" className={cn("text-xs font-medium", fintechLink)}>
          All budgets
        </Link>
      </div>
      <ul className="mt-5 space-y-4">
        {rows.map((row) => {
          const pct = Math.min(100, (row.spent / Math.max(row.budgeted, 1)) * 100);
          const over = row.spent > row.budgeted;
          return (
            <li key={row.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className={cn("font-medium", fintechForeground)}>{row.name}</span>
                <span className={cn("tabular-nums text-xs", fintechMuted)}>
                  {formatMoney(row.spent, currency)} / {formatMoney(row.budgeted, currency)}
                </span>
              </div>
              <ProgressBar pct={pct} over={over} className="mt-2" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
