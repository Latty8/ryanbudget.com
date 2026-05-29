"use client";



import { useCallback, useMemo, useState } from "react";

import { Loader2, Mic, Plus, Sparkles, X } from "lucide-react";

import { nanoid } from "nanoid";

import { toast } from "sonner";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

import { NumberField } from "@/components/fintech/number-field";

import { NlpTransactionPreview } from "@/components/fintech/nlp-transaction-preview";

import { ReceiptAttachments } from "@/components/fintech/receipt-attachments";

import { createTransaction, suggestCategories } from "@/lib/supabase/queries/transactions";

import { CURRENCY_OPTIONS } from "@/lib/currency/exchange-rates";

import { formatConvertedHint } from "@/lib/currency/exchange-rates";

import { demoAccounts, demoBudgets } from "@/lib/demo/sample-data";

import { trackEvent } from "@/lib/analytics";

import type { ParsedTransactionDraft } from "@/lib/ai/parse-transaction";
import type { ReceiptScanSuggestion } from "@/lib/receipts/receipt-scan";
import { saveOfflineDraft } from "@/lib/offline/transaction-drafts";

import { usePremium } from "@/hooks/use-premium";

import { useAppDataStore } from "@/store/useAppDataStore";

import type { CurrencyCode } from "@/types/app-settings";

import type { RecurringFrequency, SplitLine, TransactionInput, TransactionTag } from "@/types/finance";

import type { TransactionReceipt } from "@/types/receipts";



const recurringOptions: RecurringFrequency[] = ["weekly", "bi-weekly", "monthly", "yearly"];

const tags: TransactionTag[] = ["needs", "wants", "business", "health", "family"];



function resolveCategoryId(name: string, options: string[]): string {

  const lower = name.toLowerCase();

  const exact = options.find((c) => c.toLowerCase() === lower);

  if (exact) return exact;

  const partial = options.find((c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower));

  return partial ?? options[0] ?? name;

}



