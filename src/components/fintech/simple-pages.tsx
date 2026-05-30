"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import { addDays, addMonths, addWeeks, format, isAfter, isBefore, parseISO, startOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import { useSaveTransaction } from "@/hooks/use-save-transaction";
import { getTransactions } from "@/lib/supabase/queries/transactions";
import { NumberField } from "@/components/fintech/number-field";
import { SwipeTransactionRow } from "@/components/fintech/swipe-transaction-row";
import { TransactionEntryModal } from "@/components/fintech/transaction-entry-modal";
import { ShareBudgetLink } from "@/components/fintech/share-budget-link";
import { VirtualTransactionList } from "@/components/fintech/virtual-transaction-list";
import { EmptyState, PageFrame, Skeleton, useShellTheme } from "@/components/fintech/ui";
import { useTranslations } from "@/components/providers/i18n-provider";
import { useHouseholdAccess } from "@/hooks/use-household-access";
import { useFintechTheme } from "@/components/fintech/theme";
import { demoAccounts, demoBudgets, demoRecurring } from "@/lib/demo/sample-data";
import { projectRecurringRuns } from "@/lib/recurring/project-runs";
import { buildOptimisticTransaction, rollbackTransactions } from "@/lib/transactions/optimistic";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useAppDataStore, formatMoneyWithSource } from "@/store/useAppDataStore";
import type { RecurringFrequency, TransactionInput, TransactionRecord } from "@/types/finance";
import { ReceiptThumbnails } from "@/components/fintech/receipt-thumbnails";

function mapStoreTransactions(rows: ReturnType<typeof useAppDataStore.getState>["demoTransactions"]): TransactionRecord[] {
  return rows.map((t) => ({
    id: t.id,
    amount: t.amount,
    date: t.date,
    description: t.merchant,
    category: t.category,
    account: t.account,
    currency: t.currency,
    tags: [],
    recurring: t.recurring,
    receipts: t.receipts,
  }));
}

const PAGE_SIZE = 12;
const VIRTUAL_THRESHOLD = 30;

