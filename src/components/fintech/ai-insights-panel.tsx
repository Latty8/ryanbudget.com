"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Brain, Loader2, MessageCircle, Sparkles, Target, TrendingUp, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { GhostButton, PrimaryButton, ShellCard, ShellInput, ShellSelect, fintechForeground, fintechInsightAccent, fintechInsightBox, fintechInsightPositive, fintechInsightWarning, fintechLabel, fintechLink, fintechMuted } from "@/components/fintech/ui";
import type { DashboardInsight, DashboardSummary } from "@/types/finance";
import type { AppCategory, AppGoal } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { useDeferredMount } from "@/hooks/use-deferred-mount";
import { usePremium } from "@/hooks/use-premium";
import { cn } from "@/lib/utils";

type CoachResponse = {
  coach: { headline: string; body: string; focusAreas: string[] };
  weekly: { weekLabel: string; headline: string; body: string };
  goalPredictions: Array<{ goalId: string; name: string; onTrack: boolean; message: string }>;
  spendingHabits: Array<{ id: string; title: string; detail: string; tone: string }>;
};

type AiInsightsPanelProps = {
  summary: DashboardSummary;
  categories: AppCategory[];
  transactions: DemoTransaction[];
  goals?: AppGoal[];
  currency: string;
  baselineInsights: DashboardInsight[];
};

