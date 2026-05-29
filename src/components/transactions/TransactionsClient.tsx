"use client";

import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageChrome";
import {
  type TransactionDatePreset,
  filterTransactions,
} from "@/lib/filter-transactions";
import { formatMoney } from "@/lib/format-money";
import { getPeriodBounds } from "@/lib/period";
import { CategoryFilterSelectOptions } from "@/components/categories/CategoryFilterSelectOptions";
import { CategorySelectOptions } from "@/components/categories/CategorySelectOptions";
import {
  categoryFullName,
  isAssignableCategory,
} from "@/lib/categories";
import { downloadTextFile, transactionsToCsv } from "@/lib/csv-export";
import { useMounted } from "@/components/use-mounted";
import { useBudgetStore } from "@/store/useBudgetStore";
import type { Transaction, TransactionType } from "@/lib/types";

export function TransactionsClient() {
  const mounted = useMounted();
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);
  const settings = useBudgetStore((s) => s.settings);
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [categoryScope, setCategoryScope] = useState<
    "all" | "uncategorized" | string
  >("all");
  const [datePreset, setDatePreset] =
    useState<TransactionDatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const effectiveCategoryScope = useMemo(() => {
    if (categoryScope === "all" || categoryScope === "uncategorized") {
      return categoryScope;
    }
    const c = categories.find((x) => x.id === categoryScope);
    if (!c) return "all";
    if (filterType !== "all" && c.kind !== filterType) return "all";
    return categoryScope;
  }, [categoryScope, filterType, categories]);

  const budgetPeriodBounds = useMemo(
    () => getPeriodBounds(settings),
    [settings]
  );

  const categoryNames = useMemo(
    () =>
      Object.fromEntries(
        categories.map((c) => [c.id, categoryFullName(categories, c.id)])
      ),
    [categories]
  );

  const filtered = useMemo(() => {
    const base = filterTransactions(transactions, {
      search,
      type: filterType,
      categoryScope: effectiveCategoryScope,
      datePreset,
      customFrom,
      customTo,
      budgetPeriodBounds:
        datePreset === "budget-period" ? budgetPeriodBounds : null,
      categories,
    });
    return [...base].sort((a, b) => {
      const ta = parseISO(a.date).getTime();
      const tb = parseISO(b.date).getTime();
      return sortDesc ? tb - ta : ta - tb;
    });
  }, [
    transactions,
    search,
    filterType,
    effectiveCategoryScope,
    datePreset,
    customFrom,
    customTo,
    budgetPeriodBounds,
    categories,
    sortDesc,
  ]);

  const filterSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return {
      count: filtered.length,
      income,
      expense,
      net: income - expense,
    };
  }, [filtered]);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  function resetForm() {
    setDescription("");
    setAmount("");
    setType("expense");
    setCategoryId("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setEditingId(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!description.trim() || Number.isNaN(n) || n <= 0) return;

    if (editingId) {
      updateTransaction(editingId, {
        description: description.trim(),
        amount: n,
        type,
        categoryId: categoryId || null,
        date,
      });
      resetForm();
      return;
    }

    addTransaction({
      description: description.trim(),
      amount: n,
      type,
      categoryId: categoryId || null,
      date,
    });
    resetForm();
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id);
    setDescription(t.description);
    setAmount(String(t.amount));
    setType(t.type);
    const cat = t.categoryId
      ? categories.find((c) => c.id === t.categoryId)
      : null;
    setCategoryId(
      cat &&
        cat.kind === t.type &&
        isAssignableCategory(categories, cat)
        ? t.categoryId!
        : ""
    );
    setDate(t.date);
  }

  function exportCsv() {
    const csv = transactionsToCsv(filtered, categoryNames);
    downloadTextFile(
      `ryan-budget-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
  }

  if (!mounted) {
    return (
      <div className="surface-card animate-pulse p-12 text-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        description="Log income and expenses, filter and export your ledger, and keep the dashboard accurate."
      />

      <form onSubmit={submit} className="surface-card p-6 sm:p-8">
        <h2 className="mb-5 type-form-title">
          {editingId ? "Edit transaction" : "Add transaction"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Description</span>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field w-full"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Amount</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field w-full tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Type</span>
            <select
              value={type}
              onChange={(e) => {
                const next = e.target.value as TransactionType;
                setType(next);
                setCategoryId((prev) => {
                  const c = categories.find((x) => x.id === prev);
                  const ok =
                    c &&
                    c.kind === next &&
                    isAssignableCategory(categories, c);
                  return ok ? prev : "";
                });
              }}
              className="field w-full"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Date</span>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field w-full"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="field w-full max-w-md"
            >
              <option value="">Uncategorized</option>
              <CategorySelectOptions categories={categories} kind={type} />
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">
            {editingId ? "Save changes" : "Add transaction"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="surface-card space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersExpanded((v) => !v)}
              aria-expanded={filtersExpanded}
              className="flex items-center gap-2 rounded-lg text-left transition hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <span
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[11px] text-[var(--muted)]"
                aria-hidden
              >
                {filtersExpanded ? "▾" : "▸"}
              </span>
              <h2 className="type-form-title">
                Filter & export
              </h2>
            </button>
            {!filtersExpanded ? (
              <span className="text-xs tabular-nums text-[var(--muted)]">
                {filterSummary.count} row{filterSummary.count === 1 ? "" : "s"}{" "}
                · net {formatMoney(filterSummary.net)}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-secondary shrink-0 py-2 text-[13px]"
            disabled={filtered.length === 0}
            onClick={exportCsv}
          >
            Export CSV ({filtered.length})
          </button>
        </div>

        {filtersExpanded ? (
          <>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm lg:col-span-2">
            <span className="text-[var(--muted)]">Search description</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. groceries"
              className="field w-full"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Type</span>
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as "all" | TransactionType)
              }
              className="field w-full"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Category</span>
            <select
              value={categoryScope}
              onChange={(e) => setCategoryScope(e.target.value)}
              className="field w-full"
            >
              <option value="all">All categories</option>
              <option value="uncategorized">Uncategorized only</option>
              <CategoryFilterSelectOptions
                categories={categories}
                filterType={filterType}
              />
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm lg:col-span-2">
            <span className="text-[var(--muted)]">Date range</span>
            <select
              value={datePreset}
              onChange={(e) =>
                setDatePreset(e.target.value as TransactionDatePreset)
              }
              className="field w-full"
            >
              <option value="all">All time</option>
              <option value="budget-period">
                Current budget period ({budgetPeriodBounds.label})
              </option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="ytd">Year to date</option>
              <option value="custom">Custom…</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Sort by date</span>
            <select
              value={sortDesc ? "desc" : "asc"}
              onChange={(e) => setSortDesc(e.target.value === "desc")}
              className="field w-full"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>
        </div>

        {datePreset === "custom" && (
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="field w-full"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">To</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="field w-full"
              />
            </label>
          </div>
        )}

        <div className="grid gap-3 rounded-[var(--radius-field)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Rows
            </p>
            <p className="figure mt-1 font-mono text-lg font-bold">
              {filterSummary.count}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Income
            </p>
            <p className="figure mt-1 font-mono text-lg font-bold text-positive">
              {formatMoney(filterSummary.income)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Expenses
            </p>
            <p className="figure mt-1 font-mono text-lg font-bold">
              {formatMoney(filterSummary.expense)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Net
            </p>
            <p
              className={`figure mt-1 font-mono text-lg font-bold ${
                filterSummary.net >= 0 ? "text-positive" : "text-negative"
              }`}
            >
              {formatMoney(filterSummary.net)}
            </p>
          </div>
        </div>
          </>
        ) : null}
      </section>

      <div className="data-shell overflow-x-auto">
        <table className="data-table w-full min-w-[640px] text-left text-[13px]">
          <thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
            <tr>
              <th className="px-5 py-3.5 type-table-head">
                Date
              </th>
              <th className="px-5 py-3.5 type-table-head">
                Description
              </th>
              <th className="px-5 py-3.5 type-table-head">
                Category
              </th>
              <th className="px-5 py-3.5 type-table-head">
                Type
              </th>
              <th className="px-5 py-3.5 text-right type-table-head">
                Amount
              </th>
              <th className="px-5 py-3.5 text-right type-table-head">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-14 text-center text-[var(--muted)]"
                >
                  No transactions yet.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-14 text-center text-[var(--muted)]"
                >
                  No rows match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="figure px-5 py-3.5 font-mono text-[var(--muted)]">
                    {t.date}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[var(--foreground)]">
                    {t.description}
                  </td>
                  <td className="px-5 py-3.5">
                    {t.categoryId ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full shadow-sm ring-2 ring-[var(--surface)]"
                          style={{
                            backgroundColor:
                              catMap[t.categoryId]?.color ?? "#64748b",
                          }}
                        />
                        {categoryFullName(categories, t.categoryId) || "—"}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 capitalize text-[var(--muted)]">
                    {t.type}
                  </td>
                  <td
                    className={`figure px-5 py-3.5 text-right font-mono text-sm font-semibold ${
                      t.type === "income"
                        ? "text-positive"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(t.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="mr-3 text-[13px] font-semibold text-[var(--accent)] transition hover:brightness-125"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTransaction(t.id)}
                      className="text-[13px] font-semibold text-negative transition hover:brightness-125"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
