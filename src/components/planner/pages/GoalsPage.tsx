"use client";

import { useState } from "react";
import { calculateGoalProgress } from "@/lib/planner/calculations";
import { toCents } from "@/lib/planner/format";
import { EmptyState, FormField, GoalCard, PageHeader } from "@/components/planner/ui";
import { usePlannerStore } from "@/store/usePlannerStore";

export function GoalsPage() {
  const { goals, user, addGoal, updateGoal, deleteGoal } = usePlannerStore();
  const [name, setName] = useState("");
  const [target, setTarget] = useState(0);
  const [current, setCurrent] = useState(0);
  const [perPaycheck, setPerPaycheck] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", target: 0, current: 0, perPaycheck: 0 });
  const canAdd = name.trim().length > 0 && target > 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Goals" description="Create savings goals and track progress each paycheck." />
      <form
        className="planner-card grid gap-3 p-4 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          addGoal({
            userId: user.id,
            name,
            targetAmount: toCents(target),
            currentAmount: toCents(current),
            contributionPerPaycheck: toCents(perPaycheck),
            notes: "",
          });
          setName("");
          setTarget(0);
          setCurrent(0);
          setPerPaycheck(0);
        }}
      >
        <FormField label="Goal name"><input className="planner-input" value={name} onChange={(e) => setName(e.target.value)} /></FormField>
        <FormField label="Target amount"><input className="planner-input" type="number" min={0} step="0.01" value={target === 0 ? "" : target} onChange={(e) => setTarget(Number(e.target.value || 0))} /></FormField>
        <FormField label="Current saved"><input className="planner-input" type="number" min={0} step="0.01" value={current === 0 ? "" : current} onChange={(e) => setCurrent(Number(e.target.value || 0))} /></FormField>
        <FormField label="Contribution per paycheck"><input className="planner-input" type="number" min={0} step="0.01" value={perPaycheck === 0 ? "" : perPaycheck} onChange={(e) => setPerPaycheck(Number(e.target.value || 0))} /></FormField>
        <button className="btn-primary" disabled={!canAdd}>Add goal</button>
      </form>
      {!canAdd ? <p className="text-xs text-[var(--muted)]">Goal name is required and target amount must be greater than 0.</p> : null}

      {goals.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              {editingId === goal.id ? (
                <div className="planner-card grid gap-2 p-3">
                  <FormField label="Goal name" className="min-w-0"><input className="planner-input w-full" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} /></FormField>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12">
                    <FormField label="Target amount" className="min-w-0 md:col-span-1 lg:col-span-4"><input className="planner-input w-full" type="number" min={0} step="0.01" value={edit.target === 0 ? "" : edit.target} onChange={(e) => setEdit((s) => ({ ...s, target: Number(e.target.value || 0) }))} /></FormField>
                    <FormField label="Current saved" className="min-w-0 md:col-span-1 lg:col-span-4"><input className="planner-input w-full" type="number" min={0} step="0.01" value={edit.current === 0 ? "" : edit.current} onChange={(e) => setEdit((s) => ({ ...s, current: Number(e.target.value || 0) }))} /></FormField>
                    <FormField label="Per paycheck" className="min-w-0 md:col-span-2 lg:col-span-4"><input className="planner-input w-full" type="number" min={0} step="0.01" value={edit.perPaycheck === 0 ? "" : edit.perPaycheck} onChange={(e) => setEdit((s) => ({ ...s, perPaycheck: Number(e.target.value || 0) }))} /></FormField>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary" disabled={edit.name.trim().length === 0 || edit.target <= 0} onClick={() => { if (edit.name.trim().length === 0 || edit.target <= 0) return; updateGoal(goal.id, { name: edit.name, targetAmount: toCents(edit.target), currentAmount: toCents(edit.current), contributionPerPaycheck: toCents(edit.perPaycheck) }); setEditingId(null); }}>Save</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : null}
              <GoalCard goal={goal} progress={calculateGoalProgress(goal.currentAmount, goal.targetAmount)} />
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => { setEditingId(goal.id); setEdit({ name: goal.name, target: goal.targetAmount / 100, current: goal.currentAmount / 100, perPaycheck: (goal.contributionPerPaycheck ?? 0) / 100 }); }}>Edit</button>
                <button className="btn-secondary border-red-400/60 text-red-600" onClick={() => deleteGoal(goal.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No goals yet." body="Add goals like Emergency Fund or Travel to stay motivated." />
      )}
    </div>
  );
}
