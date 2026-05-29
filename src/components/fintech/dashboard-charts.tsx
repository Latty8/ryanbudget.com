"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays } from "lucide-react";
import { EmptyState, ShellCard } from "@/components/fintech/ui";
import { useShellTheme } from "@/components/fintech/ui";
import { formatMoney } from "@/store/useAppDataStore";
import type { CurrencyCode } from "@/types/app-settings";
import type { DashboardSummary } from "@/types/finance";
import { cn } from "@/lib/utils";

type CashflowPoint = DashboardSummary["cashflow"][number];

type DashboardChartsProps = {
  cashflowData: CashflowPoint[];
  data: DashboardSummary;
  currency: CurrencyCode;
  cashflowMode: "monthly" | "biweekly";
  onCashflowModeChange: (mode: "monthly" | "biweekly") => void;
};

export function DashboardCharts({
  cashflowData,
  data,
  currency,
  cashflowMode,
  onCashflowModeChange,
}: DashboardChartsProps) {
  const { isLight } = useShellTheme();
  const gridStroke = isLight ? "#e2e8f0" : "#1e293b";
  const axisStroke = isLight ? "#64748b" : "#94a3b8";

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <ShellCard className="xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Cash flow + projection</p>
            <div className="inline-flex rounded-xl border border-slate-600 p-1" role="tablist" aria-label="Cash flow view">
              <button
                role="tab"
                aria-selected={cashflowMode === "monthly"}
                className={cn("rounded-lg px-3 py-1 text-xs", cashflowMode === "monthly" ? "bg-sky-500 text-slate-950" : "")}
                onClick={() => onCashflowModeChange("monthly")}
              >
                Monthly
              </button>
              <button
                role="tab"
                aria-selected={cashflowMode === "biweekly"}
                className={cn("rounded-lg px-3 py-1 text-xs", cashflowMode === "biweekly" ? "bg-sky-500 text-slate-950" : "")}
                onClick={() => onCashflowModeChange("biweekly")}
              >
                Bi-weekly
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" stroke={axisStroke} />
                <YAxis stroke={axisStroke} />
                <Tooltip isAnimationActive={false} />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="expenses" stroke="#38bdf8" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="projectedBalance" stroke="#a78bfa" fill="#a78bfa33" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ShellCard>

        <ShellCard>
          <p className="mb-3 text-sm font-medium">Top budget categories</p>
          {data.categoryProgress.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No categories yet"
              description="Add categories in Settings or load demo data to see progress."
            />
          ) : (
            <div className="space-y-3">
              {data.categoryProgress.slice(0, 5).map((category) => {
                const pct = Math.min(100, (category.spent / Math.max(category.budgeted, 1)) * 100);
                return (
                  <div
                    key={category.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-2",
                      isLight ? "border-slate-200" : "border-slate-700/40"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                        {formatMoney(category.spent, currency)} / {formatMoney(category.budgeted, currency)}
                      </p>
                    </div>
                    <svg className="h-12 w-12 -rotate-90" aria-hidden>
                      <circle cx="24" cy="24" r="18" stroke={isLight ? "#e2e8f0" : "#334155"} strokeWidth="5" fill="none" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="#38bdf8"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${(pct / 100) * 113} 113`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </ShellCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ShellCard>
          <p className="mb-3 text-sm font-medium">Next 3 paychecks</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.upcomingPaychecks}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" stroke={axisStroke} />
                <YAxis stroke={axisStroke} />
                <Tooltip isAnimationActive={false} />
                <Area type="monotone" dataKey="amount" stroke="#22c55e" fill="#22c55e33" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ShellCard>
        <ShellCard>
          <p className="mb-3 text-sm font-medium">Upcoming bills & paychecks</p>
          <div className="space-y-2">
            {data.upcomingBills.slice(0, 5).map((bill) => (
              <div
                key={bill.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2",
                  isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-neutral-900"
                )}
              >
                <div>
                  <p className="text-sm">{bill.name}</p>
                  <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                    Next: {bill.date} · {bill.frequency}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatMoney(bill.amount, currency)}</p>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>
    </>
  );
}
