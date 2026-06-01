"use client";

import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfettiBurst } from "@/components/ui/confetti-burst";
import { toast } from "sonner";
import { toastGoalComplete, toastGoalProgress } from "@/lib/feedback/app-feedback";
import { NumberField } from "@/components/fintech/number-field";
import {
  ColorSwatchPicker,
  FieldLabel,
  GhostButton,
  EmptyState,
  fintechForeground,
  fintechSurface,
  fintechLabel,
  fintechMuted,
  ModalOverlay,
  MotionSection,
  PageFrame,
  PrimaryButton,
  ProgressRing,
  ShellCard,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { ENTITY_COLOR_SWATCHES } from "@/lib/fintech/color-swatches";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { usePremium } from "@/hooks/use-premium";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { useAppDataStore, formatMoney } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import type { AppGoal } from "@/types/app-settings";
import {
  SINKING_FUND_TYPES,
  suggestBiWeeklyContribution,
  suggestMonthlyContribution,
  paychecksUntilTarget,
  fundProgressPct,
} from "@/lib/goals/sinking-fund";
import { useBudgetViewPeriod } from "@/hooks/use-budget-view-period";

const GOAL_ICONS = ["Target", "Shield", "Plane", "Home", "Car", "Gift"];

const emptyGoal = (): Omit<AppGoal, "id"> => ({
  name: "",
  target: 500,
  current: 0,
  targetDate: format(new Date(Date.now() + 90 * 86400000), "yyyy-MM-dd"),
  icon: "Target",
  color: ENTITY_COLOR_SWATCHES[0],
  fundType: "general",
  monthlyContribution: 0,
  notes: "",
});

const MILESTONES = [25, 50, 75, 100] as const;

function FundProgressTrack({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
        }}
      />
    </div>
  );
}

