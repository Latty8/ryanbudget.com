"use client";

import { useState } from "react";
import { format } from "date-fns";
import { EmptyState, FormField, PageHeader, PaycheckSelector } from "@/components/planner/ui";
import { formatCurrency, toCents } from "@/lib/planner/format";
import { usePlannerStore } from "@/store/usePlannerStore";

export function PaychecksPage() {
  const {
    paychecks,
    activePaycheckId,
    setActivePaycheck,
    addPaycheck,
    updatePaycheck,
    deletePaycheck,
    user,
  } = usePlannerStore();
  const [form, setForm] = useState({
    name: "",
    payDate: new Date().toISOString().slice(0, 10),
    periodStart: new Date().toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
    expectedIncome: 0,
    actualIncome: 0,
    notes: "",
    status: "planned" as const,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{
    name: string;
    payDate: string;
    periodStart: string;
    periodEnd: string;
    expectedIncome: number;
    actualIncome: number;
    status: "planned" | "active" | "completed";
  }>({
    name: "",
    payDate: "",
    periodStart: "",
    periodEnd: "",
    expectedIncome: 0,
    actualIncome: 0,
    status: "planned",
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Paychecks" description="Create and manage pay periods, then choose the active one." />
      <div className="planner-card p-4">
        <div className="mb-3">
          <PaycheckSelector paychecks={paychecks} activeId={activePaycheckId} onSelect={setActivePaycheck} />
        </div>
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            addPaycheck({
              userId: user.id,
              name: form.name || "New Paycheck",
              payDate: new Date(form.payDate),
              periodStart: new Date(form.periodStart),
              periodEnd: new Date(form.periodEnd),
              expectedIncome: toCents(form.expectedIncome),
              actualIncome: toCents(form.actualIncome),
              notes: form.notes,
              status: form.status,
            });
          }}
        >
          <FormField label="Paycheck name"><input className="planner-input" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></FormField>
          <FormField label="Pay date"><input className="planner-input" type="date" value={form.payDate} onChange={(e) => setForm((s) => ({ ...s, payDate: e.target.value }))} /></FormField>
          <FormField label="Expected income"><input className="planner-input" type="number" min={0} step="0.01" value={form.expectedIncome === 0 ? "" : form.expectedIncome} onChange={(e) => setForm((s) => ({ ...s, expectedIncome: Number(e.target.value || 0) }))} /></FormField>
          <FormField label="Period start"><input className="planner-input" type="date" value={form.periodStart} onChange={(e) => setForm((s) => ({ ...s, periodStart: e.target.value }))} /></FormField>
          <FormField label="Period end"><input className="planner-input" type="date" value={form.periodEnd} onChange={(e) => setForm((s) => ({ ...s, periodEnd: e.target.value }))} /></FormField>
          <FormField label="Actual income"><input className="planner-input" type="number" min={0} step="0.01" value={form.actualIncome === 0 ? "" : form.actualIncome} onChange={(e) => setForm((s) => ({ ...s, actualIncome: Number(e.target.value || 0) }))} /></FormField>
          <button className="btn-primary md:col-span-3">Add paycheck</button>
        </form>
      </div>

      {paychecks.length === 0 ? (
        <EmptyState title="You have not created a paycheck yet." body="Create one to start planning your budget." />
      ) : (
        <div className="grid gap-3">
          {paychecks.map((p) => (
            <article key={p.id} className="planner-card p-4">
              {editingId === p.id ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <FormField label="Paycheck name"><input className="planner-input" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} /></FormField>
                  <FormField label="Pay date"><input className="planner-input" type="date" value={edit.payDate} onChange={(e) => setEdit((s) => ({ ...s, payDate: e.target.value }))} /></FormField>
                  <FormField label="Status"><select className="planner-input" value={edit.status} onChange={(e) => setEdit((s) => ({ ...s, status: e.target.value as typeof s.status }))}>
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select></FormField>
                  <FormField label="Period start"><input className="planner-input" type="date" value={edit.periodStart} onChange={(e) => setEdit((s) => ({ ...s, periodStart: e.target.value }))} /></FormField>
                  <FormField label="Period end"><input className="planner-input" type="date" value={edit.periodEnd} onChange={(e) => setEdit((s) => ({ ...s, periodEnd: e.target.value }))} /></FormField>
                  <div />
                  <FormField label="Expected income"><input className="planner-input" type="number" min={0} step="0.01" value={edit.expectedIncome === 0 ? "" : edit.expectedIncome} onChange={(e) => setEdit((s) => ({ ...s, expectedIncome: Number(e.target.value || 0) }))} /></FormField>
                  <FormField label="Actual income"><input className="planner-input" type="number" min={0} step="0.01" value={edit.actualIncome === 0 ? "" : edit.actualIncome} onChange={(e) => setEdit((s) => ({ ...s, actualIncome: Number(e.target.value || 0) }))} /></FormField>
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={() => { updatePaycheck(p.id, { name: edit.name, payDate: new Date(edit.payDate), periodStart: new Date(edit.periodStart), periodEnd: new Date(edit.periodEnd), expectedIncome: toCents(edit.expectedIncome), actualIncome: toCents(edit.actualIncome), status: edit.status }); setEditingId(null); }}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {format(p.periodStart, "MMM d")} - {format(p.periodEnd, "MMM d")} · Pay date {format(p.payDate, "MMM d")}
                      </p>
                    </div>
                    <select
                      className="planner-input px-2 py-1 text-sm"
                      value={p.status}
                      onChange={(e) => updatePaycheck(p.id, { status: e.target.value as typeof p.status })}
                    >
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <p className="mt-2 text-sm">
                    Expected {formatCurrency(p.expectedIncome)} · Actual {formatCurrency(p.actualIncome)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button className="btn-secondary" onClick={() => { setEditingId(p.id); setEdit({ name: p.name, payDate: p.payDate.toISOString().slice(0, 10), periodStart: p.periodStart.toISOString().slice(0, 10), periodEnd: p.periodEnd.toISOString().slice(0, 10), expectedIncome: p.expectedIncome / 100, actualIncome: p.actualIncome / 100, status: p.status }); }}>Edit</button>
                    <button className="btn-secondary border-red-400/60 text-red-600" onClick={() => deletePaycheck(p.id)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
