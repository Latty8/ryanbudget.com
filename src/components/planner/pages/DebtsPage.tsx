"use client";

import { useState } from "react";
import { calculateDebtPayoff } from "@/lib/planner/calculations";
import { toCents } from "@/lib/planner/format";
import { DebtCard, EmptyState, FormField, PageHeader } from "@/components/planner/ui";
import { usePlannerStore } from "@/store/usePlannerStore";

export function DebtsPage() {
  const { debts, user, addDebt, updateDebt, deleteDebt } = usePlannerStore();
  const [form, setForm] = useState({
    name: "",
    balance: 0,
    apr: 0,
    minimumPayment: 0,
    extraPayment: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", balance: 0, apr: 0, minimumPayment: 0, extraPayment: 0 });
  const canAdd = form.name.trim().length > 0 && form.balance > 0 && form.minimumPayment > 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Debt Tracker" description="Track balances, minimums, and payoff estimates." />
      <form
        className="planner-card grid gap-3 p-4 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          addDebt({
            userId: user.id,
            name: form.name,
            balance: toCents(form.balance),
            apr: form.apr,
            minimumPayment: toCents(form.minimumPayment),
            extraPayment: toCents(form.extraPayment),
            notes: "",
          });
          setForm({ name: "", balance: 0, apr: 0, minimumPayment: 0, extraPayment: 0 });
        }}
      >
        <FormField label="Debt name"><input className="planner-input" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></FormField>
        <FormField label="Balance"><input className="planner-input" type="number" min={0} step="0.01" value={form.balance === 0 ? "" : form.balance} onChange={(e) => setForm((s) => ({ ...s, balance: Number(e.target.value || 0) }))} /></FormField>
        <FormField label="APR (%)"><input className="planner-input" type="number" min={0} step="0.01" value={form.apr === 0 ? "" : form.apr} onChange={(e) => setForm((s) => ({ ...s, apr: Number(e.target.value || 0) }))} /></FormField>
        <FormField label="Minimum payment"><input className="planner-input" type="number" min={0} step="0.01" value={form.minimumPayment === 0 ? "" : form.minimumPayment} onChange={(e) => setForm((s) => ({ ...s, minimumPayment: Number(e.target.value || 0) }))} /></FormField>
        <button className="btn-primary" disabled={!canAdd}>Add debt</button>
      </form>
      {!canAdd ? <p className="text-xs text-[var(--muted)]">Debt name is required, and balance/minimum payment must be greater than 0.</p> : null}

      {debts.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {debts.map((debt) => {
            const calc = calculateDebtPayoff(debt);
            return (
              <div key={debt.id} className="space-y-2">
                {editingId === debt.id ? (
                  <div className="planner-card grid gap-2 p-3">
                    <FormField label="Debt name" className="min-w-0"><input className="planner-input w-full" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} /></FormField>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12">
                      <FormField label="Balance" className="min-w-0 md:col-span-1 lg:col-span-3"><input className="planner-input w-full" type="number" min={0} step="0.01" value={edit.balance === 0 ? "" : edit.balance} onChange={(e) => setEdit((s) => ({ ...s, balance: Number(e.target.value || 0) }))} /></FormField>
                      <FormField label="APR (%)" className="min-w-0 md:col-span-1 lg:col-span-3"><input className="planner-input w-full" type="number" min={0} step="0.01" value={edit.apr === 0 ? "" : edit.apr} onChange={(e) => setEdit((s) => ({ ...s, apr: Number(e.target.value || 0) }))} /></FormField>
                      <FormField label="Minimum payment" className="min-w-0 md:col-span-1 lg:col-span-3"><input className="planner-input w-full" type="number" min={0} step="0.01" value={edit.minimumPayment === 0 ? "" : edit.minimumPayment} onChange={(e) => setEdit((s) => ({ ...s, minimumPayment: Number(e.target.value || 0) }))} /></FormField>
                      <FormField label="Extra payment" className="min-w-0 md:col-span-1 lg:col-span-3"><input className="planner-input w-full" type="number" min={0} step="0.01" value={edit.extraPayment === 0 ? "" : edit.extraPayment} onChange={(e) => setEdit((s) => ({ ...s, extraPayment: Number(e.target.value || 0) }))} /></FormField>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary" disabled={edit.name.trim().length === 0 || edit.balance <= 0 || edit.minimumPayment <= 0} onClick={() => { if (edit.name.trim().length === 0 || edit.balance <= 0 || edit.minimumPayment <= 0) return; updateDebt(debt.id, { name: edit.name, balance: toCents(edit.balance), apr: edit.apr, minimumPayment: toCents(edit.minimumPayment), extraPayment: toCents(edit.extraPayment) }); setEditingId(null); }}>Save</button>
                      <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : null}
                <DebtCard debt={debt} months={calc.months} interest={calc.totalInterest} />
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => { setEditingId(debt.id); setEdit({ name: debt.name, balance: debt.balance / 100, apr: debt.apr, minimumPayment: debt.minimumPayment / 100, extraPayment: (debt.extraPayment ?? 0) / 100 }); }}>Edit</button>
                  <button className="btn-secondary border-red-400/60 text-red-600" onClick={() => deleteDebt(debt.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No debts yet." body="Add debts to calculate payoff timing and interest." />
      )}
    </div>
  );
}
