"use client";

import { useState } from "react";
import { CATEGORY_GROUPS } from "@/lib/planner/constants";
import { toCents } from "@/lib/planner/format";
import { EmptyState, FormField, PageHeader } from "@/components/planner/ui";
import { usePlannerStore } from "@/store/usePlannerStore";

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, user } = usePlannerStore();
  const [name, setName] = useState("");
  const [group, setGroup] = useState<(typeof CATEGORY_GROUPS)[number]>("Housing");
  const [budgetType, setBudgetType] = useState<"fixed" | "percentage" | "manual">("manual");
  const [amount, setAmount] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", group: "Housing", budgetType: "manual" as "fixed" | "percentage" | "manual", amount: 0, percentage: 0, rollover: true, active: true });
  const canAdd = name.trim().length > 0 && (budgetType === "percentage" ? percentage > 0 : amount > 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Categories" description="Manage category rules, colors, and defaults." />
      <form
        className="planner-card grid gap-3 p-4 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          addCategory({
            userId: user.id,
            name,
            group,
            color: "#009CCF",
            icon: "",
            budgetType,
            defaultAmount: budgetType === "percentage" ? undefined : toCents(amount),
            defaultPercentage: budgetType === "percentage" ? percentage : undefined,
            rollover: true,
            active: true,
          });
          setName("");
          setAmount(0);
          setPercentage(0);
        }}
      >
        <FormField label="Category name"><input className="planner-input" value={name} onChange={(e) => setName(e.target.value)} /></FormField>
        <FormField label="Group"><select className="planner-input" value={group} onChange={(e) => setGroup(e.target.value as (typeof CATEGORY_GROUPS)[number])}>
          {CATEGORY_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select></FormField>
        <FormField label="Budget method"><select className="planner-input" value={budgetType} onChange={(e) => setBudgetType(e.target.value as "fixed" | "percentage" | "manual")}>
          <option value="fixed">Fixed</option>
          <option value="percentage">Percentage</option>
          <option value="manual">Manual</option>
        </select></FormField>
        {budgetType === "percentage" ? (
          <FormField label="Default percentage"><input className="planner-input" type="number" min={0} step="0.01" value={percentage === 0 ? "" : percentage} onChange={(e) => setPercentage(Number(e.target.value || 0))} /></FormField>
        ) : (
          <FormField label="Amount"><input className="planner-input" type="number" min={0} step="0.01" value={amount === 0 ? "" : amount} onChange={(e) => setAmount(Number(e.target.value || 0))} /></FormField>
        )}
        <button className="btn-primary" disabled={!canAdd}>Add category</button>
      </form>
      {!canAdd ? <p className="text-xs text-[var(--muted)]">Category name is required, and amount must be greater than 0.</p> : null}

      {categories.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((c) => (
            <article key={c.id} className="planner-card p-4">
              {editingId === c.id ? (
                <div className="grid items-end gap-2 md:grid-cols-2 lg:grid-cols-12">
                    <FormField label="Category name" className="min-w-0 text-xs md:col-span-2 lg:col-span-4"><input className="planner-input w-full py-2 text-sm" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} /></FormField>
                  <FormField label="Group" className="min-w-0 text-xs lg:col-span-3"><select className="planner-input w-full py-2 text-sm" value={edit.group} onChange={(e) => setEdit((s) => ({ ...s, group: e.target.value }))}>
                    {CATEGORY_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select></FormField>
                  <FormField label="Budget method" className="min-w-0 text-xs lg:col-span-3"><select className="planner-input w-full py-2 text-sm" value={edit.budgetType} onChange={(e) => setEdit((s) => ({ ...s, budgetType: e.target.value as typeof edit.budgetType }))}>
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                    <option value="manual">Manual</option>
                  </select></FormField>
                  {edit.budgetType === "percentage" ? (
                    <FormField label="Default percentage" className="min-w-0 text-xs lg:col-span-2"><input className="planner-input w-full py-2 text-sm" type="number" min={0} step="0.01" value={edit.percentage === 0 ? "" : edit.percentage} onChange={(e) => setEdit((s) => ({ ...s, percentage: Number(e.target.value || 0) }))} /></FormField>
                  ) : (
                    <FormField label="Amount" className="min-w-0 text-xs lg:col-span-2"><input className="planner-input w-full py-2 text-sm" type="number" min={0} step="0.01" value={edit.amount === 0 ? "" : edit.amount} onChange={(e) => setEdit((s) => ({ ...s, amount: Number(e.target.value || 0) }))} /></FormField>
                  )}
                  <div className="flex gap-2 md:col-span-2 lg:col-span-12">
                    <button className="btn-primary" disabled={edit.name.trim().length === 0 || (edit.budgetType === "percentage" ? edit.percentage <= 0 : edit.amount <= 0)} onClick={() => { if (edit.name.trim().length === 0 || (edit.budgetType === "percentage" ? edit.percentage <= 0 : edit.amount <= 0)) return; updateCategory(c.id, { name: edit.name, group: edit.group, budgetType: edit.budgetType, defaultAmount: edit.budgetType === "percentage" ? undefined : toCents(edit.amount), defaultPercentage: edit.budgetType === "percentage" ? edit.percentage : undefined, rollover: edit.rollover, active: edit.active }); setEditingId(null); }}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.name}</p>
                    <label className="inline-flex items-center gap-2 text-xs">
                      Active
                      <input type="checkbox" checked={c.active} onChange={(e) => updateCategory(c.id, { active: e.target.checked })} />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-500">{c.group}</span>
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-500">{c.budgetType}</span>
                    {c.rollover ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-500">rollover</span> : null}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className="btn-secondary" onClick={() => { setEditingId(c.id); setEdit({ name: c.name, group: c.group, budgetType: c.budgetType, amount: (c.defaultAmount ?? 0) / 100, percentage: c.defaultPercentage ?? 0, rollover: c.rollover, active: c.active }); }}>Edit</button>
                    <button className="btn-secondary border-red-400/60 text-red-600" onClick={() => deleteCategory(c.id)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No categories yet." body="Create your first category to build your budget." />
      )}
    </div>
  );
}

