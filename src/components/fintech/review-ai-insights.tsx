"use client";

import { useMutation } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { fintechForeground, fintechMuted, GhostButton, ShellCard } from "@/components/fintech/ui";
import { computeDashboardSummary } from "@/lib/dashboard/compute-summary";
import { generateInsights } from "@/lib/insights/generate-insights";
import type { ReviewSelection } from "@/lib/reviews/compute-review";
import { cn } from "@/lib/utils";
import type { DashboardInsight } from "@/types/finance";
import type { AppAccount, AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

const toneStyles = {
  positive: "border-[var(--positive)]/25 bg-[var(--positive-muted)]",
  warning: "border-amber-500/25 bg-[var(--warning-muted)]",
  neutral: "border-[var(--border-subtle)] bg-[var(--surface-elevated)]",
} as const;

function periodTransactions(
  transactions: DemoTransaction[],
  selection: ReviewSelection
): DemoTransaction[] {
  if (selection.period === "year") {
    const y = Number(selection.key);
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);
    return transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start, end })
    );
  }
  const start = startOfMonth(parseISO(`${selection.key}-01`));
  const end = endOfMonth(start);
  return transactions.filter((t) => isWithinInterval(parseISO(t.date), { start, end }));
}

type Props = {
  selection: ReviewSelection;
  accounts: AppAccount[];
  categories: AppCategory[];
  transactions: DemoTransaction[];
  recurring: { id: string; name: string; amount: number; cadence: "weekly" | "bi-weekly" | "monthly" | "yearly"; nextDate: string }[];
  baselineInsights: string[];
};

export function ReviewAiInsights({
  selection,
  accounts,
  categories,
  transactions,
  recurring,
  baselineInsights,
}: Props) {
  const scoped = useMemo(
    () => periodTransactions(transactions, selection),
    [transactions, selection]
  );

  const ruleInsights = useMemo((): DashboardInsight[] => {
    const summary = computeDashboardSummary({
      accounts,
      categories,
      transactions: scoped,
      recurring,
      budgetPeriod: "bi-weekly",
    });
    const dining = summary.categoryProgress.find((c) => c.name === "Dining");
    return generateInsights({
      moneyLeftToSpend: summary.moneyLeftToSpend,
      expensesThisMonth: summary.expensesThisMonth,
      incomeThisMonth: summary.incomeThisMonth,
      diningSpent: dining?.spent ?? 0,
      diningLastMonth: dining ? dining.spent * 0.85 : 0,
      upcomingPaychecks: summary.upcomingPaychecks,
      upcomingBills: summary.upcomingBills,
    }).slice(0, 3);
  }, [accounts, categories, scoped, recurring]);

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const summary = computeDashboardSummary({
        accounts,
        categories,
        transactions: scoped,
        recurring,
        budgetPeriod: "bi-weekly",
      });
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          categories,
          transactions: scoped,
          currency: "USD",
        }),
      });
      if (!response.ok) throw new Error("Failed");
      return (await response.json()) as { insights: DashboardInsight[] };
    },
  });

  const aiInsights = refreshMutation.data?.insights ?? [];
  const showAi = aiInsights.length > 0;

  return (
    <ShellCard className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <p className={cn("text-sm font-semibold", fintechForeground)}>Insights</p>
        </div>
        <GhostButton
          type="button"
          className="gap-1.5 text-xs"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          {refreshMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh AI
        </GhostButton>
      </div>

      <ul className="mt-4 space-y-2">
        {baselineInsights.map((line) => (
          <li
            key={line}
            className={cn(
              "rounded-[var(--radius-inner)] border px-3 py-2.5 text-sm leading-relaxed",
              toneStyles.neutral,
              fintechMuted
            )}
          >
            {line}
          </li>
        ))}
      </ul>

      {showAi ? (
        <ul className="mt-3 space-y-2">
          {aiInsights.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-[var(--radius-inner)] border px-3 py-2.5",
                toneStyles[item.tone]
              )}
            >
              <p className={cn("text-sm font-medium", fintechForeground)}>{item.title}</p>
              <p className={cn("mt-0.5 text-sm leading-relaxed", fintechMuted)}>{item.body}</p>
            </li>
          ))}
        </ul>
      ) : ruleInsights.length > 0 && !refreshMutation.isSuccess ? (
        <ul className="mt-3 space-y-2">
          {ruleInsights.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-[var(--radius-inner)] border px-3 py-2.5",
                toneStyles[item.tone]
              )}
            >
              <p className={cn("text-sm font-medium", fintechForeground)}>{item.title}</p>
              <p className={cn("mt-0.5 text-sm leading-relaxed", fintechMuted)}>{item.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className={cn("mt-3 text-[10px]", fintechMuted)}>
        Period: {selection.period === "year" ? selection.key : format(parseISO(`${selection.key}-01`), "MMMM yyyy")}
      </p>
    </ShellCard>
  );
}
