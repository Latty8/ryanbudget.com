"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Wallet2,
} from "lucide-react";
import { HouseholdSharedBanner } from "@/components/fintech/household-shared-banner";
import { TransactionEntryModal } from "@/components/fintech/transaction-entry-modal";
import { PrimaryButton, ShellCard, Skeleton } from "@/components/fintech/ui";
import { useShellTheme } from "@/components/fintech/ui";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { useMounted } from "@/components/use-mounted";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { RecurringFrequency } from "@/types/finance";
import { useShallow } from "zustand/react/shallow";

const AiInsightsPanel = dynamic(
  () => import("@/components/fintech/ai-insights-panel").then((m) => ({ default: m.AiInsightsPanel })),
  { loading: () => <Skeleton className="h-48 w-full" /> }
);

const DashboardCharts = dynamic(
  () => import("@/components/fintech/dashboard-charts").then((m) => ({ default: m.DashboardCharts })),
  { loading: () => <Skeleton className="h-72 w-full" />, ssr: false }
);

export function DashboardView() {
  const mounted = useMounted();
  const { isLight } = useShellTheme();
  const [cashflowMode, setCashflowMode] = useState<"monthly" | "biweekly">("monthly");
  const [openQuickAdd, setOpenQuickAdd] = useState(false);

  const { accounts, categories, transactions, recurring, preferences, goals } = useAppDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      categories: s.categories,
      transactions: s.demoTransactions,
      recurring: s.demoRecurring,
      preferences: s.preferences,
      goals: s.goals,
    }))
  );

  const data = useMemo(
    () =>
      computeDashboardSummary({
        accounts,
        categories,
        transactions,
        recurring: recurring.map((r) => ({
          id: r.id,
          name: r.name,
          amount: r.amount,
          cadence: r.cadence as RecurringFrequency,
          nextDate: r.nextDate,
        })),
      }),
    [accounts, categories, transactions, recurring]
  );

  if (!mounted) {
    return (
      <div className="space-y-4 pb-20 md:pb-0">
        <Skeleton className="h-32" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const cashflowData =
    cashflowMode === "biweekly"
      ? data.cashflow.map((point, idx) => ({
          ...point,
          month: `P${idx + 1}`,
          income: Math.round(point.income / 2),
          expenses: Math.round(point.expenses / 2),
        }))
      : data.cashflow;

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <HouseholdSharedBanner />
      <ShellCard className="p-5">
        <p className={cn("text-xs uppercase tracking-wide", isLight ? "text-slate-500" : "text-slate-400")}>
          Money left to spend
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">
              {formatMoney(data.moneyLeftToSpend, preferences.currency)}
            </h1>
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
              Safe amount before next paycheck and bills.
            </p>
          </div>
          <PrimaryButton onClick={() => setOpenQuickAdd(true)} aria-label="Add transaction">
            Add transaction
            <ArrowUpRight className="ml-1 inline h-4 w-4" />
          </PrimaryButton>
        </div>
      </ShellCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total balance", value: data.totalBalance, trend: "up" as const },
          { label: "Income this month", value: data.incomeThisMonth, trend: "up" as const },
          { label: "Expenses this month", value: data.expensesThisMonth, trend: "down" as const },
          { label: "Projected month end", value: data.projectedEndOfMonthBalance, trend: "up" as const },
        ].map((metric) => (
          <article
            key={metric.label}
            className={cn(
              "rounded-2xl border p-4",
              isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"
            )}
          >
            <div className="flex items-center justify-between">
              <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{metric.label}</p>
              {metric.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden />
              ) : metric.label.includes("Expenses") ? (
                <TrendingDown className="h-4 w-4 text-rose-400" aria-hidden />
              ) : (
                <Wallet2 className="h-4 w-4 text-slate-500" aria-hidden />
              )}
            </div>
            <p className="mt-2 text-xl font-semibold">{formatMoney(metric.value, preferences.currency)}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ShellCard>
          <p className={cn("text-xs uppercase tracking-wide", isLight ? "text-slate-500" : "text-slate-400")}>
            Days until next paycheck
          </p>
          <p className="mt-2 text-2xl font-semibold">{data.daysUntilNextPaycheck ?? "—"}</p>
        </ShellCard>
        <ShellCard>
          <p className={cn("text-xs uppercase tracking-wide", isLight ? "text-slate-500" : "text-slate-400")}>
            Days until broke (est.)
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold",
              data.daysUntilBroke !== null && data.daysUntilBroke < 14 ? "text-amber-400" : ""
            )}
          >
            {data.daysUntilBroke === null ? "∞" : data.daysUntilBroke}
          </p>
        </ShellCard>
        <ShellCard>
          <p className={cn("text-xs uppercase tracking-wide", isLight ? "text-slate-500" : "text-slate-400")}>
            Bills before paycheck
          </p>
          <p className="mt-2 text-2xl font-semibold">{data.billsBeforeNextPaycheck}</p>
        </ShellCard>
      </div>

      {data.daysUntilBroke !== null && data.daysUntilBroke < 10 ? (
        <ShellCard className="border-amber-500/40 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" aria-hidden />
            <div>
              <p className="text-sm font-medium">Low runway warning</p>
              <p className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-400")}>
                At your current pace, funds may run low in about {data.daysUntilBroke} days. Review upcoming bills and
                flexible spending.
              </p>
            </div>
          </div>
        </ShellCard>
      ) : null}

      <AiInsightsPanel
        summary={data}
        categories={categories}
        transactions={transactions}
        goals={goals}
        currency={preferences.currency}
        baselineInsights={data.insights}
      />

      <DashboardCharts
        cashflowData={cashflowData}
        data={data}
        currency={preferences.currency}
        cashflowMode={cashflowMode}
        onCashflowModeChange={setCashflowMode}
      />

      <TransactionEntryModal open={openQuickAdd} onOpenChange={setOpenQuickAdd} />
    </div>
  );
}
