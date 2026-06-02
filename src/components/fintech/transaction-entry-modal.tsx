"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import { Loader2, Mic, Plus, Sparkles, X } from "lucide-react";

import { motion } from "framer-motion";

import { nanoid } from "nanoid";

import { toast } from "sonner";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

import { NumberField } from "@/components/fintech/number-field";
import { GhostButton, PrimaryButton, fintechIconButton } from "@/components/fintech/ui";
import { ModalPortal } from "@/components/ui/modal-portal";
import { toastTransactionSaved } from "@/lib/feedback/app-feedback";

import { NlpTransactionPreview } from "@/components/fintech/nlp-transaction-preview";
import { VoiceTransactionEntry } from "@/components/fintech/voice-transaction-entry";

import { ReceiptAttachments } from "@/components/fintech/receipt-attachments";

import { inferKindFromCategory } from "@/lib/transactions/transaction-amount";
import {
  defaultCategoryId,
  resolveCategoryForInput,
} from "@/lib/transactions/resolve-category";
import { createTransaction, suggestCategories } from "@/lib/supabase/queries/transactions";
import type { AppCategory } from "@/types/app-settings";

import { CURRENCY_OPTIONS } from "@/lib/currency/exchange-rates";

import { formatConvertedHint } from "@/lib/currency/exchange-rates";

import { demoAccounts, demoBudgets } from "@/lib/demo/sample-data";

import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

import type { ParsedTransactionDraft } from "@/lib/ai/parse-transaction";
import type { ReceiptScanSuggestion } from "@/lib/receipts/receipt-scan";
import { saveOfflineDraft } from "@/lib/offline/transaction-drafts";

import { usePremium } from "@/hooks/use-premium";

import { useAppDataStore } from "@/store/useAppDataStore";

import type { CurrencyCode } from "@/types/app-settings";

import { transactionRecordToInput } from "@/lib/transactions/store-mapper";
import type { RecurringFrequency, SplitLine, TransactionInput, TransactionRecord, TransactionTag } from "@/types/finance";

import type { TransactionReceipt } from "@/types/receipts";



const recurringOptions: RecurringFrequency[] = ["weekly", "bi-weekly", "monthly", "yearly"];

const tags: TransactionTag[] = ["needs", "wants", "business", "health", "family"];



function resolveCategorySelection(ref: string, categories: AppCategory[]): string {
  return resolveCategoryForInput(ref, categories).categoryId;
}

function defaultTransactionInput(
  categories: AppCategory[],
  accountOptions: { id: string }[]
): TransactionInput {
  return {
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
    categoryId: defaultCategoryId(categories),
    accountId: accountOptions[0]?.id ?? "",
    tags: [],
    recurring: false,
    recurringFrequency: "monthly",
    splits: [],
  };
}

