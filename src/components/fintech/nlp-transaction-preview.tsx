"use client";

import { Check, Sparkles, X } from "lucide-react";
import {
  GhostButton,
  PrimaryButton,
  fintechForeground,
  fintechIconButton,
  fintechMuted,
} from "@/components/fintech/ui";
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
        "rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-muted)] p-3",
        className
      )}
      role="region"
      aria-label="Parsed transaction preview"
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("inline-flex items-center gap-1.5 text-xs font-medium", fintechForeground)}>
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
          Review before applying
          {source && source !== "rules" ? (
            <span className="rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--accent)]">
              AI
            </span>
          ) : null}
        </p>
        <button type="button" className={fintechIconButton} onClick={onDiscard} aria-label="Discard preview">
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className={cn("mt-2 grid gap-1.5 text-sm", fintechMuted)}>
        <div className="flex justify-between gap-4">
          <dt>Amount</dt>
          <dd className={cn("font-semibold tabular-nums", fintechForeground)}>
            {draft.type === "income" ? "+" : "−"}${draft.amount.toFixed(2)} {currencyLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Description</dt>
          <dd className={cn("text-right", fintechForeground)}>{draft.description}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Category</dt>
          <dd className={fintechForeground}>{draft.category}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Date</dt>
          <dd className={fintechForeground}>{draft.date}</dd>
        </div>
        {draft.recurring ? (
          <div className="flex justify-between gap-4">
            <dt>Recurring</dt>
            <dd className="capitalize text-[var(--foreground)]">{draft.recurringFrequency ?? "yes"}</dd>
          </div>
        ) : null}
        {draft.notes ? (
          <div className="flex justify-between gap-4">
            <dt>Notes</dt>
            <dd className="max-w-[60%] text-right text-[var(--foreground)]">{draft.notes}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
        <GhostButton type="button" className="w-full sm:w-auto" onClick={onDiscard}>
          Edit manually
        </GhostButton>
        <PrimaryButton type="button" className="w-full flex-1 sm:w-auto" onClick={onConfirm}>
          <Check className="mr-1.5 h-4 w-4" />
          Apply to form
        </PrimaryButton>
      </div>
    </div>
  );
}
