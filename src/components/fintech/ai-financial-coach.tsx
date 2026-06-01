"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  ChevronDown,
  Lightbulb,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buildBiweeklyPersonalInsight } from "@/lib/ai/biweekly-insight";
import { simulateWhatIfProjection } from "@/lib/ai/what-if-local";
import { CoachWhatIfSection } from "@/components/fintech/coach-what-if-section";
import { buildAnonymizedContext } from "@/lib/ai/anonymized-context";
import { buildCoachActionSteps } from "@/lib/ai/coach-actions";
import {
  fintechCard,
  fintechForeground,
  fintechInnerCard,
  fintechInsightAccent,
  fintechInsightBox,
  fintechInsightPositive,
  fintechInsightWarning,
  fintechLabel,
  fintechLink,
  fintechMuted,
  GhostButton,
} from "@/components/fintech/ui";
import { useDeferredMount } from "@/hooks/use-deferred-mount";
import { usePremium } from "@/hooks/use-premium";
import { cn } from "@/lib/utils";
import type { DashboardInsight, DashboardSummary } from "@/types/finance";
import type { AppCategory, AppGoal, CurrencyCode } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

const STORAGE_KEY = "ai-coach-tab";
const EXPANDED_KEY = "ai-coach-expanded";

type CoachTab = "coach" | "scenarios" | "tips";

type CoachResponse = {
  coach: { headline: string; body: string; focusAreas: string[] };
  weekly: { weekLabel: string; headline: string; body: string };
  goalPredictions: Array<{ goalId: string; name: string; onTrack: boolean; message: string }>;
  spendingHabits: Array<{ id: string; title: string; detail: string; tone: string }>;
};

type Props = {
  summary: DashboardSummary;
  categories: AppCategory[];
  transactions: DemoTransaction[];
  goals: AppGoal[];
  currency: CurrencyCode;
  baselineInsights: DashboardInsight[];
};

const tabs: { id: CoachTab; label: string; icon: typeof Brain }[] = [
  { id: "coach", label: "Coach", icon: Brain },
  { id: "scenarios", label: "What-if", icon: Wand2 },
  { id: "tips", label: "Quick tips", icon: Lightbulb },
];

