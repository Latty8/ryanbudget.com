"use client";

import { Check, Sparkles, X } from "lucide-react";
import type { ParsedTransactionDraft } from "@/lib/ai/parse-transaction";
import { cn } from "@/lib/utils";

type NlpTransactionPreviewProps = {
  draft: ParsedTransactionDraft;
  source?: "openai" | "grok" | "rules";
  currencyLabel?: string;
  onConfirm: () => void;
  onDiscard: () => void;
  className?: string;
};

export function NlpTransactionPreview({
  draft,
  source,
  currencyLabel = "USD",
  onConfirm,
  onDiscard,
  className,
}: NlpTransactionPreviewProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-violet-500/40 bg-violet-500/10 p-3",
        className
      )}
      role="region"
      aria-label="Parsed transaction preview"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Review before applying
          {source && source !== "rules" ? (
            <span className="rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
              AI
            </span>
          ) : null}
        </p>
        <button
          type="button"
          className="rounded-lg p-1 text-slate-400 hover:bg-neutral-800 hover:text-white"
          onClick={onDiscard}
          aria-label="Discard preview"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-2 grid gap-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Amount</dt>
          <dd className="font-semibold text-slate-100">
            {draft.type === "income" ? "+" : "−"}${draft.amount.toFixed(2)} {currencyLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Description</dt>
          <dd className="text-right text-slate-200">{draft.description}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Category</dt>
          <dd className="text-slate-200">{draft.category}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Date</dt>
          <dd className="text-slate-200">{draft.date}</dd>
        </div>
        {draft.recurring ? (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Recurring</dt>
            <dd className="capitalize text-slate-200">{draft.recurringFrequency ?? "yes"}</dd>
          </div>
        ) : null}
        {draft.notes ? (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Notes</dt>
            <dd className="max-w-[60%] text-right text-slate-300">{draft.notes}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-medium text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          onClick={onConfirm}
        >
          <Check className="h-4 w-4" />
          Apply to form
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-600 px-3 py-2.5 text-sm text-slate-300 touch-manipulation"
          onClick={onDiscard}
        >
          Edit manually
        </button>
      </div>
    </div>
  );
}