function GoalMilestones({ pct }: { pct: number }) {
  return (
    <div className="mt-4 flex justify-between gap-1">
      {MILESTONES.map((m) => {
        const reached = pct >= m;
        return (
          <div key={m} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "h-1.5 w-full rounded-full transition-colors duration-500",
                reached ? "bg-[var(--accent)]" : "bg-[var(--surface-elevated)]"
              )}
            />
            <span
              className={cn(
                "text-[9px] font-semibold uppercase tracking-wide",
                reached ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              {m}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function GoalsView() {
  const confirm = useConfirm();
  const { canAddGoal, demoMode } = usePremium();
  const goals = useAppDataStore((s) => s.goals);
  const addGoal = useAppDataStore((s) => s.addGoal);
  const updateGoal = useAppDataStore((s) => s.updateGoal);
  const deleteGoal = useAppDataStore((s) => s.deleteGoal);
  const contributeToGoal = useAppDataStore((s) => s.contributeToGoal);
  const preferences = useAppDataStore((s) => s.preferences);
  const recurring = useAppDataStore((s) => s.demoRecurring);
  const budgetPeriod = useBudgetViewPeriod(recurring);
  const useBiWeekly = budgetPeriod === "bi-weekly";

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
      fundType: goal.fundType ?? "general",
      monthlyContribution: goal.monthlyContribution ?? 0,
      notes: goal.notes ?? "",
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
      toast.success("Fund updated");
    } else {
      addGoal(form);
      toast.success("Fund created");
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
        toast.success("Fund deleted");
      },
    });
  };

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => b.current / b.target - a.current / a.target),
    [goals]
  );

  return (
    <PageFrame title="Sinking Funds" description="Set aside money for vacations, holidays, repairs, and other planned expenses.">
      <ConfettiBurst active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <MotionSection className="flex flex-wrap items-center justify-between gap-4">
        <p className={cn("text-sm", fintechMuted)}>Envelope-style funds with suggested monthly contributions</p>
        {(canAddGoal(goals.length) || demoMode) && (
          <PrimaryButton onClick={openCreate}>
            <Plus className="mr-1 inline h-4 w-4" />
            New fund
          </PrimaryButton>
        )}
      </MotionSection>
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
              const pct = fundProgressPct(g);
              const remaining = Math.max(0, g.target - g.current);
              const biweekly = suggestBiWeeklyContribution(g);
              const monthly = suggestMonthlyContribution(g);
              const paychecks = paychecksUntilTarget(g);
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={cn(fintechSurface, "p-4 transition-colors duration-200 sm:p-5")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-semibold", fintechForeground)}>{g.name}</p>
                      <p className={cn("mt-1 text-sm tabular-nums", fintechMuted)}>
                        {formatMoney(g.current, preferences.currency)} saved
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-[var(--positive)] tabular-nums">
                        {remaining > 0
                          ? `${formatMoney(remaining, preferences.currency)} to go`
                          : "Goal reached!"}
                      </p>
                      <p className={cn(fintechLabel, "mt-2 normal-case tracking-normal")}>
                        Target {format(parseISO(g.targetDate), "MMM d, yyyy")}
                        {paychecks > 0 ? ` · ${paychecks} paychecks left` : ""}
                      </p>
                      {remaining > 0 && (useBiWeekly ? biweekly > 0 : monthly > 0) ? (
                        <p className="mt-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2.5 py-1.5 text-xs font-medium text-[var(--accent)]">
                          {useBiWeekly
                            ? `Set aside ${formatMoney(biweekly, preferences.currency)} each paycheck`
                            : `Set aside ${formatMoney(monthly, preferences.currency)} per month`}
                        </p>
                      ) : null}
                    </div>
                    <ProgressRing
                      pct={pct}
                      color={g.color}
                      size={72}
                      label={`${Math.round(pct)}%`}
                    />
                  </div>
                  <FundProgressTrack pct={pct} color={g.color} />
                  <GoalMilestones pct={pct} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <NumberField
                      value={contribution[g.id] ?? 0}
                      onChange={(amount) => setContribution((prev) => ({ ...prev, [g.id]: amount }))}
                      placeholder="Amount"
                      className="w-28 px-2 py-1 text-sm"
                      aria-label={`Add to ${g.name}`}
                    />
                    <PrimaryButton
                      type="button"
                      className="!px-3 !py-1.5 !text-xs"
                      onClick={() => {
                        const amount = contribution[g.id] ?? 0;
                        if (amount <= 0) return;
                        const beforePct = g.target > 0 ? (g.current / g.target) * 100 : 0;
                        contributeToGoal(g.id, amount);
                        const afterPct =
                          g.target > 0 ? ((g.current + amount) / g.target) * 100 : 0;
                        setContribution((prev) => ({ ...prev, [g.id]: 0 }));
                        toastGoalProgress(g.name, formatMoney(amount, preferences.currency));
                        if (beforePct < 100 && afterPct >= 100) {
                          setShowConfetti(true);
                          toastGoalComplete(g.name);
                        }
                      }}
                    >
                      Add money
                    </PrimaryButton>
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

      <ModalOverlay
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit fund" : "New sinking fund"}
      >
            <div className="grid gap-3">
              <label className="grid gap-1">
                <FieldLabel>Name</FieldLabel>
                <ShellInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Vacation, Christmas, Car repair…" />
              </label>
              <label className="grid gap-1">
                <FieldLabel>Fund type</FieldLabel>
                <ShellSelect
                  value={form.fundType ?? "general"}
                  onChange={(e) => setForm((s) => ({ ...s, fundType: e.target.value as AppGoal["fundType"] }))}
                >
                  {SINKING_FUND_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </ShellSelect>
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
              <label className="grid gap-1">
                <FieldLabel>
                  {useBiWeekly ? "Planned per paycheck (optional)" : "Planned monthly (optional)"}
                </FieldLabel>
                <NumberField
                  value={form.monthlyContribution ?? 0}
                  onChange={(monthlyContribution) => setForm((s) => ({ ...s, monthlyContribution }))}
                />
                {form.target > form.current && form.targetDate ? (
                  <p className={cn("text-xs", fintechMuted)}>
                    Suggested:{" "}
                    {useBiWeekly
                      ? formatMoney(suggestBiWeeklyContribution(form as AppGoal), preferences.currency)
                      : formatMoney(suggestMonthlyContribution(form as AppGoal), preferences.currency)}{" "}
                    {useBiWeekly ? "per paycheck" : "per month"}
                  </p>
                ) : null}
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
                <label className="grid gap-1 sm:col-span-2">
                  <FieldLabel>Color</FieldLabel>
                  <ColorSwatchPicker
                    colors={ENTITY_COLOR_SWATCHES}
                    value={form.color}
                    onChange={(color) => setForm((s) => ({ ...s, color }))}
                  />
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <GhostButton onClick={() => setModalOpen(false)}>Cancel</GhostButton>
              <PrimaryButton onClick={saveGoal}>{editingId ? "Save changes" : "Create goal"}</PrimaryButton>
            </div>
      </ModalOverlay>
    </PageFrame>
  );
}
