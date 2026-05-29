"use client";

import { useMemo, useState } from "react";
import { isWithinInterval } from "date-fns";
import { Search, SlidersHorizontal } from "lucide-react";
import { AddTransactionModal, type TransactionDraft } from "@/components/planner/AddTransactionModal";
import { EmptyState, FormField, PageHeader, TransactionTable } from "@/components/planner/ui";
import { usePlannerView } from "@/components/planner/usePlannerView";

export function TransactionsPage() {
  const {
    paychecks,
    categories,
    accounts,
    transactions,
    user,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = usePlannerView();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paycheckFilter, setPaycheckFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) =>
        t.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) =>
        categoryFilter === "all" ? true : (t.categoryId ?? "") === categoryFilter
      )
      .filter((t) => {
        if (paycheckFilter === "all") return true;
        const paycheck = paychecks.find((p) => p.id === paycheckFilter);
        if (!paycheck) return true;
        return isWithinInterval(t.date, { start: paycheck.periodStart, end: paycheck.periodEnd });
      })
      .sort((a, b) => +b.date - +a.date);
  }, [transactions, search, typeFilter, categoryFilter, paycheckFilter, paychecks]);

  const editing = editingId
    ? transactions.find((t) => t.id === editingId)
    : undefined;
  const initial: TransactionDraft = editing
    ? {
        userId: editing.userId,
        paycheckId: editing.paycheckId,
        categoryId: editing.categoryId,
        date: editing.date,
        description: editing.description,
        amount: editing.amount,
        type: editing.type,
        account: editing.account,
        notes: editing.notes,
        recurring: editing.recurring,
      }
    : {
        userId: user.id,
        paycheckId: paychecks[0]?.id ?? "",
        categoryId: categories[0]?.id,
        date: new Date(),
        description: "",
        amount: 0,
        type: "expense",
        account: accounts[0],
        notes: "",
        recurring: false,
      };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description="Track every expense, income, and transfer."
        action={
          <button className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:brightness-105" onClick={() => { setEditingId(null); setModalOpen(true); }}>
            Add transaction
          </button>
        }
      />
      <div className="planner-card grid gap-3 p-4 md:grid-cols-4">
        <FormField label="Search">
          <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input className="planner-input w-full pl-9" placeholder="Search merchant or memo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </FormField>
        <FormField label="Transaction type">
          <select className="planner-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
          <option value="all">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
          </select>
        </FormField>
        <FormField label="Category">
          <select className="planner-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          </select>
        </FormField>
        <FormField label="Paycheck period">
          <select className="planner-input" value={paycheckFilter} onChange={(e) => setPaycheckFilter(e.target.value)}>
          <option value="all">All paychecks</option>
          {paychecks.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          </select>
        </FormField>
        <button
          className="btn-secondary md:col-span-4 md:justify-self-end"
          onClick={() => {
            setSearch("");
            setTypeFilter("all");
            setCategoryFilter("all");
            setPaycheckFilter("all");
          }}
        >
          <SlidersHorizontal className="mr-1 h-4 w-4" />
          Reset filters
        </button>
      </div>
      <p className="text-sm text-[var(--muted)]">{filtered.length} transaction(s) match current filters.</p>

      {filtered.length ? (
        <TransactionTable
          transactions={filtered}
          onEdit={(id) => {
            setEditingId(id);
            setModalOpen(true);
          }}
          onDelete={deleteTransaction}
        />
      ) : (
        <EmptyState title="No transactions yet." body="Add your first transaction to start tracking your spending." />
      )}

      <AddTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        paychecks={paychecks}
        categories={categories}
        accounts={accounts}
        initial={initial}
        onSave={(draft) => {
          if (editingId) updateTransaction(editingId, draft);
          else addTransaction(draft);
        }}
      />
    </div>
  );
}
