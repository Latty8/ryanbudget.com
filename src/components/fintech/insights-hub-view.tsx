"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { FinancialHealthScore } from "@/components/fintech/financial-health-score";
import { InsightsView } from "@/components/fintech/insights-view";
import { NetWorthView } from "@/components/fintech/net-worth-view";
import { ReportsView } from "@/components/fintech/reports-view";
import { ReviewsView } from "@/components/fintech/reviews-view";
import { SpendingHeatmapPanel } from "@/components/fintech/spending-heatmap";
import { PageFrame, fintechMuted } from "@/components/fintech/ui";
import {
  INSIGHTS_TABS,
  type InsightsTabId,
} from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils";

const DEFAULT_TAB: InsightsTabId = "trends";

function parseTab(raw: string | null): InsightsTabId {
  const valid = INSIGHTS_TABS.map((t) => t.id);
  if (raw && valid.includes(raw as InsightsTabId)) return raw as InsightsTabId;
  return DEFAULT_TAB;
}

export function InsightsHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: InsightsTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_TAB) params.delete("tab");
      else params.set("tab", next);
      const q = params.toString();
      router.replace(q ? `/insights?${q}` : "/insights", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <PageFrame
      title="Insights"
      description="Trends, monthly & yearly reviews, reports, net worth, and your financial health — in one place."
    >
      <nav
        className="-mx-1 flex gap-1 overflow-x-auto pb-1 scrollbar-none"
        aria-label="Insights sections"
      >
        {INSIGHTS_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              tab === id
                ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--foreground)]"
                : "border-[var(--border-subtle)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "trends" ? <InsightsView embedded /> : null}
        {tab === "reviews" ? <ReviewsView embedded /> : null}
        {tab === "reports" ? <ReportsView embedded /> : null}
        {tab === "heatmap" ? <SpendingHeatmapPanel embedded /> : null}
        {tab === "net-worth" ? <NetWorthView embedded /> : null}
        {tab === "health" ? (
          <div className="space-y-4">
            <p className={cn("text-sm", fintechMuted)}>
              Your score blends budget adherence, savings rate, spending consistency, goals, and debt
              — updated each month with bi-weekly paycheck rhythm in mind.
            </p>
            <FinancialHealthScore />
            <p className={cn("text-center text-xs", fintechMuted)}>
              <HeartPulse className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
              Tap the score card for a full breakdown by factor.
            </p>
          </div>
        ) : null}
      </div>
    </PageFrame>
  );
}
