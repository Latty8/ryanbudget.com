"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageFrame } from "@/components/fintech/ui";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { useShallow } from "zustand/react/shallow";

export function BudgetsMinimalView() {
  const { categories, transactions, preferences } = useAppDataStore(
    useShallow((s) => ({
      categories: s.categories.filter((c) => c.name !== "Income"),
      transactions: s.demoTransactions,
      preferences: s.preferences,
    }))
  );

  const rows = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return categories.map((cat) => {
      const spent = Math.abs(
        transactions
          .filter((t) => t.date.startsWith(month) && t.category === cat.name && t.amount < 0)
          .reduce((s, t) => s + t.amount, 0)
      );
      return { id: cat.id, name: cat.name, budgeted: cat.budgeted, spent };
    });
  }, [categories, transactions]);

  const totalBudgeted = rows.reduce((s, r) => s + r.budgeted, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  if (categories.length === 0) {
    return (
      <PageFrame title="Budgets">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">No categories yet.</p>
          <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
            Finish setup
          </Link>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Budgets" description="Simple monthly limits per category.">
      <div className="mb-10 grid grid-cols-2 gap-6 text-center md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Budgeted</p>
          <p className="mt-1 text-xl font-medium">{formatMoney(totalBudgeted, preferences.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Spent</p>
          <p className="mt-1 text-xl font-medium">{formatMoney(totalSpent, preferences.currency)}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs text-slate-500">Left</p>
          <p className="mt-1 text-xl font-medium text-emerald-600">
            {formatMoney(Math.max(0, totalBudgeted - totalSpent), preferences.currency)}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {rows.map((row) => {
          const pct = Math.min(100, (row.spent / Math.max(row.budgeted, 1)) * 100);
          return (
            <li key={row.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-slate-900">{row.name}</p>
                <p className="text-sm text-slate-600">
                  {formatMoney(row.spent, preferences.currency)} / {formatMoney(row.budgeted, preferences.currency)}
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-800 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </PageFrame>
  );
}
