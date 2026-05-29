"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormField } from "@/components/planner/ui";
import type { Category, Paycheck, Transaction } from "@/lib/planner/types";

export type TransactionDraft = Omit<Transaction, "id" | "createdAt" | "updatedAt">;

export function AddTransactionModal({
  open,
  onOpenChange,
  paychecks,
  categories,
  accounts,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paychecks: Paycheck[];
  categories: Category[];
  accounts: string[];
  initial: TransactionDraft;
  onSave: (draft: TransactionDraft) => void;
}) {
  const [draft, setDraft] = useState<TransactionDraft>(initial);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setDraft(initial), 0);
    return () => window.clearTimeout(id);
  }, [open, initial]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
      <motion.div
        className="planner-card w-full max-w-2xl p-5 sm:p-6"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
      >
        <h3 className="text-lg font-semibold">Transaction</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Capture spending quickly and keep your paycheck plan accurate.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FormField label="Transaction date">
            <input
              type="date"
              value={draft.date.toISOString().slice(0, 10)}
              onChange={(e) => setDraft((s) => ({ ...s, date: new Date(e.target.value) }))}
              className="planner-input"
            />
          </FormField>
          <FormField label="Description">
            <input
              value={draft.description}
              onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))}
              className="planner-input"
            />
          </FormField>
          <FormField label="Amount">
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.amount === 0 ? "" : draft.amount / 100}
              onChange={(e) => setDraft((s) => ({ ...s, amount: Math.round(Number(e.target.value || 0) * 100) }))}
              className="planner-input"
            />
          </FormField>
          <FormField label="Type">
            <select
              value={draft.type}
              onChange={(e) => setDraft((s) => ({ ...s, type: e.target.value as Transaction["type"] }))}
              className="planner-input"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </FormField>
          <FormField label="Category">
            <select
              value={draft.categoryId ?? ""}
              onChange={(e) => setDraft((s) => ({ ...s, categoryId: e.target.value || undefined }))}
              className="planner-input"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Paycheck">
            <select
              value={draft.paycheckId}
              onChange={(e) => setDraft((s) => ({ ...s, paycheckId: e.target.value }))}
              className="planner-input"
            >
              {paychecks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Account">
            <select
              value={draft.account ?? ""}
              onChange={(e) => setDraft((s) => ({ ...s, account: e.target.value }))}
              className="planner-input"
            >
              {accounts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <textarea
              value={draft.notes ?? ""}
              onChange={(e) => setDraft((s) => ({ ...s, notes: e.target.value }))}
              className="planner-input min-h-[5.25rem]"
            />
          </FormField>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm hover:bg-[var(--surface-hover)]" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:brightness-105"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Save transaction
          </button>
        </div>
      </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