export function AiFinancialCoach({
  summary,
  categories,
  transactions,
  goals,
  currency,
  baselineInsights,
}: Props) {
  const aiReady = useDeferredMount(800);
  const { premium } = usePremium();
  const [tab, setTab] = useState<CoachTab>("coach");
  const [expanded, setExpanded] = useState(true);
  const [tips, setTips] = useState(baselineInsights.slice(0, 3));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    try {
      const storedTab = localStorage.getItem(STORAGE_KEY) as CoachTab | null;
      if (storedTab && tabs.some((t) => t.id === storedTab)) setTab(storedTab);
      if (localStorage.getItem(EXPANDED_KEY) === "false") setExpanded(false);
    } catch {
      /* ignore */
    }
  }, []);

  const pickTab = (next: CoachTab) => {
    setTab(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const coachQuery = useQuery({
    queryKey: [
      "ai-coach",
      refreshKey,
      summary.moneyLeftToSpend,
      goals.length,
      summary.daysUntilNextPaycheck,
      summary.expensesThisMonth,
    ],
    queryFn: async () => {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, categories, transactions, goals, currency }),
      });
      if (!response.ok) throw new Error("Coach unavailable");
      return (await response.json()) as CoachResponse;
    },
    staleTime: 5 * 60_000,
    enabled: aiReady,
  });

  const tipsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, categories, transactions, currency }),
      });
      if (!response.ok) throw new Error("Failed");
      return (await response.json()) as { insights: DashboardInsight[] };
    },
    onSuccess: (data) => setTips(data.insights.slice(0, 4)),
  });

  const refreshCoach = async () => {
    setRefreshKey((k) => k + 1);
    const tasks: Promise<unknown>[] = [coachQuery.refetch()];
    if (tab === "tips") tasks.push(tipsMutation.mutateAsync());
    try {
      await Promise.all(tasks);
      toast.success("Coach insights refreshed");
    } catch {
      toast.error("Could not refresh insights");
    }
  };

  useEffect(() => {
    setTips(baselineInsights.slice(0, 3));
  }, [baselineInsights]);

  const payRhythm =
    summary.daysUntilNextPaycheck != null
      ? `Next paycheck in ${summary.daysUntilNextPaycheck} days · $${Math.round(summary.moneyLeftToSpend)} safe to spend`
      : "Bi-weekly paycheck plan";

  const coachContext = useMemo(
    () => buildAnonymizedContext({ summary, categories, transactions, currency }),
    [summary, categories, transactions, currency]
  );
  const actionSteps = useMemo(() => buildCoachActionSteps(coachContext), [coachContext]);
  const biweeklyInsight = useMemo(
    () => buildBiweeklyPersonalInsight(coachContext, summary),
    [coachContext, summary]
  );
  const diningPreview = useMemo(() => {
    const p = simulateWhatIfProjection(coachContext, {
      mode: "dollars",
      category: "Dining",
      monthlyDollars: 100,
    });
    return p?.summary ?? "Open What-if to model a spending change.";
  }, [coachContext]);

  return (
    <section className={cn(fintechCard, "overflow-hidden border-[var(--accent)]/25")}>
      <div className="relative border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--accent)]/10 via-transparent to-[var(--accent-deep)]/5 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            onClick={() => {
              setExpanded((v) => {
                const next = !v;
                try {
                  localStorage.setItem(EXPANDED_KEY, String(next));
                } catch {
                  /* ignore */
                }
                return next;
              });
            }}
            aria-expanded={expanded}
          >
            <span
              className={cn(
                fintechInnerCard,
                "flex h-11 w-11 shrink-0 items-center justify-center border-[var(--accent)]/20 bg-[var(--accent)] text-[var(--accent-foreground)]"
              )}
            >
              <Brain className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", fintechForeground)}>
                AI Financial Coach
                <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Personal
                </span>
              </span>
              <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>{payRhythm}</p>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <GhostButton
              className="min-h-10 min-w-10 text-xs"
              disabled={coachQuery.isFetching || tipsMutation.isPending}
              onClick={() => void refreshCoach()}
              aria-label="Refresh coach insights"
              title="Refresh insights"
            >
              {coachQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </GhostButton>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-[var(--muted)] transition-transform",
                expanded && "rotate-180"
              )}
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
        </div>

        {expanded ? (
          <div
            className={cn(fintechInnerCard, "mt-4 inline-flex w-full max-w-full gap-1 overflow-x-auto p-1")}
            role="tablist"
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={cn(
                    "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    tab === t.id
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                  onClick={() => pickTab(t.id)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="coach-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-5 md:px-6 md:py-6">
              {tab === "coach" ? (
                <div className="space-y-4">
                  {coachQuery.isFetching && !coachQuery.data ? (
                    <div className="space-y-3" aria-busy="true">
                      <div className={cn(fintechInnerCard, "h-20 animate-pulse")} />
                      <div className={cn(fintechInnerCard, "h-24 animate-pulse")} />
                    </div>
                  ) : null}

                  {biweeklyInsight ? (
                    <div className={fintechInsightAccent}>
                      {biweeklyInsight.highlight ? (
                        <p className={cn("text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]")}>
                          {biweeklyInsight.highlight}
                        </p>
                      ) : null}
                      <p className={cn("mt-1 text-base font-semibold", fintechForeground)}>
                        {biweeklyInsight.headline}
                      </p>
                      <p className={cn("mt-2 text-sm leading-relaxed", fintechMuted)}>{biweeklyInsight.body}</p>
                    </div>
                  ) : null}

                  {actionSteps.length > 0 ? (
                    <div>
                      <p className={cn("mb-2 inline-flex items-center gap-1.5", fintechLabel)}>
                        <ListChecks className="h-3 w-3" />
                        Your next steps
                      </p>
                      <ul className="space-y-2">
                        {actionSteps.map((step) => (
                          <li key={step.id}>
                            {step.href ? (
                              <Link
                                href={step.href}
                                className={cn(
                                  fintechInnerCard,
                                  "flex items-start gap-2 px-3 py-2.5 transition hover:border-[var(--accent)]/30"
                                )}
                              >
                                <span className="min-w-0 flex-1">
                                  <span className={cn("text-sm font-medium", fintechForeground)}>{step.title}</span>
                                  <span className={cn("mt-0.5 block text-xs", fintechMuted)}>{step.detail}</span>
                                </span>
                                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                              </Link>
                            ) : (
                              <div className={cn(fintechInnerCard, "px-3 py-2.5")}>
                                <p className={cn("text-sm font-medium", fintechForeground)}>{step.title}</p>
                                <p className={cn("mt-0.5 text-xs", fintechMuted)}>{step.detail}</p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {coachQuery.data?.weekly ? (
                    <div className={fintechInsightAccent}>
                      <p className={cn("inline-flex items-center gap-1.5", fintechLabel)}>
                        <CalendarDays className="h-3 w-3" />
                        {coachQuery.data.weekly.weekLabel}
                      </p>
                      <p className={cn("mt-2 text-base font-semibold", fintechForeground)}>
                        {coachQuery.data.weekly.headline}
                      </p>
                      <p className={cn("mt-1 text-sm leading-relaxed", fintechMuted)}>
                        {coachQuery.data.weekly.body}
                      </p>
                    </div>
                  ) : null}

                  {coachQuery.data?.coach ? (
                    <div className={fintechInsightBox}>
                      <p className={cn("text-sm font-semibold", fintechForeground)}>
                        {coachQuery.data.coach.headline}
                      </p>
                      <p className={cn("mt-2 text-sm leading-relaxed", fintechMuted)}>
                        {coachQuery.data.coach.body}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {coachQuery.data.coach.focusAreas.map((area) => (
                          <li
                            key={area}
                            className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]"
                          >
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {coachQuery.data?.spendingHabits && coachQuery.data.spendingHabits.length > 0 ? (
                    <div>
                      <p className={cn("mb-2 inline-flex items-center gap-1.5", fintechLabel)}>
                        <TrendingUp className="h-3 w-3" />
                        Gentle suggestions
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {coachQuery.data.spendingHabits.slice(0, 3).map((h) => (
                          <div
                            key={h.id}
                            className={cn(
                              cn(fintechInnerCard, "px-3 py-3 text-sm"),
                              h.tone === "warning"
                                ? fintechInsightWarning
                                : h.tone === "positive"
                                  ? fintechInsightPositive
                                  : fintechInsightBox
                            )}
                          >
                            <p className={cn("font-medium", fintechForeground)}>{h.title}</p>
                            <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>{h.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {coachQuery.data?.goalPredictions && coachQuery.data.goalPredictions.length > 0 ? (
                    <div>
                      <p className={cn("mb-2 inline-flex items-center gap-1.5", fintechLabel)}>
                        <Target className="h-3 w-3" />
                        Goal progress predictions
                      </p>
                      <ul className="space-y-2">
                        {coachQuery.data.goalPredictions.map((g) => (
                          <li
                            key={g.goalId}
                            className={cn(fintechInnerCard, "px-3 py-2.5 text-sm")}
                          >
                            <span
                              className={cn(
                                "font-medium",
                                g.onTrack ? "text-[var(--positive)]" : "text-amber-600 dark:text-amber-400"
                              )}
                            >
                              {g.name}
                            </span>
                            <p className={cn("mt-0.5 text-xs", fintechMuted)}>{g.message}</p>
                          </li>
                        ))}
                      </ul>
                      <Link href="/goals" className={cn("mt-2 inline-block text-xs", fintechLink)}>
                        View all goals →
                      </Link>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={cn("w-full text-left", fintechInsightBox, "transition hover:border-[var(--accent)]/30")}
                    onClick={() => pickTab("scenarios")}
                  >
                    <p className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", fintechForeground)}>
                      <Wand2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                      Quick what-if preview
                    </p>
                    <p className={cn("mt-2 text-xs leading-relaxed", fintechMuted)}>{diningPreview}</p>
                    <span className={cn("mt-2 inline-block text-xs font-medium", fintechLink)}>Open full simulator →</span>
                  </button>

                  {!premium ? (
                    <p className={cn("text-center text-[10px]", fintechMuted)}>
                      <Link href="/pricing" className={fintechLink}>
                        Upgrade
                      </Link>{" "}
                      for natural-language scenarios
                    </p>
                  ) : null}
                </div>
              ) : null}

              {tab === "scenarios" ? (
                <CoachWhatIfSection
                  summary={summary}
                  categories={categories}
                  transactions={transactions}
                  currency={currency}
                />
              ) : null}

              {tab === "tips" ? (
                <div className="space-y-3">
                  <p className={cn("text-xs", fintechMuted)}>
                    Short, actionable tips — separate from your full coaching plan above.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tips.map((insight) => (
                      <div
                        key={insight.id}
                        className={cn(
                          cn(fintechInnerCard, "p-3"),
                          insight.tone === "positive"
                            ? fintechInsightPositive
                            : insight.tone === "warning"
                              ? fintechInsightWarning
                              : fintechInsightBox
                        )}
                      >
                        <p className={cn("flex items-center gap-1.5 text-sm font-medium", fintechForeground)}>
                          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                          {insight.title}
                        </p>
                        <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>{insight.body}</p>
                      </div>
                    ))}
                  </div>
                  <GhostButton className="text-xs" onClick={() => tipsMutation.mutate()} disabled={tipsMutation.isPending}>
                    {tipsMutation.isPending ? "Refreshing…" : "Refresh tips"}
                  </GhostButton>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
