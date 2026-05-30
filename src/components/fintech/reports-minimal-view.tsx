"use client";

import { useMemo } from "react";
import { PageFrame } from "@/components/fintech/ui";
import { DashboardCashflowMinimal } from "@/components/fintech/dashboard-cashflow-minimal";
import { computeReportData, resolveReportRange } from "@/lib/reports/compute-report-data";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { useShallow } from "zustand/react/shallow";

export function ReportsMinimalView() {
  const { accounts, categories, transactions, currency } = useAppDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      categories: s.categories,
      transactions: s.demoTransactions,
      currency: s.preferences.currency,
    }))
  );

  const range = useMemo(() => resolveReportRange("this-month"), []);

  const report = useMemo(
    () =>
      computeReportData({
        range,
        cadence: "monthly",
        accounts,
        categories,
        transactions,
        primaryCurrency: currency,
      }),
    [range, accounts, categories, transactions, currency]
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
      <div className="mb-10 grid grid-cols-2 gap-8 text-center">
        <div>
          <p className="text-xs text-slate-500">Income</p>
          <p className="mt-1 text-2xl font-medium text-emerald-600">{formatMoney(report.income, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Spent</p>
          <p className="mt-1 text-2xl font-medium text-slate-900">{formatMoney(report.expenses, currency)}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-slate-900">Cash flow</h2>
        <DashboardCashflowMinimal data={chartData} currency={currency} />
      </section>

      {report.spendingByCategory.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-medium text-slate-700">Top categories</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {report.spendingByCategory.slice(0, 5).map((row) => (
              <li key={row.name} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-slate-800">{row.name}</span>
                <span className="text-sm font-medium">{formatMoney(row.value, currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageFrame>
  );
}
