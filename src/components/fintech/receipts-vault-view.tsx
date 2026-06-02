"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Check,
  Download,
  FileText,
  ImageIcon,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  collectVaultReceipts,
  type VaultReceipt,
} from "@/lib/receipts/collect-vault-receipts";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  EmptyState,
  FieldLabel,
  FilterChip,
  GhostButton,
  ModalOverlay,
  PageFrame,
  PrimaryButton,
  ShellInput,
  ShellSelect,
  fintechForeground,
  fintechLink,
  fintechMuted,
  fintechSurface,
} from "@/components/fintech/ui";
import { transactionRecordToInput } from "@/lib/transactions/store-mapper";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { TransactionRecord } from "@/types/finance";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

type DateFilter = "all" | "30" | "90";

function demoTxToRecord(tx: DemoTransaction): TransactionRecord {
  return {
    id: tx.id,
    amount: tx.amount,
    date: tx.date,
    description: tx.merchant,
    category: tx.category,
    account: tx.account,
    currency: tx.currency,
    tags: [],
    recurring: tx.recurring,
    receipts: tx.receipts,
  };
}

export function ReceiptsVaultView() {
  const confirm = useConfirm();
  const { transactions, categories, accounts, preferences, updateTransaction } = useAppDataStore(
    useShallow((s) => ({
      transactions: s.demoTransactions,
      categories: s.categories,
      accounts: s.accounts,
      preferences: s.preferences,
      updateTransaction: s.updateTransaction,
    }))
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [amountMin, setAmountMin] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<VaultReceipt | null>(null);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const allReceipts = useMemo(() => collectVaultReceipts(transactions), [transactions]);

  const categoryOptions = useMemo(() => {
    const names = new Set(allReceipts.map((r) => r.category));
    return [...names].sort();
  }, [allReceipts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = amountMin ? Number.parseFloat(amountMin) : 0;
    const cutoff =
      dateFilter === "30"
        ? format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd")
        : dateFilter === "90"
          ? format(new Date(Date.now() - 90 * 86400000), "yyyy-MM-dd")
          : null;

    return allReceipts.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (cutoff && r.transactionDate < cutoff) return false;
      if (min > 0 && Math.abs(r.amount) < min) return false;
      if (!q) return true;
      return (
        r.merchant.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.fileName.toLowerCase().includes(q)
      );
    });
  }, [allReceipts, search, categoryFilter, dateFilter, amountMin]);

  const toggleSelect = (vaultId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(vaultId)) next.delete(vaultId);
      else next.add(vaultId);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => `${r.transactionId}:${r.id}`)));
    }
  };

  const vaultKey = (r: VaultReceipt) => `${r.transactionId}:${r.id}`;

  const removeReceipt = (receipt: VaultReceipt) => {
    const tx = transactions.find((t) => t.id === receipt.transactionId);
    if (!tx) return;
    const input = transactionRecordToInput(
      {
        ...demoTxToRecord(tx),
        receipts: (tx.receipts ?? []).filter((x) => x.id !== receipt.id),
      },
      accounts,
      categories
    );
    updateTransaction(tx.id, input);
  };

  const bulkDelete = () => {
    void confirm({
      title: `Delete ${selected.size} receipt${selected.size === 1 ? "" : "s"}?`,
      description: "Files are removed from their linked transactions.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        for (const key of selected) {
          const receipt = filtered.find((r) => vaultKey(r) === key);
          if (receipt) removeReceipt(receipt);
        }
        setSelected(new Set());
        setDetail(null);
        toast.success("Receipts deleted");
      },
    });
  };

  const bulkDownload = async () => {
    const items = filtered.filter((r) => selected.has(vaultKey(r)));
    for (const r of items) {
      try {
        const res = await fetch(r.previewUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = r.fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast.error(`Could not download ${r.fileName}`);
      }
    }
    toast.success(`Downloaded ${items.length} file${items.length === 1 ? "" : "s"}`);
  };

  const applyBulkCategory = () => {
    if (!bulkCategory) return;
    const cat = categories.find((c) => c.id === bulkCategory || c.name === bulkCategory);
    if (!cat) return;
    const keys = [...selected];
    for (const key of keys) {
      const receipt = filtered.find((r) => vaultKey(r) === key);
      if (!receipt) continue;
      const tx = transactions.find((t) => t.id === receipt.transactionId);
      if (!tx) continue;
      const input = transactionRecordToInput(
        { ...demoTxToRecord(tx), category: cat.name },
        accounts,
        categories
      );
      updateTransaction(tx.id, input);
    }
    setBulkOpen(false);
    setSelected(new Set());
    toast.success("Categories updated");
  };

  return (
    <PageFrame
      title="Receipts"
      description="Every receipt you've attached — search, filter, and manage in one place."
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <ShellInput
            className="pl-10"
            placeholder="Search merchant, category, or filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search receipts"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={dateFilter === "all"} onClick={() => setDateFilter("all")}>
            All dates
          </FilterChip>
          <FilterChip active={dateFilter === "30"} onClick={() => setDateFilter("30")}>
            Last 30 days
          </FilterChip>
          <FilterChip active={dateFilter === "90"} onClick={() => setDateFilter("90")}>
            Last 90 days
          </FilterChip>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1">
            <FieldLabel>Category</FieldLabel>
            <ShellSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </ShellSelect>
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <FieldLabel>Min amount</FieldLabel>
            <ShellInput
              type="number"
              min={0}
              step="0.01"
              placeholder="Any amount"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
            />
          </label>
        </div>

        {selected.size > 0 ? (
          <div
            className={cn(
              fintechSurface,
              "flex flex-wrap items-center gap-2 px-4 py-3"
            )}
          >
            <span className={cn("text-sm font-medium", fintechForeground)}>
              {selected.size} selected
            </span>
            <GhostButton type="button" className="!text-xs" onClick={() => void bulkDownload()}>
              <Download className="mr-1 inline h-3.5 w-3.5" />
              Download
            </GhostButton>
            <GhostButton type="button" className="!text-xs" onClick={() => setBulkOpen(true)}>
              Categorize
            </GhostButton>
            <GhostButton
              type="button"
              className="!text-xs text-rose-400"
              onClick={bulkDelete}
            >
              <Trash2 className="mr-1 inline h-3.5 w-3.5" />
              Delete
            </GhostButton>
            <GhostButton type="button" className="!ml-auto !text-xs" onClick={() => setSelected(new Set())}>
              Clear
            </GhostButton>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={allReceipts.length === 0 ? "No receipts yet" : "No matches"}
          description={
            allReceipts.length === 0
              ? "Attach receipts when adding or editing a transaction."
              : "Try clearing filters or search terms."
          }
          action={
            <Link href="/transactions" className={cn("text-sm font-medium", fintechLink)}>
              Go to transactions
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className={cn("text-sm", fintechMuted)}>
              {filtered.length} receipt{filtered.length === 1 ? "" : "s"}
            </p>
            <GhostButton type="button" className="!text-xs" onClick={selectAll}>
              {selected.size === filtered.length ? "Deselect all" : "Select all"}
            </GhostButton>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((receipt) => {
              const key = vaultKey(receipt);
              const isSelected = selected.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDetail(receipt)}
                  className={cn(
                    "group relative overflow-hidden rounded-[var(--radius-inner)] border text-left transition",
                    isSelected
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                      : "border-[var(--border-subtle)] hover:border-[var(--accent)]/40"
                  )}
                >
                  <span
                    className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(key);
                    }}
                    role="checkbox"
                    aria-checked={isSelected}
                  >
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded border border-white/80" />
                    )}
                  </span>
                  <ReceiptThumb receipt={receipt} />
                  <div className="space-y-0.5 p-2.5">
                    <p className={cn("truncate text-xs font-medium", fintechForeground)}>
                      {receipt.merchant}
                    </p>
                    <p className={cn("truncate text-[10px]", fintechMuted)}>
                      {format(parseISO(receipt.transactionDate), "MMM d")} · {receipt.category}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <ReceiptDetailModal
        receipt={detail}
        currency={preferences.currency}
        onClose={() => setDetail(null)}
        onDelete={(r) => {
          void confirm({
            title: "Delete this receipt?",
            description: "The file will be removed from its linked transaction.",
            confirmLabel: "Delete",
            variant: "destructive",
            onConfirm: () => {
              removeReceipt(r);
              setDetail(null);
              toast.success("Receipt removed");
            },
          });
        }}
      />

      <ModalOverlay open={bulkOpen} onClose={() => setBulkOpen(false)} title="Categorize selected">
        <label className="grid gap-1.5">
          <FieldLabel>Category</FieldLabel>
          <ShellSelect value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
            <option value="">Choose…</option>
            {categories
              .filter((c) => c.name !== "Income")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </ShellSelect>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <GhostButton type="button" onClick={() => setBulkOpen(false)}>
            Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={applyBulkCategory}>
            Apply
          </PrimaryButton>
        </div>
      </ModalOverlay>
    </PageFrame>
  );
}

function ReceiptThumb({ receipt }: { receipt: VaultReceipt }) {
  if (receipt.mimeType.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={receipt.previewUrl}
        alt=""
        className="aspect-[4/5] w-full object-cover"
      />
    );
  }
  return (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-[var(--surface-elevated)]">
      <FileText className="h-10 w-10 text-[var(--muted)]" />
      <span className="max-w-[90%] truncate px-2 text-[10px] text-[var(--muted)]">
        {receipt.fileName}
      </span>
    </div>
  );
}