export function TransactionsView() {
  const confirm = useConfirm();
  const { t } = useTranslations();
  const { canEdit, isViewer } = useHouseholdAccess();
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<"this-month" | "last-month" | "income" | "expenses" | "recurring" | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryForBulk, setCategoryForBulk] = useState(demoBudgets[0]?.category ?? "General");
  const [openQuickAdd, setOpenQuickAdd] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const saveTransaction = useSaveTransaction();
  const storeTransactions = useAppDataStore((s) => s.demoTransactions);
  const storeAccounts = useAppDataStore((s) => s.accounts);
  const primaryCurrency = useAppDataStore((s) => s.preferences.currency);
  const { data: remoteData, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(),
    enabled: hasSupabaseDataSync,
  });
  const data = useMemo(
    () => (hasSupabaseDataSync ? remoteData : mapStoreTransactions(storeTransactions)),
    [remoteData, storeTransactions]
  );

  const createMutation = useMutation({
    mutationFn: (input: TransactionInput) => saveTransaction(input),
    onMutate: async (input) => {
      if (!hasSupabaseDataSync) return undefined;
      await queryClient.cancelQueries({ queryKey: ["transactions"] });
      const previous = queryClient.getQueryData<TransactionRecord[]>(["transactions"]) ?? [];
      const optimisticRow = buildOptimisticTransaction(
        input,
        storeAccounts.find((a) => a.id === input.accountId)?.name ?? "Manual"
      );
      queryClient.setQueryData<TransactionRecord[]>(["transactions"], [optimisticRow, ...previous]);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous) return;
      rollbackTransactions(context.previous, (rows) =>
        queryClient.setQueryData(["transactions"], rows)
      );
    },
    onSettled: async () => {
      if (hasSupabaseDataSync) {
        await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
    },
  });

  const filteredRows = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const thisMonthEnd = startOfMonth(addMonths(now, 1));
    return (data ?? []).filter((row) => {
      const descriptionMatch =
        row.description.toLowerCase().includes(query.toLowerCase()) ||
        row.category.toLowerCase().includes(query.toLowerCase()) ||
        row.account.toLowerCase().includes(query.toLowerCase());
      if (!descriptionMatch) return false;
      const rowDate = parseISO(row.date);
      if (quickFilter === "income") return row.amount > 0;
      if (quickFilter === "expenses") return row.amount < 0;
      if (quickFilter === "recurring") return row.recurring;
      if (quickFilter === "this-month") return !isBefore(rowDate, thisMonthStart) && isBefore(rowDate, thisMonthEnd);
      if (quickFilter === "last-month") return !isBefore(rowDate, lastMonthStart) && isBefore(rowDate, thisMonthStart);
      return true;
    });
  }, [data, query, quickFilter]);

  const useVirtualList = filteredRows.length > VIRTUAL_THRESHOLD;
  const paginatedRows = useMemo(
    () => (useVirtualList ? filteredRows : filteredRows.slice(0, page * PAGE_SIZE)),
    [filteredRows, page, useVirtualList]
  );
  const hasMore = !useVirtualList && paginatedRows.length < filteredRows.length;

  const renderTransactionRow = (row: TransactionRecord) => (
    <>
      {canEdit ? (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelection(row.id)}
          aria-label={`Select ${row.description}`}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{row.description}</p>
        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          {row.date} · {row.category} · {row.account} {row.recurring ? "· recurring" : ""}
          {row.currency && row.currency !== primaryCurrency ? ` · ${row.currency}` : ""}
        </p>
        <ReceiptThumbnails receipts={row.receipts} />
      </div>
      <p className={cn("shrink-0 text-right text-sm", row.amount < 0 ? "text-rose-300" : "text-emerald-300")}>
        {formatMoneyWithSource(Math.abs(row.amount) * (row.amount < 0 ? -1 : 1), primaryCurrency, row.currency)}
      </p>
    </>
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setOpenQuickAdd(true);
      }
    };

    const onPlannerQuickAdd = () => setOpenQuickAdd(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("planner:new-transaction", onPlannerQuickAdd);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("planner:new-transaction", onPlannerQuickAdd);
    };
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    await confirm({
      title: `Delete ${count} transaction${count === 1 ? "" : "s"}?`,
      description: "Selected transactions will be permanently removed from your ledger.",
      warning: "This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: () => {
        queryClient.setQueryData<TransactionRecord[]>(["transactions"], (prev = []) =>
          prev.filter((row) => !selectedIds.includes(row.id))
        );
        useAppDataStore.setState((state) => ({
          demoTransactions: state.demoTransactions.filter((row) => !selectedIds.includes(row.id)),
        }));
        setSelectedIds([]);
        toast.success(`${count} transaction${count === 1 ? "" : "s"} deleted`);
      },
    });
  };

  const deleteOne = async (id: string) => {
    const row = data?.find((r) => r.id === id);
    await confirm({
      title: "Delete this transaction?",
      description: row
        ? `"${row.description}" on ${row.date} will be removed.`
        : "This transaction will be permanently removed.",
      warning: "This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: () => {
        queryClient.setQueryData<TransactionRecord[]>(["transactions"], (prev = []) =>
          prev.filter((r) => r.id !== id)
        );
        useAppDataStore.setState((state) => ({
          demoTransactions: state.demoTransactions.filter((r) => r.id !== id),
        }));
        setSelectedIds((prev) => prev.filter((value) => value !== id));
        toast.success("Transaction deleted");
      },
    });
  };

  const categorizeSelected = () => {
    if (selectedIds.length === 0) return;
    queryClient.setQueryData<TransactionRecord[]>(["transactions"], (prev = []) =>
      prev.map((row) => (selectedIds.includes(row.id) ? { ...row, category: categoryForBulk } : row))
    );
    setSelectedIds([]);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSelectedIds([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [query, quickFilter]);

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("transactions.title")}</h1>
        {canEdit ? (
          <button
            className="hidden rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 md:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={() => setOpenQuickAdd(true)}
          >
            {t("transactions.add")}
          </button>
        ) : null}
      </div>

      <div className={`space-y-3 rounded-2xl border p-3 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
        <label className="relative block">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? "text-slate-500" : "text-slate-500"}`} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by description, account, or category (Ctrl+K)"
            className={`w-full rounded-xl border px-9 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-600 bg-neutral-900 text-slate-100"}`}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["this-month", "This month"],
            ["last-month", "Last month"],
            ["income", "Income only"],
            ["expenses", "Expenses only"],
            ["recurring", "Recurring"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs",
                quickFilter === key
                  ? "border-sky-400 bg-sky-500/20 text-sky-200"
                  : isLight
                  ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                  : "border-slate-600 text-slate-300 hover:bg-neutral-900"
              )}
              onClick={() => setQuickFilter(key as typeof quickFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryForBulk}
              onChange={(event) => setCategoryForBulk(event.target.value)}
              className={cn("rounded-lg border px-2 py-1 text-xs", isLight ? "border-slate-300 bg-white" : "border-slate-600 bg-neutral-900")}
            >
              {demoBudgets.map((budget) => (
                <option key={budget.category} value={budget.category}>
                  {budget.category}
                </option>
              ))}
            </select>
            <button className="rounded-lg border border-slate-600 px-2 py-1 text-xs" onClick={categorizeSelected}>
              Categorize selected
            </button>
            <button
              className="rounded-lg border border-rose-500/40 px-2 py-1 text-xs text-rose-300"
              onClick={() => void deleteSelected()}
            >
              {t("transactions.deleteSelected")}
            </button>
            <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{selectedIds.length} selected</span>
          </div>
        ) : isViewer ? (
          <p className="text-xs text-amber-400/90">{t("household.viewerReadOnly")}</p>
        ) : null}
      </div>

      <div className={`rounded-2xl border ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
        {isLoading ? (
          <div className="space-y-0 p-2" aria-busy="true" aria-label={t("common.loading")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-slate-700/40 px-3 py-4">
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : null}
        {!isLoading && paginatedRows.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={t("transactions.empty")}
            description="Try a different filter, or add your first transaction. Tip: use natural language like “$45 coffee at Starbucks”."
            action={
              canEdit ? (
                <button
                  type="button"
                  className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  onClick={() => setOpenQuickAdd(true)}
                >
                  {t("transactions.add")}
                </button>
              ) : undefined
            }
          />
        ) : null}
        {!isLoading && useVirtualList ? (
          <VirtualTransactionList
            rows={paginatedRows}
            isLight={isLight}
            renderRow={(row) =>
              canEdit ? (
                <SwipeTransactionRow isLight={isLight} onDelete={() => void deleteOne(row.id)}>
                  {renderTransactionRow(row)}
                </SwipeTransactionRow>
              ) : (
                <div className="flex w-full items-center gap-3">{renderTransactionRow(row)}</div>
              )
            }
          />
        ) : null}
        {!isLoading && !useVirtualList
          ? paginatedRows.map((row) =>
              canEdit ? (
                <SwipeTransactionRow key={row.id} isLight={isLight} onDelete={() => void deleteOne(row.id)}>
                  {renderTransactionRow(row)}
                </SwipeTransactionRow>
              ) : (
                <div
                  key={row.id}
                  className={cn(
                    "flex items-center gap-3 border-b px-3 py-3",
                    isLight ? "border-slate-200" : "border-slate-700/60"
                  )}
                >
                  {renderTransactionRow(row)}
                </div>
              )
            )
          : null}
        {hasMore ? (
          <div className="p-3">
            <button className="w-full rounded-xl border border-slate-600 px-3 py-2 text-sm" onClick={() => setPage((value) => value + 1)}>
              {t("transactions.loadMore")}
            </button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <button
          type="button"
          aria-label={t("transactions.add")}
          className="fixed bottom-20 right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 md:hidden"
          onClick={() => setOpenQuickAdd(true)}
        >
          <Plus className="h-5 w-5" />
        </button>
      ) : null}
      {canEdit ? (
        <TransactionEntryModal open={openQuickAdd} onOpenChange={setOpenQuickAdd} onSubmit={createMutation.mutateAsync} />
      ) : null}
    </div>
  );
}

export function BudgetsView() {
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
  const [view, setView] = useState<"monthly" | "weekly">("monthly");
  const [rolloverEnabled, setRolloverEnabled] = useState(true);
  const [budgets, setBudgets] = useState(() =>
    demoBudgets.map((row) => ({ category: row.category, budgeted: row.budgeted, spent: row.spent }))
  );
  const [draftBudgets, setDraftBudgets] = useState<Record<string, number>>(() =>
    Object.fromEntries(budgets.map((b) => [b.category, b.budgeted]))
  );
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState(0);

  const rows = useMemo(
    () =>
      budgets.map((budget) => {
        const baseBudget = draftBudgets[budget.category] ?? budget.budgeted;
        const effectiveBudget = view === "weekly" ? baseBudget / 4 : baseBudget;
        const effectiveSpent = view === "weekly" ? budget.spent / 4 : budget.spent;
        const remaining = effectiveBudget - effectiveSpent;
        const pct = Math.min(100, (effectiveSpent / Math.max(effectiveBudget, 1)) * 100);
        return {
          ...budget,
          effectiveBudget,
          effectiveSpent,
          remaining,
          pct,
        };
      }),
    [budgets, draftBudgets, view]
  );

  const totalBudgeted = rows.reduce((sum, r) => sum + r.effectiveBudget, 0);
  const totalSpent = rows.reduce((sum, r) => sum + r.effectiveSpent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  const resetToSuggested = () => {
    setDraftBudgets(Object.fromEntries(budgets.map((b) => [b.category, b.budgeted])));
  };

  const applyRollover = () => {
    if (!rolloverEnabled) return;
    setDraftBudgets((prev) => {
      const next: Record<string, number> = {};
      for (const budget of budgets) {
        const base = prev[budget.category] ?? budget.budgeted;
        const remaining = base - budget.spent;
        next[budget.category] = Math.max(0, base + Math.max(0, remaining));
      }
      return next;
    });
  };

  const addCategory = () => {
    if (!newCategory.trim() || newBudget <= 0) return;
    if (budgets.some((budget) => budget.category.toLowerCase() === newCategory.trim().toLowerCase())) return;
    const next = [...budgets, { category: newCategory.trim(), budgeted: newBudget, spent: 0 }];
    setBudgets(next);
    setDraftBudgets(Object.fromEntries(next.map((budget) => [budget.category, budget.budgeted])));
    setNewCategory("");
    setNewBudget(0);
  };

  return (
    <PageFrame title="Budgets">
      <ShareBudgetLink />
      <div className="grid gap-3 md:grid-cols-3">
        <div className={`rounded-xl border p-3 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
          <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Budgeted ({view})</p>
          <p className="mt-1 text-xl font-semibold">${totalBudgeted.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
          <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Spent ({view})</p>
          <p className="mt-1 text-xl font-semibold">${totalSpent.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
          <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>Remaining ({view})</p>
          <p className={`mt-1 text-xl font-semibold ${totalRemaining < 0 ? "text-rose-400" : "text-emerald-400"}`}>${totalRemaining.toFixed(2)}</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-3 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-600 p-1">
            <button
              className={cn("rounded-lg px-3 py-1 text-sm", view === "monthly" ? "bg-sky-500 text-slate-950" : isLight ? "text-slate-700" : "text-slate-200")}
              onClick={() => setView("monthly")}
            >
              Monthly
            </button>
            <button
              className={cn("rounded-lg px-3 py-1 text-sm", view === "weekly" ? "bg-sky-500 text-slate-950" : isLight ? "text-slate-700" : "text-slate-200")}
              onClick={() => setView("weekly")}
            >
              Weekly
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rolloverEnabled} onChange={(e) => setRolloverEnabled(e.target.checked)} />
              Enable rollover
            </label>
            <button className="rounded-lg border border-slate-600 px-3 py-1 text-sm" onClick={applyRollover}>Apply rollover</button>
            <button className="rounded-lg border border-slate-600 px-3 py-1 text-sm" onClick={resetToSuggested}>Reset</button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="New budget category"
            className={cn("rounded-xl border px-3 py-2 text-sm outline-none", isLight ? "border-slate-300 bg-white" : "border-slate-600 bg-neutral-900")}
          />
          <NumberField
            value={newBudget}
            onChange={setNewBudget}
            placeholder="Budget"
            className={cn(isLight ? "" : "")}
          />
          <button className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950" onClick={addCategory}>
            Add category
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map((b) => {
          return (
            <div key={b.category} className={`rounded-xl border p-3 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{b.category}</span>
                <div className="flex items-center gap-2">
                  {view === "monthly" ? (
                    <NumberField
                      className={`w-28 px-2 py-1 text-sm ${isLight ? "" : ""}`}
                      value={draftBudgets[b.category] ?? b.budgeted}
                      onChange={(amount) => setDraftBudgets((prev) => ({ ...prev, [b.category]: amount }))}
                      aria-label={`Budget for ${b.category}`}
                    />
                  ) : null}
                  <span className="text-sm">${b.effectiveSpent.toFixed(2)} / ${b.effectiveBudget.toFixed(2)}</span>
                </div>
              </div>
              <div className={`h-2 rounded-full ${isLight ? "bg-slate-100" : "bg-neutral-900"}`}>
                <div className={cn("h-2 rounded-full", b.remaining < 0 ? "bg-rose-400" : b.pct > 85 ? "bg-amber-400" : "bg-sky-400")} style={{ width: `${b.pct}%` }} />
              </div>
              <p className={`mt-2 text-xs ${b.remaining < 0 ? "text-rose-400" : isLight ? "text-slate-500" : "text-slate-400"}`}>
                {b.remaining < 0 ? `Over by $${Math.abs(b.remaining).toFixed(2)}` : `$${b.remaining.toFixed(2)} remaining`}
              </p>
            </div>
          );
        })}
      </div>
    </PageFrame>
  );
}

export function AccountsView() {
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
  return (
    <PageFrame title="Accounts">
      <div className="grid gap-3 md:grid-cols-2">
        {demoAccounts.map((a) => (
          <div key={a.id} className={`rounded-xl border p-4 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-300"}`}>{a.name}</p>
            <p className="mt-1 text-xl font-semibold">${a.balance.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}

export function RecurringView() {
  const confirm = useConfirm();
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
  const [rules, setRules] = useState(
    demoRecurring.map((rule) => ({
      ...rule,
      cadence: rule.cadence as RecurringFrequency,
      account: demoAccounts[0]?.name ?? "Main Checking",
      category: demoBudgets[0]?.category ?? "General",
      active: true,
      endDate: "",
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    amount: 0,
    cadence: "monthly" as RecurringFrequency,
    nextDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    account: demoAccounts[0]?.name ?? "Main Checking",
    category: demoBudgets[0]?.category ?? "General",
    endDate: "",
  });

  const projectedRuns = useMemo(
    () =>
      projectRecurringRuns(
        rules.map((r) => ({
          id: r.id,
          name: r.name,
          amount: r.amount,
          cadence: r.cadence,
          nextDate: r.nextDate,
          active: r.active,
          endDate: r.endDate,
        }))
      ),
    [rules]
  );

  const saveRule = () => {
    if (!form.name.trim() || form.amount <= 0) return;
    if (editingId) {
      setRules((prev) => prev.map((rule) => (rule.id === editingId ? { ...rule, ...form } : rule)));
      setEditingId(null);
    } else {
      setRules((prev) => [...prev, { id: `rec-${Date.now()}`, ...form, active: true }]);
    }
    setForm({
      name: "",
      amount: 0,
      cadence: "monthly",
      nextDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      account: demoAccounts[0]?.name ?? "Main Checking",
      category: demoBudgets[0]?.category ?? "General",
      endDate: "",
    });
  };

  return (
    <PageFrame title="Recurring">
      <div className="grid gap-4 xl:grid-cols-5">
        <section className={`rounded-2xl border p-4 xl:col-span-3 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Recurring rules</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{rules.filter((r) => r.active).length} active</p>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className={isLight ? "text-slate-600" : "text-slate-400"}>Name</span>
              <input className={`rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white" : "border-slate-600 bg-neutral-900"}`} value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className={isLight ? "text-slate-600" : "text-slate-400"}>Amount</span>
              <NumberField
                className={isLight ? "" : ""}
                value={form.amount}
                onChange={(amount) => setForm((s) => ({ ...s, amount }))}
                aria-label="Recurring amount"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className={isLight ? "text-slate-600" : "text-slate-400"}>Frequency</span>
              <select className={`rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white" : "border-slate-600 bg-neutral-900"}`} value={form.cadence} onChange={(e) => setForm((s) => ({ ...s, cadence: e.target.value as RecurringFrequency }))}>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className={isLight ? "text-slate-600" : "text-slate-400"}>Next run</span>
              <input className={`rounded-xl border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-white" : "border-slate-600 bg-neutral-900"}`} type="date" value={form.nextDate} onChange={(e) => setForm((s) => ({ ...s, nextDate: e.target.value }))} />
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="inline-flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50" disabled={!form.name.trim() || form.amount <= 0} onClick={saveRule}>
              <Plus className="h-4 w-4" />
              {editingId ? "Save changes" : "Add recurring rule"}
            </button>
            {editingId ? (
              <button
                className="rounded-xl border border-slate-600 px-3 py-2 text-sm"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    amount: 0,
                    cadence: "monthly",
                    nextDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
                    account: demoAccounts[0]?.name ?? "Main Checking",
                    category: demoBudgets[0]?.category ?? "General",
                endDate: "",
                  });
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {rules.map((rule) => {
              const status = !rule.active ? "Paused" : rule.endDate && isBefore(parseISO(rule.endDate), new Date()) ? "Completed" : "Active";
              return (
              <div key={rule.id} className={`rounded-xl border p-3 text-sm ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-neutral-900"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{rule.cadence} · next {rule.nextDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${rule.amount.toFixed(2)}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px]", status === "Active" ? "bg-emerald-500/20 text-emerald-300" : status === "Paused" ? "bg-amber-500/20 text-amber-300" : "bg-slate-500/20 text-slate-300")}>{status}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button className="rounded-lg border border-slate-600 px-2 py-1 text-xs" onClick={() => { setEditingId(rule.id); setForm({ name: rule.name, amount: rule.amount, cadence: rule.cadence, nextDate: rule.nextDate, account: rule.account, category: rule.category, endDate: rule.endDate }); }}>Edit</button>
                  <button className="rounded-lg border border-slate-600 px-2 py-1 text-xs" onClick={() => setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)))}>{rule.active ? "Pause" : "Resume"}</button>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-2 py-1 text-xs text-rose-300"
                    onClick={() => {
                      void confirm({
                        title: `Delete "${rule.name}"?`,
                        description: "This recurring rule will stop generating future projections.",
                        warning: "Past scheduled instances in your ledger are not removed.",
                        confirmLabel: "Delete rule",
                        onConfirm: () => {
                          setRules((prev) => prev.filter((r) => r.id !== rule.id));
                          toast.success("Recurring rule deleted");
                        },
                      });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        <section className={`rounded-2xl border p-4 xl:col-span-2 ${isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4 text-sky-400" />
              Projection (next 5)
            </p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>${projectedRuns.reduce((sum, run) => sum + run.amount, 0).toFixed(2)} total</p>
          </div>
          <div className="space-y-2">
            {projectedRuns.map((run) => (
              <div key={run.id} className={`rounded-xl border p-2 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-neutral-900"}`}>
                <div className="flex justify-between text-sm">
                  <span>{run.name}</span>
                  <span className="font-medium">${run.amount.toFixed(2)}</span>
                </div>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{run.date} · {run.cadence}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}