export function AiInsightsPanel({
  summary,
  categories,
  transactions,
  goals = [],
  currency,
  baselineInsights,
}: AiInsightsPanelProps) {
  const { premium, canUse } = usePremium();
  const aiReady = useDeferredMount(2500);
  const [insights, setInsights] = useState<DashboardInsight[]>(baselineInsights);
  const [source, setSource] = useState<"rules" | "openai" | "grok">("rules");
  const [whatIfCategory, setWhatIfCategory] = useState("Dining");
  const [whatIfPct, setWhatIfPct] = useState(20);
  const [whatIfAnswer, setWhatIfAnswer] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [multiWhatIf, setMultiWhatIf] = useState<Array<{ label: string; summary: string }>>([]);
  const [multiLoading, setMultiLoading] = useState(false);

  const coachQuery = useQuery({
    queryKey: ["ai-coach", summary.moneyLeftToSpend, goals.length],
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
    enabled: aiReady && (premium || canUse("advanced_ai")),
  });

  const anomaliesQuery = useQuery({
    queryKey: ["ai-anomalies", summary.expensesThisMonth],
    queryFn: async () => {
      const response = await fetch("/api/ai/anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, categories, transactions, currency }),
      });
      if (!response.ok) throw new Error("Anomalies unavailable");
      return (await response.json()) as {
        anomalies: Array<{ category: string; explanation: string; severity: string }>;
      };
    },
    staleTime: 5 * 60_000,
    enabled: aiReady && premium,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, categories, transactions, currency }),
      });
      if (!response.ok) throw new Error("Failed to load AI insights");
      return (await response.json()) as {
        insights: DashboardInsight[];
        source: "rules" | "openai" | "grok";
      };
    },
    onSuccess: (data) => {
      setInsights(data.insights);
      setSource(data.source);
      toast.success(data.source === "rules" ? "Insights updated (smart rules)" : `Insights powered by ${data.source}`);
    },
    onError: () => toast.error("Could not refresh AI insights"),
  });

  const whatIfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          categories,
          transactions,
          currency,
          category: whatIfCategory,
          reductionPct: whatIfPct,
        }),
      });
      if (!response.ok) throw new Error("What-if failed");
      return (await response.json()) as { answer: string; source: string };
    },
    onSuccess: (data) => setWhatIfAnswer(data.answer),
    onError: () => toast.error("Could not run what-if scenario"),
  });

  const customWhatIfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/what-if/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-premium": premium || canUse("what_if_simulator") ? "true" : "false",
        },
        body: JSON.stringify({
          summary,
          categories,
          transactions,
          currency,
          question: customQuestion,
        }),
      });
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "What-if failed");
      }
      return (await response.json()) as { answer: string; estimatedMonthlyImpact: number };
    },
    onSuccess: (data) => {
      setCustomAnswer(data.answer);
      toast.success("Scenario modeled");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not model scenario"),
  });

  const sourceLabel =
    source === "openai" ? "OpenAI" : source === "grok" ? "Grok" : "Smart rules (add OPENAI_API_KEY for AI)";

  const coachEnabled = premium || canUse("advanced_ai");

  return (
    <ShellCard>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className={cn("inline-flex items-center gap-2 text-sm font-medium", fintechForeground)}>
          <Brain className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          AI financial coach
        </p>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", fintechMuted)}>{sourceLabel}</span>
          {!premium ? (
            <Link href="/pricing" className={cn("text-xs", fintechLink)}>
              Upgrade for advanced AI
            </Link>
          ) : null}
          <GhostButton
            className="text-xs"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            aria-label="Refresh AI insights"
          >
            {refreshMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-1 inline h-3 w-3" />
                Refresh
              </>
            )}
          </GhostButton>
        </div>
      </div>

      {coachQuery.isLoading && coachEnabled ? (
        <div className={cn("mb-4 flex items-center gap-2 text-xs", fintechMuted)}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Building your weekly coach report…
        </div>
      ) : null}

      {coachQuery.data?.weekly ? (
        <div className={cn("mb-4", fintechInsightAccent)}>
          <p className={cn(fintechLabel, "normal-case tracking-normal text-[var(--accent)]")}>
            {coachQuery.data.weekly.weekLabel}
          </p>
          <p className={cn("mt-1 text-sm font-medium", fintechForeground)}>{coachQuery.data.weekly.headline}</p>
          <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>
            {coachQuery.data.weekly.body}
          </p>
        </div>
      ) : null}

      {coachQuery.data?.coach ? (
        <div className={cn("mb-4", fintechInsightBox)}>
          <p className={cn("text-sm font-medium", fintechForeground)}>{coachQuery.data.coach.headline}</p>
          <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>
            {coachQuery.data.coach.body}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {coachQuery.data.coach.focusAreas.map((area) => (
              <li
                key={area}
                className="rounded-full border border-[var(--accent)]/30 px-2 py-0.5 text-xs text-[var(--foreground)]"
              >
                {area}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {coachQuery.data?.spendingHabits && coachQuery.data.spendingHabits.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className={cn("inline-flex items-center gap-1", fintechLabel)}>
            <TrendingUp className="h-3 w-3" aria-hidden />
            Spending habits
          </p>
          {coachQuery.data.spendingHabits.map((h) => (
            <div
              key={h.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                h.tone === "warning"
                  ? fintechInsightWarning
                  : h.tone === "positive"
                    ? fintechInsightPositive
                    : fintechInsightBox
              )}
            >
              <p className={cn("font-medium", fintechForeground)}>{h.title}</p>
              <p className={cn("mt-0.5", fintechMuted)}>{h.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      {coachQuery.data?.goalPredictions && coachQuery.data.goalPredictions.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className={cn("inline-flex items-center gap-1", fintechLabel)}>
            <Target className="h-3 w-3" aria-hidden />
            Goal predictions
          </p>
          {coachQuery.data.goalPredictions.map((g) => (
            <p key={g.goalId} className={cn("text-xs", fintechMuted)}>
              <span className={g.onTrack ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                {g.name}:
              </span>{" "}
              {g.message}
            </p>
          ))}
        </div>
      ) : null}

      {anomaliesQuery.data?.anomalies && anomaliesQuery.data.anomalies.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className={cn(fintechLabel, "text-amber-600 dark:text-amber-400")}>Anomalies detected</p>
          {anomaliesQuery.data.anomalies.slice(0, 3).map((a) => (
            <p key={a.category} className={cn("text-xs", fintechMuted)}>
              <span className="font-medium text-amber-600 dark:text-amber-400">{a.category}:</span> {a.explanation}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              insight.tone === "positive"
                ? fintechInsightPositive
                : insight.tone === "warning"
                  ? fintechInsightWarning
                  : fintechInsightBox
            )}
          >
            <p className={cn("text-sm font-medium", fintechForeground)}>{insight.title}</p>
            <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>{insight.body}</p>
          </div>
        ))}
      </div>

      {canUse("what_if_simulator") ? (
        <div className={cn("mt-4", fintechInsightBox)}>
          <p className={cn("mb-2 inline-flex items-center gap-2 text-sm font-medium", fintechForeground)}>
            <Wand2 className="h-4 w-4 text-[var(--accent)]" aria-hidden />
            What-if simulator
          </p>
          <p className={cn("mb-3 text-xs leading-relaxed", fintechMuted)}>
            Cut a category or ask a free-form question — anonymized totals only.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[140px] flex-1">
              <ShellSelect
                value={whatIfCategory}
                onChange={(e) => setWhatIfCategory(e.target.value)}
                aria-label="Category for what-if"
              >
                {categories
                  .filter((c) => c.name !== "Income")
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </ShellSelect>
            </div>
            <ShellInput
              className="w-24"
              type="number"
              min={5}
              max={100}
              value={whatIfPct}
              onChange={(e) => setWhatIfPct(Number(e.target.value || 20))}
              aria-label="Reduction percent"
            />
            <span className="text-sm">%</span>
            <PrimaryButton onClick={() => whatIfMutation.mutate()} disabled={whatIfMutation.isPending}>
              {whatIfMutation.isPending ? "Running..." : "Simulate cut"}
            </PrimaryButton>
          </div>
          {whatIfAnswer ? (
            <p className={cn("mt-3 text-sm leading-relaxed", fintechForeground)}>{whatIfAnswer}</p>
          ) : null}

          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            <p className={cn("mb-2 inline-flex items-center gap-2 text-xs font-medium", fintechForeground)}>
              <MessageCircle className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
              Ask anything
            </p>
            <div className="flex flex-wrap gap-2">
              <ShellInput
                className="min-w-[200px] flex-1"
                placeholder='e.g. "What if I buy a new car for $400/mo?"'
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                aria-label="Custom what-if question"
              />
              <PrimaryButton
                onClick={() => customWhatIfMutation.mutate()}
                disabled={customWhatIfMutation.isPending || !customQuestion.trim()}
              >
                {customWhatIfMutation.isPending ? "Thinking…" : "Ask coach"}
              </PrimaryButton>
            </div>
            {customAnswer ? (
              <p className={cn("mt-3 text-sm leading-relaxed", fintechForeground)}>{customAnswer}</p>
            ) : null}
          </div>

          <GhostButton
            className="mt-3 text-xs"
            disabled={multiLoading}
            onClick={async () => {
              setMultiLoading(true);
              try {
                const response = await fetch("/api/ai/what-if/multi", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ summary, categories, transactions, currency }),
                });
                if (!response.ok) throw new Error("Failed");
                const data = (await response.json()) as { results: Array<{ label: string; summary: string }> };
                setMultiWhatIf(data.results);
              } catch {
                toast.error("Could not compare scenarios");
              } finally {
                setMultiLoading(false);
              }
            }}
          >
            {multiLoading ? "Comparing…" : "Compare multiple scenarios"}
          </GhostButton>
          {multiWhatIf.length > 0 ? (
            <ul className={cn("mt-2 space-y-1 text-xs", fintechMuted)}>
              {multiWhatIf.map((r) => (
                <li key={r.label}>
                  <span className="font-medium text-[var(--accent)]">{r.label}:</span> {r.summary}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <UpgradePrompt
            title="What-if simulator is Premium"
            description="Model spending cuts, big purchases, and see impact on your bi-weekly plan."
            feature="what_if_simulator"
          />
        </div>
      )}
    </ShellCard>
  );
}
