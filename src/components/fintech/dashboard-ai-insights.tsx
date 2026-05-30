"use client";

import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  fintechGlass,
  fintechForeground,
  fintechLabel,
  fintechMuted,
} from "@/components/fintech/ui";
import { useDeferredMount } from "@/hooks/use-deferred-mount";
import { cn } from "@/lib/utils";
import type { DashboardInsight, DashboardSummary } from "@/types/finance";
import type { AppCategory, CurrencyCode } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

const STORAGE_KEY = "dashboard-ai-expanded";

const toneStyles = {
  positive: {
    icon: CheckCircle2,
    wrap: "border-[var(--positive)]/20 bg-[var(--positive-muted)]",
    iconClass: "text-[var(--positive)]",
  },
  warning: {
    icon: AlertTriangle,
    wrap: "border-amber-500/25 bg-[var(--warning-muted)]",
    iconClass: "text-amber-500",
  },
  neutral: {
    icon: Lightbulb,
    wrap: "border-[var(--border)] bg-[var(--surface-elevated)]",
    iconClass: "text-[var(--accent)]",
  },
} as const;

type Props = {
  summary: DashboardSummary;
  categories: AppCategory[];
  transactions: DemoTransaction[];
  currency: CurrencyCode;
  baselineInsights: DashboardInsight[];
};

export function DashboardAiInsights({
  summary,
  categories,
  transactions,
  currency,
  baselineInsights,
}: Props) {
  const aiReady = useDeferredMount(1200);
  const [expanded, setExpanded] = useState(true);
  const [insights, setInsights] = useState<DashboardInsight[]>(baselineInsights.slice(0, 4));
  const [source, setSource] = useState<"rules" | "openai" | "grok">("rules");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "false") setExpanded(false);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    setInsights(baselineInsights.slice(0, 4));
  }, [baselineInsights]);

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, categories, transactions, currency }),
      });
      if (!response.ok) throw new Error("Failed to load insights");
      return (await response.json()) as {
        insights: DashboardInsight[];
        source: "rules" | "openai" | "grok";
      };
    },
    onSuccess: (data) => {
      setInsights(data.insights.slice(0, 4));
      setSource(data.source);
    },
  });

  useEffect(() => {
    if (aiReady && !refreshMutation.isSuccess && !refreshMutation.isPending) {
      refreshMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiReady]);

  const sourceHint =
    source === "openai" ? "Powered by AI" : source === "grok" ? "Powered by Grok" : "Smart analysis";

  return (
    <section className={cn(fintechGlass, "overflow-hidden")}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-[var(--surface-hover)] md:p-6"
        onClick={toggleExpanded}
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className={cn("inline-flex items-center gap-2", fintechLabel)}>
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={2} aria-hidden />
            AI Insights
          </p>
          <p className={cn("mt-1 truncate text-sm", fintechMuted)}>
            {expanded ? "Personalized for your bi-weekly pay" : `${insights.length} tips · tap to expand`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Refresh insights"
            disabled={refreshMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              refreshMutation.mutate();
            }}
            className="rounded-xl border border-[var(--border)] p-2 text-[var(--muted)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            {refreshMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-[var(--muted)] transition-transform duration-300",
              expanded && "rotate-180"
            )}
            strokeWidth={1.75}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="insights-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border-subtle)] px-5 pb-5 pt-4 md:px-6 md:pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {insights.map((insight, index) => {
                  const style = toneStyles[insight.tone];
                  const Icon = style.icon;
                  return (
                    <motion.article
                      key={insight.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={cn(
                        "flex gap-3 rounded-2xl border p-4 shadow-[var(--shadow-inner)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
                        style.wrap
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--glass)]",
                          style.iconClass
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-semibold leading-snug", fintechForeground)}>
                          {insight.title}
                        </p>
                        <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>{insight.body}</p>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
              <p className={cn("mt-4 text-center text-[10px]", fintechMuted)}>{sourceHint}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