export function TransactionEntryModal({

  open,

  onOpenChange,

  onCreated,

  onSubmit,

  editTransaction,

  initialDraft,

  startVoice = false,

}: {

  open: boolean;

  onOpenChange: (value: boolean) => void;

  onCreated?: () => void;

  onSubmit?: (input: TransactionInput, editId?: string) => Promise<{ ok: boolean; message: string }>;

  editTransaction?: TransactionRecord | null;

  /** Prefill fields when opened from calendar or quick actions */
  initialDraft?: Partial<TransactionInput>;

  /** Open with voice capture panel expanded */
  startVoice?: boolean;

}) {

  const { canUse, premium, demoMode } = usePremium();

  const nlpEnabled = canUse("ai_nlp_transactions");



  const [input, setInput] = useState<TransactionInput>(defaultTransactionInput([], []));

  const [showSplit, setShowSplit] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [nlpText, setNlpText] = useState("");

  const [nlpLoading, setNlpLoading] = useState(false);

  const [nlpPreview, setNlpPreview] = useState<ParsedTransactionDraft | null>(null);

  const [nlpSource, setNlpSource] = useState<"openai" | "grok" | "rules" | null>(null);

  const [voicePanel, setVoicePanel] = useState(false);

  const [goalContributionId, setGoalContributionId] = useState("");

  const [goalContributionAmount, setGoalContributionAmount] = useState(0);

  const [receipts, setReceipts] = useState<TransactionReceipt[]>([]);

  const goals = useAppDataStore((s) => s.goals);

  const preferences = useAppDataStore((s) => s.preferences);

  const storeCategories = useAppDataStore((s) => s.categories);

  const contributeToGoal = useAppDataStore((s) => s.contributeToGoal);

  const storeAccounts = useAppDataStore((s) => s.accounts);

  const accountOptions = storeAccounts.length > 0 ? storeAccounts : demoAccounts.map((a) => ({ ...a, kind: "checking" as const, color: "#38bdf8", icon: "Wallet" }));

  const categoryEntities = useMemo(
    () =>
      storeCategories.length > 0
        ? storeCategories
        : demoBudgets.map((b, i) => ({
            id: `demo-cat-${i}`,
            name: b.category,
            group: "General",
            icon: "Wallet",
            color: "#38bdf8",
            budgeted: b.budgeted,
          })),
    [storeCategories]
  );

  const categoryNameOptions = useMemo(
    () => categoryEntities.map((c) => c.name),
    [categoryEntities]
  );

  useEffect(() => {
    if (!open) return;
    if (editTransaction) {
      setInput(transactionRecordToInput(editTransaction, accountOptions, categoryEntities));
      setReceipts(editTransaction.receipts ?? []);
    } else {
      const base = defaultTransactionInput(categoryEntities, accountOptions);
      if (initialDraft) {
        setInput({
          ...base,
          ...initialDraft,
          categoryId: initialDraft.categoryId
            ? resolveCategorySelection(String(initialDraft.categoryId), categoryEntities)
            : base.categoryId,
          accountId: initialDraft.accountId ?? base.accountId,
        });
      } else {
        setInput(base);
      }
      setReceipts([]);
    }
    setShowSplit(false);
    setNlpText("");
    setNlpPreview(null);
    setMessage(null);
    setVoicePanel(Boolean(startVoice && !editTransaction));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when opening or switching edit target
  }, [open, editTransaction?.id, initialDraft, startVoice]);



  const suggestions = useMemo(() => suggestCategories(input.description), [input.description]);

  const applyReceiptScan = useCallback(
    (suggestion: ReceiptScanSuggestion) => {
      setInput((prev) => ({
        ...prev,
        description: suggestion.description || prev.description,
        amount: suggestion.amount > 0 ? suggestion.amount : prev.amount,
        date: suggestion.date || prev.date,
        categoryId: resolveCategorySelection(suggestion.category, categoryEntities),
      }));
    },
    [categoryEntities]
  );

  const canSave = input.description.trim().length > 0 && input.amount > 0;

  const txCurrency = input.currency ?? preferences.currency;

  const conversionHint = formatConvertedHint(input.amount, txCurrency, preferences.currency);



  const applyNlpDraft = useCallback(
    (draft: ParsedTransactionDraft, source?: "openai" | "grok" | "rules") => {
      const categoryId = resolveCategorySelection(draft.category, categoryEntities);

      setInput((prev) => ({

        ...prev,

        amount: draft.amount,

        description: draft.notes ? `${draft.description} — ${draft.notes}` : draft.description,

        categoryId,

        kind: draft.type,

        date: draft.date,

        recurring: Boolean(draft.recurring),

        recurringFrequency: draft.recurringFrequency ?? prev.recurringFrequency,

      }));

      setNlpPreview(null);

      setNlpSource(null);

      setMessage("Applied — review and save when ready");

      trackEvent("nlp_transaction_applied", { category: categoryId, source: source ?? "rules" });
    },
    [categoryEntities]
  );



  const runNlpParse = async () => {

    if (!nlpText.trim()) return;

    if (!nlpEnabled) {

      toast.message("Premium feature", { description: "Natural language entry unlocks with Premium (free in demo)." });

      return;

    }

    setNlpLoading(true);

    setMessage(null);

    setNlpPreview(null);

    try {

      const response = await fetch("/api/ai/parse-transaction", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "x-premium": premium || demoMode ? "true" : "false",

          "x-demo": demoMode ? "true" : "false",

        },

        body: JSON.stringify({ text: nlpText }),

      });

      const data = (await response.json()) as {

        parsed?: ParsedTransactionDraft;

        source?: "openai" | "grok" | "rules";

        error?: string;

      };

      if (!response.ok || !data.parsed) {

        setMessage(data.error ?? "Could not parse — include an amount like $45");

        return;

      }

      setNlpPreview(data.parsed);

      setNlpSource(data.source ?? "rules");

      trackEvent("nlp_transaction_parsed", { source: data.source });

    } catch {

      setMessage("Parse failed — check your connection");

    } finally {

      setNlpLoading(false);

    }

  };



  if (!open) return null;



  const toggleTag = (value: TransactionTag) => {

    setInput((prev) => ({

      ...prev,

      tags: prev.tags.includes(value) ? prev.tags.filter((t) => t !== value) : [...prev.tags, value],

    }));

  };



  const updateSplit = (id: string, patch: Partial<SplitLine>) => {

    setInput((prev) => ({

      ...prev,

      splits: (prev.splits ?? []).map((line) => (line.id === id ? { ...line, ...patch } : line)),

    }));

  };



  const removeSplit = (id: string) => {

    setInput((prev) => ({ ...prev, splits: (prev.splits ?? []).filter((line) => line.id !== id) }));

  };



  return (

    <ModalPortal open={open} layer="modal">

        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-[var(--overlay)]/90"
          onClick={() => onOpenChange(false)}
        />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex max-h-[min(90dvh,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--modal-solid)] text-[var(--foreground)] shadow-[var(--shadow-modal)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-modal-title"
      >

        <div className="shrink-0 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">

          <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-[var(--muted)]">{editTransaction ? "Edit" : "Quick transaction"}</p>

            <h2 id="tx-modal-title" className="text-lg font-semibold">

              {editTransaction ? "Edit transaction" : "Add expense in seconds"}

            </h2>

          </div>

          <button

            type="button"

            className={fintechIconButton}

            onClick={() => onOpenChange(false)}

            aria-label="Close"

          >

            <X className="h-5 w-5" />

          </button>

          </div>

        </div>



        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">

        <div className="grid gap-3 pb-4">

          {voicePanel ? (
            <VoiceTransactionEntry
              categoryNames={categoryNameOptions}
              currencyLabel={preferences.currency}
              onApply={(draft) => {
                setNlpPreview(draft);
                setNlpSource("rules");
                setVoicePanel(false);
              }}
              onCancel={() => setVoicePanel(false)}
            />
          ) : null}

          <label className="grid gap-1">

            <span className="text-xs text-[var(--muted)]">Natural language</span>

            <div className="flex flex-col gap-2 sm:flex-row">

              <input

                className="min-h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-base outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)] sm:text-sm"

                placeholder='e.g. $67.50 groceries at Walmart last Friday'

                value={nlpText}

                onChange={(e) => setNlpText(e.target.value)}

                onKeyDown={(e) => {

                  if (e.key === "Enter" && !e.shiftKey) {

                    e.preventDefault();

                    void runNlpParse();

                  }

                }}

                enterKeyHint="go"

                autoComplete="off"

                aria-label="Natural language transaction"

              />

              <button

                type="button"

                disabled={nlpLoading || !nlpText.trim() || !nlpEnabled}

                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-[var(--accent)]/40 px-4 py-2.5 text-sm text-[var(--accent)] touch-manipulation disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)]"

                onClick={() => void runNlpParse()}

              >

                {nlpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}

                {nlpLoading ? "Parsing…" : "Parse"}

              </button>

            </div>

          </label>



          {!nlpEnabled ? (

            <UpgradePrompt

              compact

              feature="ai_nlp_transactions"

              title="Natural language entry"

              description="Describe transactions in plain English — Premium unlocks AI parsing (included in demo)."

            />

          ) : null}



          {nlpPreview ? (

            <NlpTransactionPreview

              draft={nlpPreview}

              source={nlpSource ?? undefined}

              currencyLabel={txCurrency}

              onConfirm={() => applyNlpDraft(nlpPreview, nlpSource ?? undefined)}

              onDiscard={() => {

                setNlpPreview(null);

                setNlpSource(null);

              }}

            />

          ) : null}



          <label className="grid gap-1">

            <span className="text-xs text-[var(--muted)]">Amount</span>

            <NumberField

              className="px-3 py-3 text-2xl font-semibold"

              value={input.amount}

              onChange={(amount) => setInput((prev) => ({ ...prev, amount }))}

              placeholder="0.00"

              aria-label="Transaction amount"

            />

            {conversionHint ? (

              <span className="text-xs text-[var(--accent)]">{conversionHint} in your primary currency</span>

            ) : null}

          </label>



          <label className="grid gap-1">

            <span className="text-xs text-[var(--muted)]">Transaction currency</span>

            <select

              className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)]"

              value={txCurrency}

              onChange={(e) =>

                setInput((prev) => ({ ...prev, currency: e.target.value as CurrencyCode }))

              }

            >

              {CURRENCY_OPTIONS.map((c) => (

                <option key={c.code} value={c.code}>

                  {c.label} ({c.code})

                </option>

              ))}

            </select>

          </label>



          <div className="grid gap-3 sm:grid-cols-2">

            <label className="grid gap-1">

              <span className="text-xs text-[var(--muted)]">Date</span>

              <input

                className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)]"

                type="date"

                value={input.date}

                onChange={(e) => setInput((prev) => ({ ...prev, date: e.target.value }))}

              />

            </label>

            <label className="grid gap-1">

              <span className="text-xs text-[var(--muted)]">Account</span>

              <select

                className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)]"

                value={input.accountId}

                onChange={(e) => setInput((prev) => ({ ...prev, accountId: e.target.value }))}

              >

                {accountOptions.filter((a) => !("hidden" in a && a.hidden)).map((account) => (

                  <option key={account.id} value={account.id}>

                    {account.name}

                  </option>

                ))}

              </select>

            </label>

          </div>



          <label className="grid gap-1">

            <span className="text-xs text-[var(--muted)]">Description</span>

            <div className="relative">

              <input

                className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 pr-12 text-base outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)] sm:text-sm"

                placeholder="Coffee, Uber, Rent..."

                value={input.description}

                onChange={(e) => setInput((prev) => ({ ...prev, description: e.target.value }))}

              />

              <button

                type="button"

                className={cn(fintechIconButton, "absolute right-1 top-1/2 -translate-y-1/2 !min-h-10 !min-w-10")}

                aria-label="Voice input"

                onClick={() => setVoicePanel((v) => !v)}

              >

                <Mic className={cn("h-4 w-4", voicePanel && "text-[var(--accent)]")} />

              </button>

            </div>

          </label>



          {suggestions.length > 0 ? (

            <div className="flex flex-wrap gap-2">

              <p className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">

                <Sparkles className="h-3 w-3" /> Suggestions

              </p>

              {suggestions.map((suggestion) => (

                <button

                  key={suggestion}

                  type="button"

                  className="rounded-full border border-[var(--border)] px-2 py-1 text-xs text-[var(--foreground)] hover:border-[var(--accent)]"

                  onClick={() =>
                    setInput((prev) => ({
                      ...prev,
                      categoryId: resolveCategorySelection(suggestion, categoryEntities),
                    }))
                  }

                >

                  {suggestion}

                </button>

              ))}

            </div>

          ) : null}



          <label className="grid gap-1">

            <span className="text-xs text-[var(--muted)]">Category</span>

            <select

              className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)]"

              value={input.categoryId}

              onChange={(e) => setInput((prev) => ({ ...prev, categoryId: e.target.value }))}

            >

              {categoryEntities.map((category) => (

                <option key={category.id} value={category.id}>

                  {category.name}

                </option>

              ))}

            </select>

          </label>



          {goals.length > 0 ? (

            <div className="rounded-xl border border-[var(--positive)]/20 bg-[var(--positive-muted)] p-3">

              <p className="text-xs font-medium text-[var(--positive)]">Also add to a savings goal</p>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">

                <select

                  className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--positive)] focus-visible:ring-2 focus-visible:ring-[var(--positive-muted)]"

                  value={goalContributionId}

                  onChange={(e) => setGoalContributionId(e.target.value)}

                  aria-label="Goal to fund"

                >

                  <option value="">None</option>

                  {goals.map((g) => (

                    <option key={g.id} value={g.id}>

                      {g.name}

                    </option>

                  ))}

                </select>

                <NumberField

                  value={goalContributionAmount}

                  onChange={setGoalContributionAmount}

                  placeholder="Amount"

                  className="px-2 py-2 text-sm"

                  aria-label="Goal contribution amount"

                />

              </div>

            </div>

          ) : null}



          <div className="flex flex-wrap gap-2">

            {tags.map((tag) => (

              <button

                key={tag}

                type="button"

                className={`rounded-full border px-2 py-1 text-xs ${input.tags.includes(tag) ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--foreground)]"}`}

                onClick={() => toggleTag(tag)}

              >

                {tag}

              </button>

            ))}

          </div>



          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)]/70 p-3">

            <div className="flex flex-wrap items-center justify-between gap-2">

              <label className="inline-flex items-center gap-2 text-sm">

                <input

                  type="checkbox"

                  checked={input.recurring}

                  onChange={(e) => setInput((prev) => ({ ...prev, recurring: e.target.checked }))}

                />

                Recurring

              </label>

              {input.recurring ? (

                <select

                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-xs"

                  value={input.recurringFrequency}

                  onChange={(e) =>

                    setInput((prev) => ({

                      ...prev,

                      recurringFrequency: e.target.value as RecurringFrequency,

                    }))

                  }

                >

                  {recurringOptions.map((option) => (

                    <option key={option} value={option}>

                      {option}

                    </option>

                  ))}

                </select>

              ) : null}

            </div>



            <div className="mt-3">

              <button type="button" className="text-xs text-[var(--foreground)] underline" onClick={() => setShowSplit((prev) => !prev)}>

                {showSplit ? "Hide split lines" : "Split transaction"}

              </button>

              {showSplit ? (

                <div className="mt-2 space-y-2">

                  {(input.splits ?? []).map((line) => (

                    <div key={line.id} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">

                      <input

                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-sm"

                        placeholder="Category"

                        value={line.categoryId}

                        onChange={(e) => updateSplit(line.id, { categoryId: e.target.value })}

                      />

                      <NumberField

                        className="px-2 py-1 text-sm"

                        value={line.amount}

                        onChange={(amount) => updateSplit(line.id, { amount })}

                        placeholder="Amount"

                        aria-label="Split amount"

                      />

                      <button

                        type="button"

                        className="rounded-lg border border-rose-500/40 px-2 py-1 text-xs text-rose-300"

                        onClick={() => removeSplit(line.id)}

                      >

                        Remove

                      </button>

                    </div>

                  ))}

                  <button

                    type="button"

                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs"

                    onClick={() =>

                      setInput((prev) => ({

                        ...prev,

                        splits: [...(prev.splits ?? []), { id: nanoid(), categoryId: prev.categoryId, amount: 0 }],

                      }))

                    }

                  >

                    <Plus className="h-3 w-3" />

                    Add split line

                  </button>

                </div>

              ) : null}

            </div>

          </div>



          <ReceiptAttachments
            receipts={receipts}
            onChange={setReceipts}
            onScanSuggestion={applyReceiptScan}
            compact
          />



          {message ? <p className="text-xs text-[var(--foreground)]">{message}</p> : null}

        </div>

        </div>

          <div className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--modal-solid)] px-4 py-4 pb-safe sm:px-5">

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

            <GhostButton type="button" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </GhostButton>

            <PrimaryButton
              type="button"
              disabled={!canSave || saving}
              className="w-full sm:w-auto"
              onClick={async () => {

                setSaving(true);

                const selectedCategory = categoryEntities.find(
                  (c) => c.id === input.categoryId || c.name === input.categoryId
                );
                const payload: TransactionInput = {
                  ...input,
                  kind: input.kind ?? inferKindFromCategory(selectedCategory),
                  currency: txCurrency,
                  receipts,
                };

                if (!navigator.onLine) {
                  saveOfflineDraft(payload);
                  setSaving(false);
                  toastTransactionSaved({ offline: true });
                  onOpenChange(false);
                  return;
                }

                const result = onSubmit
                  ? await onSubmit(payload, editTransaction?.id)
                  : await createTransaction(payload, {
                      categories: storeCategories,
                      accounts: storeAccounts,
                    });

                setSaving(false);

                setMessage(result.message);

                if (result.ok) {

                  trackEvent("transaction_saved", { recurring: input.recurring });

                  if (goalContributionId && goalContributionAmount > 0) {

                    contributeToGoal(goalContributionId, goalContributionAmount);

                    toast.success("Goal contribution recorded");

                  }

                  onCreated?.();

                  onOpenChange(false);

                  setGoalContributionId("");

                  setGoalContributionAmount(0);

                  setReceipts([]);

                  setNlpText("");

                  setNlpPreview(null);

                  setInput({

                    amount: 0,

                    date: new Date().toISOString().slice(0, 10),

                    description: "",

                    categoryId: defaultCategoryId(categoryEntities),

                    accountId: accountOptions[0]?.id ?? "",

                    currency: preferences.currency,

                    tags: [],

                    recurring: false,

                    recurringFrequency: "monthly",

                    splits: [],

                  });

                } else {

                  toast.error(result.message);

                }

              }}

            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : editTransaction ? (
                "Save changes"
              ) : (
                "Save transaction"
              )}
            </PrimaryButton>

          </div>

          </div>

      </motion.div>

    </ModalPortal>

  );

}

