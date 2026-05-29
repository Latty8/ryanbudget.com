"use client";

import { useMemo, useState } from "react";
import { CategorySelectOptions } from "@/components/categories/CategorySelectOptions";
import { categoriesForSelect } from "@/lib/categories";
import type { Category, SavingsVault } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageChrome";
import { formatMoney } from "@/lib/format-money";
import { useMounted } from "@/components/use-mounted";
import { useBudgetStore } from "@/store/useBudgetStore";

export function VaultsClient() {
  const mounted = useMounted();
  const vaults = useBudgetStore((s) => s.vaults);
  const addVault = useBudgetStore((s) => s.addVault);
  const updateVault = useBudgetStore((s) => s.updateVault);
  const deleteVault = useBudgetStore((s) => s.deleteVault);
  const categories = useBudgetStore((s) => s.categories);

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setBalance("");
    setTargetAmount("");
    setTargetDate("");
    setNotes("");
    setEditingId(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const bal = parseFloat(balance);
    const tgt = parseFloat(targetAmount);
    if (!name.trim() || Number.isNaN(bal) || bal < 0) return;

    const payload = {
      name: name.trim(),
      balance: bal,
      targetAmount:
        !Number.isNaN(tgt) && tgt > 0 ? tgt : undefined,
      targetDate: targetDate.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      updateVault(editingId, payload);
    } else {
      addVault(payload);
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

  const totalSaved = vaults.reduce((s, v) => s + v.balance, 0);
  const totalTargets = vaults.reduce(
    (s, v) => s + (v.targetAmount && v.targetAmount > 0 ? v.targetAmount : 0),
    0
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Goals"
        title="Savings vaults"
        description="Set aside money for goals or sinking funds. Deposits and withdrawals can optionally write matching ledger lines so cash flow stays accurate."
      />

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="surface-card p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Total in vaults
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-positive">
            {formatMoney(totalSaved)}
          </p>
        </div>
        <div className="surface-card p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Combined targets
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {totalTargets > 0 ? formatMoney(totalTargets) : "—"}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="surface-card p-6 sm:p-8">
        <h2 className="mb-5 type-form-title">
          {editingId ? "Edit vault" : "New vault"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency fund, Vacation"
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
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="field w-full tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Savings target (optional)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Goal amount"
              className="field w-full tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Target date (optional)</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="field w-full max-w-xs"
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
            {editingId ? "Save" : "Add vault"}
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
        {vaults.length === 0 ? (
          <p className="surface-card border-dashed border-[var(--border-subtle)] p-12 text-center leading-relaxed text-[var(--muted)] lg:col-span-2">
            No vaults yet. Create one to track savings goals or sinking funds.
          </p>
        ) : (
          vaults.map((v) => {
            const tgt =
              v.targetAmount && v.targetAmount > 0 ? v.targetAmount : null;
            const goalPct =
              tgt !== null
                ? Math.min(100, Math.max(0, (v.balance / tgt) * 100))
                : null;
            return (
              <article
                key={v.id}
                className="surface-card flex flex-col p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{v.name}</h3>
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      className="text-[var(--accent)] hover:underline"
                      onClick={() => {
                        setEditingId(v.id);
                        setName(v.name);
                        setBalance(String(v.balance));
                        setTargetAmount(
                          v.targetAmount != null && v.targetAmount > 0
                            ? String(v.targetAmount)
                            : ""
                        );
                        setTargetDate(v.targetDate ?? "");
                        setNotes(v.notes ?? "");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-negative hover:underline"
                      onClick={() => deleteVault(v.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--muted)]">Balance</dt>
                    <dd className="figure font-mono font-semibold text-positive">
                      {formatMoney(v.balance)}
                    </dd>
                  </div>
                  {tgt !== null && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--muted)]">Target</dt>
                      <dd className="figure font-mono font-semibold">
                        {formatMoney(tgt)}
                        {v.targetDate ? (
                          <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                            by {v.targetDate}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  )}
                </dl>
                {goalPct !== null && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                      <span>Progress to goal</span>
                      <span>{goalPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${goalPct}%` }}
                      />
                    </div>
                  </div>
                )}
                <VaultDepositForm vault={v} categories={categories} />
                <VaultWithdrawForm vault={v} categories={categories} />
                {v.notes && (
                  <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-sm text-[var(--muted)]">
                    {v.notes}
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

function VaultDepositForm({
  vault,
  categories,
}: {
  vault: SavingsVault;
  categories: Category[];
}) {
  const vaultDeposit = useBudgetStore((s) => s.vaultDeposit);
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
  const fallbackExpCategoryId = expenseCategoryIds.includes("cat-other")
    ? "cat-other"
    : (expenseCategoryIds[0] ?? "");
  const selectedExpCategoryId =
    expCategoryId && expenseCategoryIds.includes(expCategoryId)
      ? expCategoryId
      : fallbackExpCategoryId;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) return;
    vaultDeposit(vault.id, n, {
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
        Deposit
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Adds to this vault. Optionally log an expense if those dollars left your
        budget / checking.
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
          Add
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
            <CategorySelectOptions categories={categories} kind="expense" />
          </select>
        </label>
      ) : null}
    </form>
  );
}

function VaultWithdrawForm({
  vault,
  categories,
}: {
  vault: SavingsVault;
  categories: Category[];
}) {
  const vaultWithdraw = useBudgetStore((s) => s.vaultWithdraw);
  const incomeSelect = useMemo(
    () => categoriesForSelect(categories, "income"),
    [categories]
  );
  const incomeCategoryIds = useMemo(
    () => [
      ...incomeSelect.standalone.map((c) => c.id),
      ...incomeSelect.groups.flatMap((g) => g.children.map((c) => c.id)),
    ],
    [incomeSelect]
  );
  const [amount, setAmount] = useState("");
  const [logIncome, setLogIncome] = useState(false);
  const [incCategoryId, setIncCategoryId] = useState("");
  const fallbackIncCategoryId = incomeCategoryIds.includes("cat-salary")
    ? "cat-salary"
    : (incomeCategoryIds[0] ?? "");
  const selectedIncCategoryId =
    incCategoryId && incomeCategoryIds.includes(incCategoryId)
      ? incCategoryId
      : fallbackIncCategoryId;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) return;
    vaultWithdraw(vault.id, n, {
      logIncome,
      categoryId: logIncome ? selectedIncCategoryId || null : null,
    });
    setAmount("");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 border-t border-[var(--border-subtle)] pt-4"
    >
      <p className="type-caption">
        Withdraw
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Removes from this vault (won&apos;t go below zero). Optionally log
        income if you want the ledger to reflect money returning to budget.
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
        <button type="submit" className="btn-secondary py-2 text-[13px]">
          Withdraw
        </button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={logIncome}
          onChange={(e) => setLogIncome(e.target.checked)}
          className="size-4 rounded border-[var(--border-subtle)]"
        />
        Also log income transaction (today)
      </label>
      {logIncome ? (
        <label className="mt-2 flex max-w-xs flex-col gap-1 text-sm">
          <span className="text-[var(--muted)]">Income category</span>
          <select
            value={selectedIncCategoryId}
            onChange={(e) => setIncCategoryId(e.target.value)}
            className="field w-full"
          >
            <option value="">Uncategorized</option>
            <CategorySelectOptions categories={categories} kind="income" />
          </select>
        </label>
      ) : null}
    </form>
  );
}
