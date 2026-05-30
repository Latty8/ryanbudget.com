"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { startOfMonth } from "date-fns";
import { PageFrame } from "@/components/fintech/ui";
import { VirtualTransactionList } from "@/components/fintech/virtual-transaction-list";
import { getTransactions } from "@/lib/supabase/queries/transactions";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatMoneyWithSource, useAppDataStore } from "@/store/useAppDataStore";
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "this-month" | "expenses">("all");
  const storeTransactions = useAppDataStore((s) => s.demoTransactions);
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

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = query.trim().toLowerCase();
    const now = new Date();
    const thisMonth = startOfMonth(now).toISOString().slice(0, 7);
    return rows.filter((row) => {
      if (filter === "this-month" && !row.date.startsWith(thisMonth)) return false;
      if (filter === "expenses" && row.amount >= 0) return false;
      if (!q) return true;
      return (
        row.description.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.account.toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

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

  return (
    <PageFrame
      title="Transactions"
      description="Tap + to log spending. Everything saves automatically on this device."
    >
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="tx-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-400"
          />
        </label>
        <div className="flex gap-2">
          {(
            [
              ["all", "All"],
              ["this-month", "This month"],
              ["expenses", "Expenses"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                filter === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              )}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No transactions yet.</p>
          <p className="mt-1 text-xs text-slate-400">Use the + button to add your first one.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <VirtualTransactionList
            rows={filtered}
            isLight
            renderRow={(row) => (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{row.description}</p>
                  <p className="text-xs text-slate-500">
                    {row.date} · {row.category}
                  </p>
                </div>
                <p className={cn("shrink-0 text-sm font-medium", row.amount >= 0 ? "text-emerald-600" : "text-slate-800")}>
                  {formatMoneyWithSource(row.amount, primaryCurrency, row.currency)}
                </p>
              </>
            )}
          />
        </div>
      )}
    </PageFrame>
  );
}
