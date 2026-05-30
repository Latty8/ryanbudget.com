"use client";

import { useMemo } from "react";
import {
  fintechDivide,
  fintechForeground,
  fintechGlass,
  fintechLabel,
  fintechMuted,
  fintechSurface,
  PageFrame,
} from "@/components/fintech/ui";
import { DashboardCashflowMinimal } from "@/components/fintech/dashboard-cashflow-minimal";
import { getEffectiveBudgetPeriod, reportCadenceFromBudgetPeriod } from "@/lib/budget/period";
import { computeReportData, resolveReportRange } from "@/lib/reports/compute-report-data";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

export function ReportsMinimalView() {
  const { accounts, categories, transactions, currency, budgetPeriod } = useAppDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      categories: s.categories,
      transactions: s.demoTransactions,
      currency: s.preferences.currency,
      budgetPeriod: getEffectiveBudgetPeriod(s.preferences.budgetPeriod, s.demoRecurring),
    }))
  );

  const range = useMemo(() => resolveReportRange("this-month"), []);

  const report = useMemo(
    () =>
      computeReportData({
        range,
        cadence: reportCadenceFromBudgetPeriod(budgetPeriod),
        accounts,
        categories,
        transactions,
        primaryCurrency: currency,
      }),
    [range, accounts, categories, transactions, currency, budgetPeriod]
  );

  const chartData = useMemo(
    () =>
      report.cashflow.map((p) => ({
        month: p.label,
        income: p.income,
        expenses: p.expenses,
        projectedBalance: p.net,
      })),
    [report.cashflow]
  );

  return (
    <PageFrame title="Reports" description="This month at a glance.">
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className={cn(fintechGlass, "p-5 text-center")}>
          <p className={fintechLabel}>Income</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--positive)]">
            {formatMoney(report.income, currency)}
          </p>
        </div>
        <div className={cn(fintechGlass, "p-5 text-center")}>
          <p className={fintechLabel}>Spent</p>
          <p className={cn("mt-2 text-2xl font-semibold", fintechForeground)}>
            {formatMoney(report.expenses, currency)}
          </p>
        </div>
      </div>

      <section className={cn(fintechSurface, "p-5")}>
        <h2 className={cn("mb-4 text-sm font-medium", fintechForeground)}>Cash flow</h2>
        <DashboardCashflowMinimal data={chartData} currency={currency} />
      </section>

      {report.spendingByCategory.length > 0 ? (
        <section className="mt-10">
          <h2 className={cn("mb-4 text-sm font-medium", fintechForeground)}>Top categories</h2>
          <ul className={cn(fintechSurface, fintechDivide, "divide-y")}>
            {report.spendingByCategory.slice(0, 5).map((row) => (
              <li key={row.name} className="flex items-center justify-between px-5 py-3.5">
                <span className={cn("text-sm", fintechForeground)}>{row.name}</span>
                <span className={cn("text-sm font-medium", fintechForeground)}>
                  {formatMoney(row.value, currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageFrame>
  );
}
