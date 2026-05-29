"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { billsDueBeforeNextPaycheck } from "@/lib/planner/calculations";
import { formatCurrency, toCents } from "@/lib/planner/format";
import { EmptyState, FormField, PageHeader } from "@/components/planner/ui";
import { usePlannerView } from "@/components/planner/usePlannerView";

export function BillsPage() {
  const { bills, categories, accounts, user, addBill, updateBill, deleteBill, paychecks, activePaycheckId } =
    usePlannerView();
  const active = paychecks.find((p) => p.id === activePaycheckId) ?? paychecks[0];
  const dueBefore = billsDueBeforeNextPaycheck(bills.filter((b) => b.active), active);
  const monthlyTotal = useMemo(
    () => bills.filter((b) => b.active).reduce((sum, b) => sum + b.amount, 0),
    [bills]
  );
  const [form, setForm] = useState({
    name: "",
    amount: 0,
    dueDate: addDays(new Date(), 1).toISOString().slice(0, 10),
    frequency: "monthly" as const,
    categoryId: categories[0]?.id ?? "",
    account: accounts[0] ?? "",
    autopay: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{
    name: string;
    amount: number;
    dueDate: string;
    frequency: "weekly" | "biweekly" | "monthly" | "yearly";
    autopay: boolean;
    active: boolean;
  }>({ name: "", amount: 0, dueDate: "", frequency: "monthly", autopay: true, active: true });
  const canAdd = form.name.trim().length > 0 && form.amount > 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Bills" description="Track recurring bills and what is due before next paycheck." />
      <div className="planner-card grid gap-3 p-4 sm:grid-cols-3">
        <Summary title="Total monthly bills" value={formatCurrency(monthlyTotal)} />
        <Summary title="Due before next paycheck" value={`${dueBefore.length}`} />
        <Summary title="Current paycheck bill load" value={formatCurrency(dueBefore.reduce((s, b) => s + b.amount, 0))} />
      </div>

      <form
        className="planner-card grid gap-3 p-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          addBill({
            userId: user.id,
            name: form.name,
            amount: toCents(form.amount),
            dueDate: new Date(form.dueDate),
            frequency: form.frequency,
            categoryId: form.categoryId || undefined,
            autopay: form.autopay,
            active: true,
            notes: "",
          });
          setForm((s) => ({ ...s, name: "", amount: 0 }));
        }}
      >
        <FormField label="Bill name"><input className="planner-input" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></FormField>
        <FormField label="Amount"><input className="planner-input" type="number" min={0} step="0.01" value={form.amount === 0 ? "" : form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: Number(e.target.value || 0) }))} /></FormField>
        <FormField label="Due date"><input className="planner-input" type="date" value={form.dueDate} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value }))} /></FormField>
        <button className="btn-primary" disabled={!canAdd}>Add bill</button>
      </form>
      {!canAdd ? <p className="text-xs text-[var(--muted)]">Bill name is required and amount must be greater than 0.</p> : null}

      {bills.length ? (
        <div className="grid gap-3">
          {bills.map((bill) => (
            <article key={bill.id} className="planner-card p-4">
              {editingId === bill.id ? (
                <div className="grid gap-2 sm:grid-cols-5">
                  <FormField label="Bill name" className="sm:col-span-2"><input className="planner-input" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} /></FormField>
                  <FormField label="Amount"><input className="planner-input" type="number" min={0} step="0.01" value={edit.amount === 0 ? "" : edit.amount} onChange={(e) => setEdit((s) => ({ ...s, amount: Number(e.target.value || 0) }))} /></FormField>
                  <FormField label="Due date"><input className="planner-input" type="date" value={edit.dueDate} onChange={(e) => setEdit((s) => ({ ...s, dueDate: e.target.value }))} /></FormField>
                  <FormField label="Frequency"><select className="planner-input" value={edit.frequency} onChange={(e) => setEdit((s) => ({ ...s, frequency: e.target.value as typeof edit.frequency }))}>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select></FormField>
                  <div className="sm:col-span-5 flex gap-2">
                    <button className="btn-primary" disabled={edit.name.trim().length === 0 || edit.amount <= 0} onClick={() => { if (edit.name.trim().length === 0 || edit.amount <= 0) return; updateBill(bill.id, { name: edit.name, amount: toCents(edit.amount), dueDate: new Date(edit.dueDate), frequency: edit.frequency, autopay: edit.autopay, active: edit.active }); setEditingId(null); }}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{bill.name}</p>
                    <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">Due {format(bill.dueDate, "MMM d")} · {bill.frequency}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="btn-secondary" onClick={() => { setEditingId(bill.id); setEdit({ name: bill.name, amount: bill.amount / 100, dueDate: bill.dueDate.toISOString().slice(0, 10), frequency: bill.frequency, autopay: bill.autopay, active: bill.active }); }}>Edit</button>
                    <button className="btn-secondary border-red-400/60 text-red-600" onClick={() => deleteBill(bill.id)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : <EmptyState title="No bills yet." body="Add recurring bills to see upcoming due dates." />}
    </div>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return (
    <div className="stat-tile p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
