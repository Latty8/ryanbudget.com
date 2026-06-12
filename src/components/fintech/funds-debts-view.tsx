"use client";

import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
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
  SegmentToggle,
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
import type { AppGoal, FundKind } from "@/types/app-settings";
import {
  SINKING_FUND_TYPES,
  suggestBiWeeklyContribution,
  suggestMonthlyContribution,
  paychecksUntilTarget,
  fundProgressPct,
} from "@/lib/goals/sinking-fund";
import { debtProgressPct, projectDebtPayoff } from "@/lib/funds/debt-payoff";
import { fundKind, isDebtFund } from "@/lib/funds/fund-kind";
import { useBudgetViewPeriod } from "@/hooks/use-budget-view-period";

const GOAL_ICONS = ["Target", "Shield", "Plane", "Home", "Car", "Gift", "CreditCard"];
const DEBT_ICONS = ["CreditCard", "Car", "Home", "Target"];

type FilterTab = "all" | "sinking" | "debt";

const emptySinking = (): Omit<AppGoal, "id"> => ({
  kind: "sinking",
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

const emptyDebt = (): Omit<AppGoal, "id"> => ({
  kind: "debt",
  name: "",
  target: 0,
  current: 0,
  targetDate: "",
  icon: "CreditCard",
  color: ENTITY_COLOR_SWATCHES[3],
  monthlyPayment: 0,
  interestRateApy: 0,
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

function Milestones({ pct }: { pct: number }) {
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

export function FundsDebtsView() {
  const confirm = useConfirm();
  const { canAddGoal, demoMode } = usePremium();
  const goals = useAppDataStore((s) => s.goals);
  const addGoal = useAppDataStore((s) => s.addGoal);
  const updateGoal = useAppDataStore((s) => s.updateGoal);
  const deleteGoal = useAppDataStore((s) => s.deleteGoal);
  const contributeToGoal = useAppDataStore((s) => s.contributeToGoal);
  const payDownDebt = useAppDataStore((s) => s.payDownDebt);
  const preferences = useAppDataStore((s) => s.preferences);
  const recurring = useAppDataStore((s) => s.demoRecurring);
  const budgetPeriod = useBudgetViewPeriod(recurring);
  const useBiWeekly = budgetPeriod === "bi-weekly";

  const [filter, setFilter] = useState<FilterTab>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKind, setFormKind] = useState<FundKind>("sinking");
  const [form, setForm] = useState(emptySinking());
  const [contribution, setContribution] = useState<Record<string, number>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  const openCreate = (kind: FundKind = "sinking") => {
    if (!canAddGoal(goals.length) && !demoMode) return;
    setEditingId(null);
    setFormKind(kind);
    setForm(kind === "debt" ? emptyDebt() : emptySinking());
    setModalOpen(true);
  };

  const openEdit = (goal: AppGoal) => {
    const kind = fundKind(goal);
    setEditingId(goal.id);
    setFormKind(kind);
    setForm({
      kind,
      name: goal.name,
      target: goal.target,
      current: goal.current,
      targetDate: goal.targetDate,
      icon: goal.icon,
      color: goal.color,
      fundType: goal.fundType ?? "general",
      monthlyContribution: goal.monthlyContribution ?? 0,
      monthlyPayment: goal.monthlyPayment ?? 0,
      interestRateApy: goal.interestRateApy ?? 0,
      notes: goal.notes ?? "",
    });
    setModalOpen(true);
  };

  const saveFund = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (formKind === "sinking") {
      if (form.target <= 0) {
        toast.error("Target amount is required");
        return;
      }
    } else {
      if (form.current <= 0) {
        toast.error("Remaining balance is required");
        return;
      }
      if ((form.monthlyPayment ?? 0) <= 0) {
        toast.error("Monthly payment is required");
        return;
      }
    }

    const payload: Omit<AppGoal, "id"> = {
      ...form,
      kind: formKind,
      target:
        formKind === "debt"
          ? form.target > 0
            ? form.target
            : form.current
          : form.target,
    };

    if (editingId) {
      updateGoal(editingId, payload);
      toast.success(formKind === "debt" ? "Debt updated" : "Fund updated");
    } else {
      addGoal(payload);
      toast.success(formKind === "debt" ? "Debt added" : "Fund created");
    }
    setModalOpen(false);
  };

  const handleDelete = (goal: AppGoal) => {
    void confirm({
      title: `Delete "${goal.name}"?`,
      description: isDebtFund(goal)
        ? "This debt tracker will be permanently removed."
        : "This savings fund will be permanently removed.",
      warning: "This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteGoal(goal.id);
        toast.success("Removed");
      },
    });
  };

  const filteredGoals = useMemo(() => {
    const list =
      filter === "all"
        ? goals
        : goals.filter((g) => fundKind(g) === (filter === "debt" ? "debt" : "sinking"));
    return [...list].sort((a, b) => {
      const pctA = isDebtFund(a)
        ? debtProgressPct(a.target || a.current, a.current)
        : fundProgressPct(a);
      const pctB = isDebtFund(b)
        ? debtProgressPct(b.target || b.current, b.current)
        : fundProgressPct(b);
      return pctB - pctA;
    });
  }, [goals, filter]);

  const sinkingCount = goals.filter((g) => !isDebtFund(g)).length;
  const debtCount = goals.filter((g) => isDebtFund(g)).length;

  return (
    <PageFrame
      title="Funds & Debts"
      description="Sinking funds for planned savings and debts you're paying down — all in one calm view."
    >
      <ConfettiBurst active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <MotionSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentToggle
            value={filter}
            options={[
              { value: "all", label: `All (${goals.length})` },
              { value: "sinking", label: `Sinking (${sinkingCount})` },
              { value: "debt", label: `Debts (${debtCount})` },
            ]}
            onChange={setFilter}
          />
          {(canAddGoal(goals.length) || demoMode) && (
            <div className="flex flex-wrap gap-2">
              <PrimaryButton onClick={() => openCreate("sinking")}>
                <Plus className="mr-1 inline h-4 w-4" />
                Sinking fund
              </PrimaryButton>
              <GhostButton onClick={() => openCreate("debt")}>
                <CreditCard className="mr-1 inline h-4 w-4" />
                Add debt
              </GhostButton>
            </div>
          )}
        </div>
      </MotionSection>

      {!canAddGoal(goals.length) && !demoMode && goals.length >= 1 ? (
        <div className="mb-4">
          <UpgradePrompt
            feature="unlimited_goals"
            title="More funds on Premium"
            description="Free plan includes 1 fund or debt. Upgrade for unlimited tracking."
          />
        </div>
      ) : null}

      {filteredGoals.length === 0 ? (
        <ShellCard className="p-0">
          <EmptyState
            icon={filter === "debt" ? CreditCard : PiggyBank}
            title={filter === "debt" ? "No debts tracked yet" : "No sinking funds yet"}
            description={
              filter === "debt"
                ? "Add car loans, student loans, or credit cards to see payoff progress."
                : "Add vacation, emergency, or holiday funds — we'll celebrate when you hit 100%."
            }
            action={
              canAddGoal(goals.length) || demoMode ? (
                <PrimaryButton onClick={() => openCreate(filter === "debt" ? "debt" : "sinking")}>
                  {filter === "debt" ? "Add a debt" : "Create your first fund"}
                </PrimaryButton>
              ) : undefined
            }
          />
        </ShellCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredGoals.map((g) => {
              const debt = isDebtFund(g);
              const original = debt ? g.target || g.current : g.target;
              const pct = debt
                ? debtProgressPct(original, g.current)
                : fundProgressPct(g);
              const payoff =
                debt && (g.monthlyPayment ?? 0) > 0
                  ? projectDebtPayoff({
                      balanceRemaining: g.current,
                      monthlyPayment: g.monthlyPayment!,
                      interestRateApy: g.interestRateApy,
                    })
                  : null;

              if (debt) {
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
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[var(--muted)]" aria-hidden />
                          <p className={cn("font-semibold", fintechForeground)}>{g.name}</p>
                        </div>
                        <p className={cn("mt-1 text-sm tabular-nums", fintechMuted)}>
                          {formatMoney(g.current, preferences.currency)} remaining
                        </p>
                        {(g.monthlyPayment ?? 0) > 0 ? (
                          <p className="mt-0.5 text-sm font-medium tabular-nums">
                            {formatMoney(g.monthlyPayment!, preferences.currency)}/mo
                            {g.interestRateApy ? (
                              <span className={cn("ml-1 font-normal", fintechMuted)}>
                                · {g.interestRateApy}% APR
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                        {payoff ? (
                          <p className={cn(fintechLabel, "mt-2 normal-case tracking-normal")}>
                            Payoff ~{format(parseISO(payoff.payoffDate), "MMM yyyy")}
                            {payoff.months > 0 ? ` · ${payoff.months} payments` : ""}
                          </p>
                        ) : g.current > 0 ? (
                          <p className={cn("mt-2 text-xs", fintechMuted)}>
                            Add a monthly payment to see payoff projection
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
                    <Milestones pct={pct} />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <NumberField
                        value={contribution[g.id] ?? 0}
                        onChange={(amount) =>
                          setContribution((prev) => ({ ...prev, [g.id]: amount }))
                        }
                        placeholder="Payment"
                        className="w-28 px-2 py-1 text-sm"
                        aria-label={`Payment toward ${g.name}`}
                      />
                      <PrimaryButton
                        type="button"
                        className="!px-3 !py-1.5 !text-xs"
                        onClick={() => {
                          const amount = contribution[g.id] ?? 0;
                          if (amount <= 0) return;
                          const before = g.current;
                          payDownDebt(g.id, amount);
                          setContribution((prev) => ({ ...prev, [g.id]: 0 }));
                          toast.success(
                            `${formatMoney(amount, preferences.currency)} toward ${g.name}`
                          );
                          if (before > 0 && before - amount <= 0) {
                            setShowConfetti(true);
                            toastGoalComplete(g.name);
                          }
                        }}
                      >
                        Record payment
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
              }

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
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-[var(--muted)]" aria-hidden />
                        <p className={cn("font-semibold", fintechForeground)}>{g.name}</p>
                      </div>
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
                    <ProgressRing pct={pct} color={g.color} size={72} label={`${Math.round(pct)}%`} />
                  </div>
                  <FundProgressTrack pct={pct} color={g.color} />
                  <Milestones pct={pct} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <NumberField
                      value={contribution[g.id] ?? 0}
                      onChange={(amount) =>
                        setContribution((prev) => ({ ...prev, [g.id]: amount }))
                      }
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
        title={
          editingId
            ? formKind === "debt"
              ? "Edit debt"
              : "Edit fund"
            : formKind === "debt"
              ? "New debt"
              : "New sinking fund"
        }
      >
        <div className="grid gap-3">
          {!editingId ? (
            <div className="grid gap-1">
              <FieldLabel>Type</FieldLabel>
              <SegmentToggle
                value={formKind}
                options={[
                  { value: "sinking", label: "Sinking fund" },
                  { value: "debt", label: "Debt" },
                ]}
                onChange={(k) => {
                  setFormKind(k as FundKind);
                  setForm(k === "debt" ? emptyDebt() : emptySinking());
                }}
              />
            </div>
          ) : null}

          <label className="grid gap-1">
            <FieldLabel>Name</FieldLabel>
            <ShellInput
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder={
                formKind === "debt"
                  ? "Car loan, student loan, credit card…"
                  : "Vacation, Christmas, Car repair…"
              }
            />
          </label>

          {formKind === "sinking" ? (
            <>
              <label className="grid gap-1">
                <FieldLabel>Fund type</FieldLabel>
                <ShellSelect
                  value={form.fundType ?? "general"}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, fundType: e.target.value as AppGoal["fundType"] }))
                  }
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
                  <NumberField
                    value={form.target}
                    onChange={(target) => setForm((s) => ({ ...s, target }))}
                  />
                </label>
                <label className="grid gap-1">
                  <FieldLabel>Current saved</FieldLabel>
                  <NumberField
                    value={form.current}
                    onChange={(current) => setForm((s) => ({ ...s, current }))}
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <FieldLabel>Target date</FieldLabel>
                <ShellInput
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((s) => ({ ...s, targetDate: e.target.value }))}
                />
              </label>
              <label className="grid gap-1">
                <FieldLabel>
                  {useBiWeekly ? "Planned per paycheck (optional)" : "Planned monthly (optional)"}
                </FieldLabel>
                <NumberField
                  value={form.monthlyContribution ?? 0}
                  onChange={(monthlyContribution) =>
                    setForm((s) => ({ ...s, monthlyContribution }))
                  }
                />
              </label>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <FieldLabel>Remaining balance</FieldLabel>
                  <NumberField
                    value={form.current}
                    onChange={(current) => setForm((s) => ({ ...s, current }))}
                  />
                </label>
                <label className="grid gap-1">
                  <FieldLabel>Original balance (optional)</FieldLabel>
                  <NumberField
                    value={form.target}
                    onChange={(target) => setForm((s) => ({ ...s, target }))}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <FieldLabel>Monthly payment</FieldLabel>
                  <NumberField
                    value={form.monthlyPayment ?? 0}
                    onChange={(monthlyPayment) => setForm((s) => ({ ...s, monthlyPayment }))}
                  />
                </label>
                <label className="grid gap-1">
                  <FieldLabel>Interest rate % (optional)</FieldLabel>
                  <NumberField
                    value={form.interestRateApy ?? 0}
                    onChange={(interestRateApy) => setForm((s) => ({ ...s, interestRateApy }))}
                  />
                </label>
              </div>
            </>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1">
              <FieldLabel>Icon</FieldLabel>
              <ShellSelect
                value={form.icon}
                onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))}
              >
                {(formKind === "debt" ? DEBT_ICONS : GOAL_ICONS).map((icon) => (
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
          <PrimaryButton onClick={saveFund}>
            {editingId ? "Save changes" : formKind === "debt" ? "Add debt" : "Create fund"}
          </PrimaryButton>
        </div>
      </ModalOverlay>
    </PageFrame>
  );
}

/** @deprecated Use FundsDebtsView */
export const GoalsView = FundsDebtsView;