export function TransactionEntryModal({

  open,

  onOpenChange,

  onCreated,

  onSubmit,

}: {

  open: boolean;

  onOpenChange: (value: boolean) => void;

  onCreated?: () => void;

  onSubmit?: (input: TransactionInput) => Promise<{ ok: boolean; message: string }>;

}) {

  const { canUse, premium, demoMode } = usePremium();

  const nlpEnabled = canUse("ai_nlp_transactions");



  const [input, setInput] = useState<TransactionInput>({

    amount: 0,

    date: new Date().toISOString().slice(0, 10),

    description: "",

    categoryId: demoBudgets[0]?.category ?? "",

    accountId: demoAccounts[0]?.id ?? "",

    tags: [],

    recurring: false,

    recurringFrequency: "monthly",

    splits: [],

  });

  const [showSplit, setShowSplit] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [nlpText, setNlpText] = useState("");

  const [nlpLoading, setNlpLoading] = useState(false);

  const [nlpPreview, setNlpPreview] = useState<ParsedTransactionDraft | null>(null);

  const [nlpSource, setNlpSource] = useState<"openai" | "grok" | "rules" | null>(null);

  const [goalContributionId, setGoalContributionId] = useState("");

  const [goalContributionAmount, setGoalContributionAmount] = useState(0);

  const [receipts, setReceipts] = useState<TransactionReceipt[]>([]);

  const goals = useAppDataStore((s) => s.goals);

  const preferences = useAppDataStore((s) => s.preferences);

  const storeCategories = useAppDataStore((s) => s.categories);

  const contributeToGoal = useAppDataStore((s) => s.contributeToGoal);

  const storeAccounts = useAppDataStore((s) => s.accounts);

  const accountOptions = storeAccounts.length > 0 ? storeAccounts : demoAccounts.map((a) => ({ ...a, kind: "checking" as const, color: "#38bdf8", icon: "Wallet" }));



  const categoryOptions = useMemo(() => {

    if (storeCategories.length > 0) return storeCategories.map((c) => c.name);

    return demoBudgets.map((b) => b.category);

  }, [storeCategories]);



  const suggestions = useMemo(() => suggestCategories(input.description), [input.description]);

  const applyReceiptScan = useCallback(
    (suggestion: ReceiptScanSuggestion) => {
      setInput((prev) => ({
        ...prev,
        description: suggestion.description || prev.description,
        amount: suggestion.amount > 0 ? suggestion.amount : prev.amount,
        date: suggestion.date || prev.date,
        categoryId: resolveCategoryId(suggestion.category, categoryOptions),
      }));
    },
    [categoryOptions]
  );

  const canSave = input.description.trim().length > 0 && input.amount > 0;

  const txCurrency = input.currency ?? preferences.currency;

  const conversionHint = formatConvertedHint(input.amount, txCurrency, preferences.currency);



  const applyNlpDraft = useCallback(
    (draft: ParsedTransactionDraft, source?: "openai" | "grok" | "rules") => {
      const categoryId = resolveCategoryId(draft.category, categoryOptions);

      setInput((prev) => ({

        ...prev,

        amount: draft.amount,

        description: draft.notes ? `${draft.description} — ${draft.notes}` : draft.description,

        categoryId,

        date: draft.date,

        recurring: Boolean(draft.recurring),

        recurringFrequency: draft.recurringFrequency ?? prev.recurringFrequency,

      }));

      setNlpPreview(null);

      setNlpSource(null);

      setMessage("Applied — review and save when ready");

      trackEvent("nlp_transaction_applied", { category: categoryId, source: source ?? "rules" });
    },
    [categoryOptions]
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

    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center">

      <div

        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-neutral-900 p-4 text-slate-100 shadow-2xl"

        role="dialog"

        aria-modal="true"

        aria-labelledby="tx-modal-title"

      >

        <div className="mb-3 flex items-center justify-between">

          <div>

            <p className="text-sm text-slate-400">Quick transaction</p>

            <h2 id="tx-modal-title" className="text-lg font-semibold">

              Add expense in seconds

            </h2>

          </div>

          <button

            type="button"

            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"

            onClick={() => onOpenChange(false)}

            aria-label="Close"

          >

            <X className="h-5 w-5" />

          </button>

        </div>



        <div className="grid gap-3">

          <label className="grid gap-1">

            <span className="text-xs text-slate-400">Natural language</span>

            <div className="flex flex-col gap-2 sm:flex-row">

              <input

                className="min-h-11 flex-1 rounded-xl border border-slate-600 bg-neutral-950 px-3 py-2.5 text-base outline-none focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-400/30 sm:text-sm"

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

                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-violet-500/50 px-4 py-2.5 text-sm text-violet-200 touch-manipulation disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"

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

            <span className="text-xs text-slate-400">Amount</span>

            <NumberField

              className="px-3 py-3 text-2xl font-semibold"

              value={input.amount}

              onChange={(amount) => setInput((prev) => ({ ...prev, amount }))}

              placeholder="0.00"

              aria-label="Transaction amount"

            />

            {conversionHint ? (

              <span className="text-xs text-sky-300">{conversionHint} in your primary currency</span>

            ) : null}

          </label>



          <label className="grid gap-1">

            <span className="text-xs text-slate-400">Transaction currency</span>

            <select

              className="min-h-11 rounded-xl border border-slate-600 bg-neutral-950 px-3 py-2 text-sm outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30"

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

              <span className="text-xs text-slate-400">Date</span>

              <input

                className="min-h-11 rounded-xl border border-slate-600 bg-neutral-950 px-3 py-2 outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30"

                type="date"

                value={input.date}

                onChange={(e) => setInput((prev) => ({ ...prev, date: e.target.value }))}

              />

            </label>

            <label className="grid gap-1">

              <span className="text-xs text-slate-400">Account</span>

              <select

                className="min-h-11 rounded-xl border border-slate-600 bg-neutral-950 px-3 py-2 outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30"

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

            <span className="text-xs text-slate-400">Description</span>

            <div className="relative">

              <input

                className="min-h-11 w-full rounded-xl border border-slate-600 bg-neutral-950 px-3 py-2 pr-12 text-base outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30 sm:text-sm"

                placeholder="Coffee, Uber, Rent..."

                value={input.description}

                onChange={(e) => setInput((prev) => ({ ...prev, description: e.target.value }))}

              />

              <button

                type="button"

                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"

                aria-label="Voice input coming soon"

                onClick={() => toast.message("Voice input", { description: "Coming soon — use natural language text for now." })}

              >

                <Mic className="h-4 w-4" />

              </button>

            </div>

          </label>



          {suggestions.length > 0 ? (

            <div className="flex flex-wrap gap-2">

              <p className="inline-flex items-center gap-1 text-xs text-slate-400">

                <Sparkles className="h-3 w-3" /> Suggestions

              </p>

              {suggestions.map((suggestion) => (

                <button

                  key={suggestion}

                  type="button"

                  className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-sky-400"

                  onClick={() => setInput((prev) => ({ ...prev, categoryId: suggestion }))}

                >

                  {suggestion}

                </button>

              ))}

            </div>

          ) : null}



          <label className="grid gap-1">

            <span className="text-xs text-slate-400">Category</span>

            <select

              className="min-h-11 rounded-xl border border-slate-600 bg-neutral-950 px-3 py-2 outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/30"

              value={input.categoryId}

              onChange={(e) => setInput((prev) => ({ ...prev, categoryId: e.target.value }))}

            >

              {categoryOptions.map((category) => (

                <option key={category} value={category}>

                  {category}

                </option>

              ))}

            </select>

          </label>



          {goals.length > 0 ? (

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">

              <p className="text-xs font-medium text-emerald-300">Also add to a savings goal</p>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">

                <select

                  className="min-h-11 rounded-xl border border-slate-600 bg-neutral-950 px-3 py-2 text-sm outline-none focus-visible:border-emerald-400"

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

                className={`rounded-full border px-2 py-1 text-xs ${input.tags.includes(tag) ? "border-sky-400 bg-sky-500/20 text-sky-200" : "border-slate-600 text-slate-300"}`}

                onClick={() => toggleTag(tag)}

              >

                {tag}

              </button>

            ))}

          </div>



          <div className="rounded-xl border border-slate-700 bg-neutral-950/70 p-3">

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

                  className="rounded-lg border border-slate-600 bg-neutral-900 px-2 py-1 text-xs"

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

              <button type="button" className="text-xs text-slate-300 underline" onClick={() => setShowSplit((prev) => !prev)}>

                {showSplit ? "Hide split lines" : "Split transaction"}

              </button>

              {showSplit ? (

                <div className="mt-2 space-y-2">

                  {(input.splits ?? []).map((line) => (

                    <div key={line.id} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">

                      <input

                        className="rounded-lg border border-slate-600 bg-neutral-900 px-2 py-1 text-sm"

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

                    className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs"

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



          {message ? <p className="text-xs text-slate-300">{message}</p> : null}

          <div className="flex justify-end gap-2 pb-safe">

            <button

              type="button"

              className="min-h-11 rounded-xl border border-slate-600 px-4 py-2 text-sm touch-manipulation"

              onClick={() => onOpenChange(false)}

            >

              Cancel

            </button>

            <button

              type="button"

              disabled={!canSave || saving}

              className="min-h-11 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 touch-manipulation disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"

              onClick={async () => {

                setSaving(true);

                const payload: TransactionInput = {

                  ...input,

                  currency: txCurrency,

                  receipts,

                };

                if (!navigator.onLine) {
                  saveOfflineDraft(payload);
                  setSaving(false);
                  toast.success("Saved offline — will sync when you're back online");
                  onOpenChange(false);
                  return;
                }

                const result = onSubmit ? await onSubmit(payload) : await createTransaction(payload);

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

                    categoryId: categoryOptions[0] ?? "",

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

              {saving ? "Saving..." : "Save transaction"}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}

