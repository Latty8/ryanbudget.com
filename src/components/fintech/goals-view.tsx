"use client";

import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Target, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfettiBurst } from "@/components/ui/confetti-burst";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import {
  FieldLabel,
  GhostButton,
  EmptyState,
  PageFrame,
  PrimaryButton,
  ShellCard,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { useFintechTheme } from "@/components/fintech/theme";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { usePremium } from "@/hooks/use-premium";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { useAppDataStore, formatMoney } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import type { AppGoal } from "@/types/app-settings";

const GOAL_ICONS = ["Target", "Shield", "Plane", "Home", "Car", "Gift"];
const GOAL_COLORS = ["#22c55e", "#38bdf8", "#a78bfa", "#fbbf24", "#fb7185", "#34d399"];

const emptyGoal = (): Omit<AppGoal, "id"> => ({
  name: "",
  target: 500,
  current: 0,
  targetDate: format(new Date(Date.now() + 90 * 86400000), "yyyy-MM-dd"),
  icon: "Target",
  color: GOAL_COLORS[0],
});

function GoalProgressRing({ pct, color, isLight }: { pct: number; color: string; isLight: boolean }) {
  const dash = Math.round((pct / 100) * 151);
  return (
    <div className="relative grid h-16 w-16 place-items-center">
      <svg className="h-16 w-16 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r="24" strokeWidth="6" className={isLight ? "fill-none stroke-slate-200" : "fill-none stroke-slate-700"} />
        <circle
          cx="32"
          cy="32"
          r="24"
          strokeWidth="6"
          className="fill-none transition-all duration-500"
          stroke={color}
          strokeDasharray={`${dash} 151`}
        />
      </svg>
      <span className="absolute text-xs font-semibold">{Math.round(pct)}%</span>
    </div>
  );
}

export function GoalsView() {
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
  const confirm = useConfirm();
  const { canAddGoal, demoMode } = usePremium();
  const goals = useAppDataStore((s) => s.goals);
  const addGoal = useAppDataStore((s) => s.addGoal);
  const updateGoal = useAppDataStore((s) => s.updateGoal);
  const deleteGoal = useAppDataStore((s) => s.deleteGoal);
  const contributeToGoal = useAppDataStore((s) => s.contributeToGoal);
  const preferences = useAppDataStore((s) => s.preferences);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyGoal());
  const [contribution, setContribution] = useState<Record<string, number>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  const openCreate = () => {
    if (!canAddGoal(goals.length) && !demoMode) return;
    setEditingId(null);
    setForm(emptyGoal());
    setModalOpen(true);
  };

  const openEdit = (goal: AppGoal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      target: goal.target,
      current: goal.current,
      targetDate: goal.targetDate,
      icon: goal.icon,
      color: goal.color,
    });
    setModalOpen(true);
  };

  const saveGoal = () => {
    if (!form.name.trim() || form.target <= 0) {
      toast.error("Name and target amount are required");
      return;
    }
    if (editingId) {
      updateGoal(editingId, form);
      toast.success("Goal updated");
    } else {
      addGoal(form);
      toast.success("Goal created");
    }
    setModalOpen(false);
  };

  const handleDelete = (goal: AppGoal) => {
    void confirm({
      title: `Delete "${goal.name}"?`,
      description: "This savings goal will be permanently removed.",
      warning: "This action cannot be undone.",
      confirmLabel: "Delete goal",
      onConfirm: () => {
        deleteGoal(goal.id);
        toast.success("Goal deleted");
      },
    });
  };

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => b.current / b.target - a.current / a.target),
    [goals]
  );

  return (
    <PageFrame title="Goals">
      <ConfettiBurst active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="-mt-2 mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
          Track savings with live progress rings
        </p>
        {(canAddGoal(goals.length) || demoMode) && (
          <PrimaryButton onClick={openCreate}>
            <Plus className="mr-1 inline h-4 w-4" />
            New goal
          </PrimaryButton>
        )}
      </div>
      {!canAddGoal(goals.length) && !demoMode && goals.length >= 1 ? (
        <div className="mb-4">
          <UpgradePrompt
            feature="unlimited_goals"
            title="More goals on Premium"
            description="Free plan includes 1 savings goal. Upgrade for unlimited goals and household sharing."
          />
        </div>
      ) : null}

      {sortedGoals.length === 0 ? (
        <ShellCard className="p-0">
          <EmptyState
            icon={Target}
            title="No savings goals yet"
            description="Add an emergency fund, vacation, or down payment — we'll celebrate when you hit 100%."
            action={
              (canAddGoal(goals.length) || demoMode) ? (
                <PrimaryButton onClick={openCreate}>Create your first goal</PrimaryButton>
              ) : undefined
            }
          />
        </ShellCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {sortedGoals.map((g) => {
              const pct = Math.min(100, g.target > 0 ? (g.current / g.target) * 100 : 0);
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={cn(
                    "rounded-2xl border p-4",
                    isLight ? "border-slate-300 bg-white" : "border-slate-700 bg-neutral-800/95"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                        {formatMoney(g.current, preferences.currency)} / {formatMoney(g.target, preferences.currency)}
                      </p>
                      <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                        Target: {format(parseISO(g.targetDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <GoalProgressRing pct={pct} color={g.color} isLight={isLight} />
                  </div>
                  <div className={cn("mt-3 h-2 overflow-hidden rounded-full", isLight ? "bg-slate-100" : "bg-neutral-900")}>
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: g.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <NumberField
                      value={contribution[g.id] ?? 0}
                      onChange={(amount) => setContribution((prev) => ({ ...prev, [g.id]: amount }))}
                      placeholder="Amount"
                      className="w-28 px-2 py-1 text-sm"
                      aria-label={`Add to ${g.name}`}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-sky-500 px-2 py-1 text-xs font-medium text-slate-950"
                      onClick={() => {
                        const amount = contribution[g.id] ?? 0;
                        if (amount <= 0) return;
                        const beforePct = g.target > 0 ? (g.current / g.target) * 100 : 0;
                        contributeToGoal(g.id, amount);
                        const afterPct =
                          g.target > 0 ? ((g.current + amount) / g.target) * 100 : 0;
                        setContribution((prev) => ({ ...prev, [g.id]: 0 }));
                        toast.success(`Added ${formatMoney(amount, preferences.currency)} to ${g.name}`);
                        if (beforePct < 100 && afterPct >= 100) {
                          setShowConfetti(true);
                          toast.success(`Goal complete: ${g.name}!`, { duration: 5000 });
                        }
                      }}
                    >
                      Add money
                    </button>
                    <GhostButton onClick={() => openEdit(g)} aria-label={`Edit ${g.name}`}>
                      <Pencil className="h-4 w-4" />
                    </GhostButton>
                    <GhostButton onClick={() => handleDelete(g)} aria-label={`Delete ${g.name}`}>
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </GhostButton>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <ShellCard className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 font-semibold">
                <Target className="h-4 w-4 text-sky-400" />
                {editingId ? "Edit goal" : "New savings goal"}
              </p>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-neutral-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1">
                <FieldLabel>Name</FieldLabel>
                <ShellInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <FieldLabel>Target amount</FieldLabel>
                  <NumberField value={form.target} onChange={(target) => setForm((s) => ({ ...s, target }))} />
                </label>
                <label className="grid gap-1">
                  <FieldLabel>Current saved</FieldLabel>
                  <NumberField value={form.current} onChange={(current) => setForm((s) => ({ ...s, current }))} />
                </label>
              </div>
              <label className="grid gap-1">
                <FieldLabel>Target date</FieldLabel>
                <ShellInput type="date" value={form.targetDate} onChange={(e) => setForm((s) => ({ ...s, targetDate: e.target.value }))} />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1">
                  <FieldLabel>Icon</FieldLabel>
                  <ShellSelect value={form.icon} onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))}>
                    {GOAL_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </ShellSelect>
                </label>
                <label className="grid gap-1">
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {GOAL_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn("h-7 w-7 rounded-full border-2", form.color === color ? "border-white" : "border-transparent")}
                        style={{ backgroundColor: color }}
                        onClick={() => setForm((s) => ({ ...s, color }))}
                      />
                    ))}
                  </div>
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton onClick={() => setModalOpen(false)}>Cancel</GhostButton>
              <PrimaryButton onClick={saveGoal}>{editingId ? "Save changes" : "Create goal"}</PrimaryButton>
            </div>
          </ShellCard>
        </div>
      ) : null}
    </PageFrame>
  );
}
