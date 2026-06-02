"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, ReceiptText, Search, Trash2 } from "lucide-react";
import { startOfMonth } from "date-fns";
import { TransactionEntryModal } from "@/components/fintech/transaction-entry-modal";
import {
  EmptyState,
  FilterChip,
  fintechForeground,
  fintechIconButton,
  fintechLabel,
  fintechMuted,
  fintechSurface,
  PageFrame,
  PrimaryButton,
} from "@/components/fintech/ui";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useDeleteTransaction, useTransactionSubmit } from "@/hooks/use-transaction-mutations";
import { usePageCloudSync } from "@/hooks/use-page-cloud-sync";
import { groupTransactionsByDate } from "@/lib/transactions/group-by-date";
import { cn } from "@/lib/utils";
import {
  formatTransactionAmountWithSource,
  transactionAmountClassName,
} from "@/lib/transactions/format-transaction-display";
import { useAppDataStore } from "@/store/useAppDataStore";
import type { TransactionRecord } from "@/types/finance";

function mapStoreTransactions(
  rows: ReturnType<typeof useAppDataStore.getState>["demoTransactions"]
): TransactionRecord[] {
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

export function TransactionsMinimalView() {
  usePageCloudSync();

  const confirm = useConfirm();
  const submitTransaction = useTransactionSubmit();
  const deleteTransaction = useDeleteTransaction();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "this-month" | "expenses" | "income">("all");
  const [editTransaction, setEditTransaction] = useState<TransactionRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [flashId, setFlashId] = useState<string | null>(null);

  const storeTransactions = useAppDataStore((s) => s.demoTransactions);
  const primaryCurrency = useAppDataStore((s) => s.preferences.currency);

  const data = useMemo(() => mapStoreTransactions(storeTransactions), [storeTransactions]);

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = query.trim().toLowerCase();
    const thisMonth = startOfMonth(new Date()).toISOString().slice(0, 7);
    return rows.filter((row) => {
      if (filter === "this-month" && !row.date.startsWith(thisMonth)) return false;
      if (filter === "expenses" && row.amount >= 0) return false;
      if (filter === "income" && row.amount < 0) return false;
      if (!q) return true;
      return (
        row.description.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.account.toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

  const groups = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const openEdit = (row: TransactionRecord) => {
    setEditTransaction(row);
    setModalOpen(true);
  };

  const handleDelete = (row: TransactionRecord) => {
    void confirm({
      title: "Delete this transaction?",
      description: `"${row.description}" will be permanently removed from your records.`,
      warning: "This action cannot be undone.",
      confirmLabel: "Delete transaction",
      variant: "destructive",
      onConfirm: async () => {
        await deleteTransaction(row.id);
      },
    });
  };

  const closeModal = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditTransaction(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("tx-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const handler = () => {
      const latest = useAppDataStore.getState().demoTransactions[0]?.id;
      if (!latest) return;
      setFlashId(latest);
      window.setTimeout(() => setFlashId(null), 1200);
    };
    window.addEventListener("planner:transaction-saved", handler);
    return () => window.removeEventListener("planner:transaction-saved", handler);
  }, []);

  const filters = [
    ["all", "All"],
    ["this-month", "This month"],
    ["expenses", "Expenses"],
    ["income", "Income"],
  ] as const;

  return (
    <PageFrame
      title="Transactions"
      description="Grouped by date · tap a row to edit"
    >
      <div className={cn(fintechSurface, "space-y-4 p-4 md:p-5")}>
        <label className="relative block">
          <Search
            className={cn(
              "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
              fintechMuted
            )}
            strokeWidth={1.75}
          />
          <input
            id="tx-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchants, categories…"
            className="min-h-11 w-full rounded-[var(--radius-field)] border border-[var(--border)] bg-[var(--surface-elevated)] py-3 pl-10 pr-3 text-base text-[var(--foreground)] shadow-[var(--shadow-inner)] outline-none transition-all placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)] sm:text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {filters.map(([key, label]) => (
            <FilterChip key={key} active={filter === key} onClick={() => setFilter(key)}>
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No transactions yet"
          description="Log spending and income as it happens — great for staying on track between paychecks."
          action={
            <PrimaryButton
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("planner:new-transaction"))}
            >
              Add transaction
            </PrimaryButton>
          }
        />
      ) : (
        <div className="space-y-8">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <motion.section
                key={group.key}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2
                  className={cn(
                    "sticky top-14 z-10 -mx-1 mb-3 rounded-lg px-2 py-2 backdrop-blur-md sm:top-16",
                    fintechLabel,
                    "bg-[var(--background)]/90"
                  )}
                >
                  {group.label}
                </h2>
                <ul className={cn(fintechSurface, "divide-y divide-[var(--border-subtle)] overflow-hidden")}>
                  {group.rows.map((row) => (
                    <li key={row.id}>
                      <div
                        className={cn(
                          "group flex items-center gap-3 px-4 py-4 transition-colors duration-200 hover:bg-[var(--surface-hover)]",
                          flashId === row.id && "row-highlight"
                        )}
                      >
                        {row.receipts && row.receipts.length > 0 ? (
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                            {row.receipts[0].mimeType.startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.receipts[0].previewUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <ReceiptText className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.75} />
                              </span>
                            )}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => openEdit(row)}
                        >
                          <p className={cn("truncate text-[15px] font-semibold leading-snug", fintechForeground)}>
                            {row.description}
                          </p>
                          <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>
                            {row.category}
                            {row.account ? ` · ${row.account}` : ""}
                            {row.receipts && row.receipts.length > 1
                              ? ` · ${row.receipts.length} receipts`
                              : row.receipts?.length === 1
                                ? " · Receipt"
                                : ""}
                          </p>
                        </button>
                        <p
                          className={cn(
                            "shrink-0 text-right text-[15px] font-semibold tabular-nums tracking-tight",
                            transactionAmountClassName(row.amount)
                          )}
                        >
                          {formatTransactionAmountWithSource(
                            row.amount,
                            primaryCurrency,
                            row.currency
                          )}
                        </p>
                        <div
                          className="flex shrink-0 gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label={`Edit ${row.description}`}
                            className={fintechIconButton}
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${row.description}`}
                            className={cn(fintechIconButton, "border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500")}
                            onClick={() => handleDelete(row)}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>
      )}

      <TransactionEntryModal
        open={modalOpen}
        onOpenChange={closeModal}
        editTransaction={editTransaction}
        onSubmit={(input, editId) => submitTransaction(input, editId)}
      />
    </PageFrame>
  );
}