function ReceiptDetailModal({
  receipt,
  currency,
  onClose,
  onDelete,
}: {
  receipt: VaultReceipt | null;
  currency: Parameters<typeof formatMoney>[1];
  onClose: () => void;
  onDelete: (r: VaultReceipt) => void;
}) {
  if (!receipt) return null;

  return (
    <ModalOverlay open={!!receipt} onClose={onClose} title={receipt.merchant} variant="solid">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
          {receipt.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={receipt.previewUrl} alt="" className="max-h-[min(60dvh,28rem)] w-full object-contain" />
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-8">
              <FileText className="h-12 w-12 text-[var(--muted)]" />
              <p className={cn("text-sm", fintechMuted)}>{receipt.fileName}</p>
              <a
                href={receipt.previewUrl}
                target="_blank"
                rel="noreferrer"
                className={cn("text-sm font-medium", fintechLink)}
              >
                Open PDF
              </a>
            </div>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <p className={cn("text-2xl font-semibold tabular-nums", fintechForeground)}>
            {formatMoney(Math.abs(receipt.amount), currency)}
          </p>
          <dl className={cn("grid gap-2", fintechMuted)}>
            <div className="flex justify-between gap-4">
              <dt>Date</dt>
              <dd className={fintechForeground}>
                {format(parseISO(receipt.transactionDate), "MMMM d, yyyy")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Category</dt>
              <dd className={fintechForeground}>{receipt.category}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Account</dt>
              <dd className={fintechForeground}>{receipt.account}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>File</dt>
              <dd className={cn("truncate", fintechForeground)}>{receipt.fileName}</dd>
            </div>
          </dl>
          <Link
            href="/transactions"
            className={cn("inline-flex text-sm font-medium", fintechLink)}
            onClick={onClose}
          >
            View in transactions →
          </Link>
          <div className="flex flex-wrap gap-2 pt-2">
            <GhostButton
              type="button"
              onClick={() => {
                const a = document.createElement("a");
                a.href = receipt.previewUrl;
                a.download = receipt.fileName;
                a.click();
              }}
            >
              <Download className="mr-1 inline h-4 w-4" />
              Download
            </GhostButton>
            <GhostButton
              type="button"
              className="text-rose-400"
              onClick={() => onDelete(receipt)}
            >
              <Trash2 className="mr-1 inline h-4 w-4" />
              Delete
            </GhostButton>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-lg p-2 lg:hidden"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </ModalOverlay>
  );
}
