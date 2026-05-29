"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Brain, Loader2, MessageCircle, Sparkles, Target, TrendingUp, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { GhostButton, PrimaryButton, ShellCard, ShellInput, ShellSelect, useShellTheme } from "@/components/fintech/ui";
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
  const { isLight } = useShellTheme();
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
        <p className="inline-flex items-center gap-2 text-sm font-medium">
          <Brain className="h-4 w-4 text-violet-400" aria-hidden />
          AI financial coach
        </p>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{sourceLabel}</span>
          {!premium ? (
            <Link href="/pricing" className="text-xs text-violet-300 hover:underline">
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
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Building your weekly coach report…
        </div>
      ) : null}

      {coachQuery.data?.weekly ? (
        <div
          className={cn(
            "mb-4 rounded-xl border p-3",
            isLight ? "border-sky-200 bg-sky-50" : "border-sky-500/30 bg-sky-500/5"
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-sky-400">
            {coachQuery.data.weekly.weekLabel}
          </p>
          <p className="mt-1 text-sm font-medium">{coachQuery.data.weekly.headline}</p>
          <p className={cn("mt-1 text-xs", isLight ? "text-slate-600" : "text-slate-400")}>
            {coachQuery.data.weekly.body}
          </p>
        </div>
      ) : null}

      {coachQuery.data?.coach ? (
        <div
          className={cn(
            "mb-4 rounded-xl border p-3",
            isLight ? "border-violet-200 bg-violet-50" : "border-violet-500/30 bg-violet-500/5"
          )}
        >
          <p className="text-sm font-medium">{coachQuery.data.coach.headline}</p>
          <p className={cn("mt-1 text-xs", isLight ? "text-slate-600" : "text-slate-400")}>
            {coachQuery.data.coach.body}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {coachQuery.data.coach.focusAreas.map((area) => (
              <li
                key={area}
                className="rounded-full border border-violet-500/40 px-2 py-0.5 text-xs text-violet-200"
              >
                {area}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {coachQuery.data?.spendingHabits && coachQuery.data.spendingHabits.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            <TrendingUp className="h-3 w-3" aria-hidden />
            Spending habits
          </p>
          {coachQuery.data.spendingHabits.map((h) => (
            <div
              key={h.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                h.tone === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : h.tone === "positive"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : isLight
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-700 bg-neutral-900"
              )}
            >
              <p className="font-medium">{h.title}</p>
              <p className={cn("mt-0.5", isLight ? "text-slate-600" : "text-slate-400")}>{h.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      {coachQuery.data?.goalPredictions && coachQuery.data.goalPredictions.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Target className="h-3 w-3" aria-hidden />
            Goal predictions
          </p>
          {coachQuery.data.goalPredictions.map((g) => (
            <p key={g.goalId} className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-400")}>
              <span className={g.onTrack ? "text-emerald-400" : "text-amber-300"}>{g.name}:</span> {g.message}
            </p>
          ))}
        </div>
      ) : null}

      {anomaliesQuery.data?.anomalies && anomaliesQuery.data.anomalies.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-400">Anomalies detected</p>
          {anomaliesQuery.data.anomalies.slice(0, 3).map((a) => (
            <p key={a.category} className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-400")}>
              <span className="font-medium text-amber-300">{a.category}:</span> {a.explanation}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              "rounded-xl border p-3",
              insight.tone === "positive"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : insight.tone === "warning"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : isLight
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-700 bg-neutral-900"
            )}
          >
            <p className="text-sm font-medium">{insight.title}</p>
            <p className={cn("mt-1 text-xs", isLight ? "text-slate-600" : "text-slate-400")}>{insight.body}</p>
          </div>
        ))}
      </div>

      {canUse("what_if_simulator") ? (
        <div
          className={cn(
            "mt-4 rounded-xl border p-3",
            isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-neutral-900"
          )}
        >
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
            <Wand2 className="h-4 w-4 text-sky-400" aria-hidden />
            What-if simulator
          </p>
          <p className={cn("mb-3 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
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
            <p className={cn("mt-3 text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{whatIfAnswer}</p>
          ) : null}

          <div className="mt-4 border-t border-slate-700 pt-4">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium">
              <MessageCircle className="h-3.5 w-3.5 text-violet-400" aria-hidden />
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
              <p className={cn("mt-3 text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{customAnswer}</p>
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
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {multiWhatIf.map((r) => (
                <li key={r.label}>
                  <span className="text-sky-300">{r.label}:</span> {r.summary}
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
