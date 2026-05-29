"use client";

import { useMemo, useState } from "react";
import { categoriesForSelect } from "@/lib/categories";
import type { Category, Debt } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageChrome";
import { formatMoney } from "@/lib/format-money";
import { useMounted } from "@/components/use-mounted";
import { useBudgetStore } from "@/store/useBudgetStore";

export function DebtsClient() {
  const mounted = useMounted();
  const debts = useBudgetStore((s) => s.debts);
  const addDebt = useBudgetStore((s) => s.addDebt);
  const updateDebt = useBudgetStore((s) => s.updateDebt);
  const deleteDebt = useBudgetStore((s) => s.deleteDebt);
  const categories = useBudgetStore((s) => s.categories);

  const [name, setName] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [originalBalance, setOriginalBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setCurrentBalance("");
    setMonthlyPayment("");
    setOriginalBalance("");
    setNotes("");
    setEditingId(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const bal = parseFloat(currentBalance);
    const pay = parseFloat(monthlyPayment);
    const orig = parseFloat(originalBalance);
    if (!name.trim() || Number.isNaN(bal) || Number.isNaN(pay)) return;

    const payload = {
      name: name.trim(),
      currentBalance: Math.max(0, bal),
      monthlyPayment: Math.max(0, pay),
      originalBalance:
        !Number.isNaN(orig) && orig > 0 ? orig : undefined,
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      updateDebt(editingId, payload);
    } else {
      addDebt(payload);
    }
    resetForm();
  }

  if (!mounted) {
    return (
      <div className="surface-card animate-pulse p-12 text-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  const totalOwed = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Liabilities"
        title="Debts"
        description="Track balances and monthly payments. Update balances when you pay down principal."
      />

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="surface-card p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Total owed
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(totalOwed)}
          </p>
        </div>
        <div className="surface-card p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Monthly payments (sum)
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(totalMonthly)}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="surface-card p-6 sm:p-8">
        <h2 className="mb-5 type-form-title">
          {editingId ? "Edit debt" : "Add debt"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Car loan"
              className="field w-full"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Current balance</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              className="field w-full tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Monthly payment</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              className="field w-full tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">
              Original balance (optional — for payoff bar)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={originalBalance}
              onChange={(e) => setOriginalBalance(e.target.value)}
              placeholder="Leave blank if unknown"
              className="field w-full tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="field resize-y w-full"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">
            {editingId ? "Save" : "Add debt"}
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

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        {debts.length === 0 ? (
          <p className="surface-card border-dashed border-[var(--border-subtle)] p-12 text-center leading-relaxed text-[var(--muted)] lg:col-span-2">
            No debts recorded yet.
          </p>
        ) : (
          debts.map((d) => {
            const orig =
              d.originalBalance && d.originalBalance > 0
                ? d.originalBalance
                : null;
            const paidPct =
              orig !== null
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      ((orig - d.currentBalance) / orig) * 100
                    )
                  )
                : null;
            return (
              <article key={d.id} className="surface-card flex flex-col p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{d.name}</h3>
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      className="text-[var(--accent)] hover:underline"
                      onClick={() => {
                        setEditingId(d.id);
                        setName(d.name);
                        setCurrentBalance(String(d.currentBalance));
                        setMonthlyPayment(String(d.monthlyPayment));
                        setOriginalBalance(
                          d.originalBalance != null
                            ? String(d.originalBalance)
                            : ""
                        );
                        setNotes(d.notes ?? "");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-negative hover:underline"
                      onClick={() => deleteDebt(d.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--muted)]">Balance</dt>
                    <dd className="figure font-mono font-semibold">
                      {formatMoney(d.currentBalance)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--muted)]">Monthly payment</dt>
                    <dd className="figure font-mono font-semibold">
                      {formatMoney(d.monthlyPayment)}
                    </dd>
                  </div>
                </dl>
                <DebtPaymentForm debt={d} categories={categories} />
                {paidPct !== null && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                      <span>Payoff progress</span>
                      <span>{paidPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                      <div
                        className="h-full rounded-full bg-[var(--positive)] transition-all"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>
                )}
                {d.notes && (
                  <p className="mt-3 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
                    {d.notes}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function DebtPaymentForm({
  debt,
  categories,
}: {
  debt: Debt;
  categories: Category[];
}) {
  const applyDebtPayment = useBudgetStore((s) => s.applyDebtPayment);
  const expenseSelect = useMemo(
    () => categoriesForSelect(categories, "expense"),
    [categories]
  );
  const expenseCategoryIds = useMemo(
    () => [
      ...expenseSelect.standalone.map((c) => c.id),
      ...expenseSelect.groups.flatMap((g) => g.children.map((c) => c.id)),
    ],
    [expenseSelect]
  );
  const [amount, setAmount] = useState("");
  const [logExpense, setLogExpense] = useState(true);
  const [expCategoryId, setExpCategoryId] = useState("");
  const fallbackExpCategoryId = expenseCategoryIds.includes("cat-debt")
    ? "cat-debt"
    : (expenseCategoryIds[0] ?? "");
  const selectedExpCategoryId =
    expCategoryId && expenseCategoryIds.includes(expCategoryId)
      ? expCategoryId
      : fallbackExpCategoryId;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) return;
    applyDebtPayment(debt.id, n, {
      logExpense,
      categoryId: logExpense ? selectedExpCategoryId || null : null,
    });
    setAmount("");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-5 border-t border-[var(--border-subtle)] pt-5"
    >
      <p className="type-caption">
        Record payment
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Lowers this balance. Optionally add a matching expense so reports stay
        aligned.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--muted)]">Amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="field w-36 tabular-nums"
          />
        </label>
        <button type="submit" className="btn-primary py-2 text-[13px]">
          Apply
        </button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={logExpense}
          onChange={(e) => setLogExpense(e.target.checked)}
          className="size-4 rounded border-[var(--border-subtle)]"
        />
        Also log expense transaction (today)
      </label>
      {logExpense ? (
        <label className="mt-2 flex max-w-xs flex-col gap-1 text-sm">
          <span className="text-[var(--muted)]">Expense category</span>
          <select
            value={selectedExpCategoryId}
            onChange={(e) => setExpCategoryId(e.target.value)}
            className="field w-full"
          >
            <option value="">Uncategorized</option>
            {expenseSelect.groups.map((g) => (
              <optgroup key={g.parent.id} label={g.parent.name}>
                {g.children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
            {expenseSelect.standalone.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </form>
  );
}
