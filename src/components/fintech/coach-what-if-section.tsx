"use client";

import { MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import {
  PrimaryButton,
  ShellInput,
  ShellSelect,
  fintechForeground,
  fintechInsightBox,
  fintechMuted,
} from "@/components/fintech/ui";
import { WhatIfProjectionCard } from "@/components/fintech/what-if-projection-card";
import { buildAnonymizedContext } from "@/lib/ai/anonymized-context";
import type { WhatIfProjection } from "@/lib/ai/what-if-projection";
import { simulateWhatIfProjection, WHAT_IF_PRESETS, type WhatIfInput } from "@/lib/ai/what-if-local";
import { usePremium } from "@/hooks/use-premium";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/types/finance";
import type { AppCategory, CurrencyCode } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

type Props = {
  summary: DashboardSummary;
  categories: AppCategory[];
  transactions: DemoTransaction[];
  currency: CurrencyCode;
};

type CutMode = "percent" | "dollars";

export function CoachWhatIfSection({ summary, categories, transactions, currency }: Props) {
  const { premium, canUse } = usePremium();
  const premiumAi = canUse("what_if_simulator") || premium;

  const context = useMemo(
    () =>
      buildAnonymizedContext({
        summary,
        categories,
        transactions,
        currency,
      }),
    [summary, categories, transactions, currency]
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.name !== "Income"),
    [categories]
  );

  const [whatIfCategory, setWhatIfCategory] = useState(
    () => expenseCategories.find((c) => c.name === "Dining")?.name ?? expenseCategories[0]?.name ?? "Dining"
  );
  const [cutMode, setCutMode] = useState<CutMode>("dollars");
  const [whatIfPct, setWhatIfPct] = useState(20);
  const [monthlyDollars, setMonthlyDollars] = useState(100);
  const [projection, setProjection] = useState<WhatIfProjection | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  const runLocal = (input: WhatIfInput) => {
    setProjection(simulateWhatIfProjection(context, input));
  };

  const whatIfMutation = useMutation({
    mutationFn: async () => {
      const body =
        cutMode === "percent"
          ? { category: whatIfCategory, reductionPct: whatIfPct }
          : { category: whatIfCategory, reductionPct: Math.min(100, Math.round((monthlyDollars / Math.max(1, context.categoryTotals.find((c) => c.name === whatIfCategory)?.spent ?? monthlyDollars)) * 100)) };
      const response = await fetch("/api/ai/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          categories,
          transactions,
          currency,
          ...body,
        }),
      });
      if (!response.ok) throw new Error("What-if failed");
      return (await response.json()) as { answer: string };
    },
    onSuccess: (data) => {
      const input: WhatIfInput =
        cutMode === "percent"
          ? { mode: "percent", category: whatIfCategory, reductionPct: whatIfPct }
          : { mode: "dollars", category: whatIfCategory, monthlyDollars };
      const local = simulateWhatIfProjection(context, input);
      if (local) setProjection({ ...local, summary: data.answer });
      else setProjection(null);
    },
    onError: () => {
      runLocal(
        cutMode === "percent"
          ? { mode: "percent", category: whatIfCategory, reductionPct: whatIfPct }
          : { mode: "dollars", category: whatIfCategory, monthlyDollars }
      );
    },
  });

  const simulate = () => {
    if (premiumAi) {
      whatIfMutation.mutate();
      return;
    }
    runLocal(
      cutMode === "percent"
        ? { mode: "percent", category: whatIfCategory, reductionPct: whatIfPct }
        : { mode: "dollars", category: whatIfCategory, monthlyDollars }
    );
  };

  const applyPreset = (preset: (typeof WHAT_IF_PRESETS)[number]) => {
    setWhatIfCategory(preset.category);
    if ("dollars" in preset && preset.dollars) {
      setCutMode("dollars");
      setMonthlyDollars(preset.dollars);
      runLocal({ mode: "dollars", category: preset.category, monthlyDollars: preset.dollars });
    } else if ("percent" in preset && preset.percent) {
      setCutMode("percent");
      setWhatIfPct(preset.percent);
      runLocal({ mode: "percent", category: preset.category, reductionPct: preset.percent });
    }
  };

  const customWhatIfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/what-if/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-premium": premiumAi ? "true" : "false",
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
      return (await response.json()) as { answer: string };
    },
    onSuccess: (data) => {
      setCustomAnswer(data.answer);
      toast.success("Got it — here's what that could mean");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not model scenario"),
  });

  return (
    <div className="space-y-4">
      <p className={cn("text-sm leading-relaxed", fintechMuted)}>
        Try a small change — see how it affects your bi-weekly runway. No pressure to commit; this is just a preview.
      </p>

      <div className="flex flex-wrap gap-2">
        {WHAT_IF_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5"
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className={fintechInsightBox}>
        <p className={cn("text-sm font-medium", fintechForeground)}>Custom cut</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "rounded-[var(--radius-inner)] px-3 py-1 text-xs font-medium",
              cutMode === "dollars" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]"
            )}
            onClick={() => setCutMode("dollars")}
          >
            $ per month
          </button>
          <button
            type="button"
            className={cn(
              "rounded-[var(--radius-inner)] px-3 py-1 text-xs font-medium",
              cutMode === "percent" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]"
            )}
            onClick={() => setCutMode("percent")}
          >
            % less
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <ShellSelect
            className="min-w-[140px] flex-1"
            value={whatIfCategory}
            onChange={(e) => setWhatIfCategory(e.target.value)}
            aria-label="Category"
          >
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </ShellSelect>
          {cutMode === "dollars" ? (
            <>
              <span className={cn("text-sm", fintechMuted)}>$</span>
              <ShellInput
                className="w-24"
                type="number"
                min={5}
                step={5}
                value={monthlyDollars}
                onChange={(e) => setMonthlyDollars(Number(e.target.value || 100))}
                aria-label="Monthly dollars to cut"
              />
              <span className={cn("text-xs", fintechMuted)}>/mo</span>
            </>
          ) : (
            <>
              <ShellInput
                className="w-20"
                type="number"
                min={5}
                max={100}
                value={whatIfPct}
                onChange={(e) => setWhatIfPct(Number(e.target.value || 20))}
                aria-label="Reduction percent"
              />
              <span className={cn("text-sm", fintechMuted)}>%</span>
            </>
          )}
          <PrimaryButton onClick={simulate} disabled={whatIfMutation.isPending}>
            {whatIfMutation.isPending ? "Running…" : "See impact"}
          </PrimaryButton>
        </div>
        {projection ? (
          <div className="mt-4">
            <WhatIfProjectionCard projection={projection} currency={currency} />
          </div>
        ) : null}
        {!premiumAi ? (
          <p className={cn("mt-2 text-[10px]", fintechMuted)}>Instant estimate · Upgrade for deeper AI answers</p>
        ) : null}
      </div>

      {premiumAi ? (
        <div className={fintechInsightBox}>
          <p className={cn("inline-flex items-center gap-2 text-sm font-medium", fintechForeground)}>
            <MessageCircle className="h-4 w-4 text-[var(--accent)]" />
            Ask in your own words
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ShellInput
              className="min-w-[200px] flex-1"
              placeholder='e.g. "What if I reduce dining out by $100/month?"'
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
            />
            <PrimaryButton
              onClick={() => customWhatIfMutation.mutate()}
              disabled={customWhatIfMutation.isPending || !customQuestion.trim()}
            >
              {customWhatIfMutation.isPending ? "Thinking…" : "Ask"}
            </PrimaryButton>
          </div>
          {customAnswer ? <p className={cn("mt-3 text-sm leading-relaxed", fintechForeground)}>{customAnswer}</p> : null}
        </div>
      ) : (
        <UpgradePrompt
          compact
          title="Premium: natural-language scenarios"
          description="Ask open-ended what-if questions in plain English."
          feature="what_if_simulator"
        />
      )}
    </div>
  );
}
