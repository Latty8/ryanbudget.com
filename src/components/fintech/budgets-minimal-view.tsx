"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  BudgetAmountForm,
  createBudgetAmountFormState,
  type BudgetAmountFormState,
} from "@/components/fintech/budget-amount-form";
import {
  BUDGET_PERIOD_OPTIONS,
  budgetAmountsFromMonthly,
  computeCategoryBudgetRows,
  getEffectiveBudgetPeriod,
  monthlyFromPeriodAmount,
  periodLabel,
  periodSpentLabel,
  sumBudgetTotals,
  type BudgetPeriod,
} from "@/lib/budget/period";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  FieldLabel,
  fintechDisplay,
  fintechForeground,
  fintechGlass,
  fintechLabel,
  fintechLink,
  fintechMuted,
  GhostButton,
  ModalOverlay,
  MotionSection,
  PageFrame,
  PrimaryButton,
  ProgressBar,
  ProgressRing,
  SegmentToggle,
  ShellInput,
} from "@/components/fintech/ui";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { BudgetPeriodPreference } from "@/types/app-settings";

export function BudgetsMinimalView() {
  const confirm = useConfirm();
  const categories = useAppDataStore((s) => s.categories);
  const transactions = useAppDataStore((s) => s.demoTransactions);
  const demoRecurring = useAppDataStore((s) => s.demoRecurring);
  const preferences = useAppDataStore((s) => s.preferences);
  const setPreferences = useAppDataStore((s) => s.setPreferences);
  const addCategory = useAppDataStore((s) => s.addCategory);
  const updateCategory = useAppDataStore((s) => s.updateCategory);
  const deleteCategory = useAppDataStore((s) => s.deleteCategory);

  const viewPeriod: BudgetPeriod = getEffectiveBudgetPeriod(
    preferences.budgetPeriod,
    demoRecurring
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [amountForm, setAmountForm] = useState<BudgetAmountFormState>(() =>
    createBudgetAmountFormState({ monthly: 100, source: "bi-weekly" })
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.name !== "Income" && c.name !== "Uncategorized"),
    [categories]
  );

  const rows = useMemo(
    () => computeCategoryBudgetRows(categories, transactions, viewPeriod),
    [categories, transactions, viewPeriod]
  );

  const displayRows = useMemo(
    () =>
      rows
        .filter((r) => r.name !== "Uncategorized")
        .sort((a, b) => b.pct - a.pct),
    [rows]
  );

  const { totalBudgeted, totalSpent, totalLeft, overallPct } = sumBudgetTotals(displayRows);

  const setViewPeriod = (value: BudgetPeriodPreference) => {
    setPreferences({ budgetPeriod: value });
  };

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setAmountForm(createBudgetAmountFormState({ monthly: 100, source: "bi-weekly" }));
    setModalOpen(true);
  };

  const openEdit = (id: string, name: string, monthlyBudgeted: number) => {
    setEditingId(id);
    setFormName(name);
    setAmountForm({
      amounts: budgetAmountsFromMonthly(monthlyBudgeted),
      source: "bi-weekly",
    });
    setModalOpen(true);
  };

  const saveBudget = () => {
    if (!editingId && !formName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const monthly = monthlyFromPeriodAmount(
      amountForm.amounts[amountForm.source],
      amountForm.source
    );
    if (monthly < 0) {
      toast.error("Budget must be zero or more");
      return;
    }
    if (editingId) {
      updateCategory(editingId, { budgeted: monthly });
      toast.success("Budget updated");
    } else {
      addCategory({
        name: formName.trim(),
        group: "Custom",
        icon: "CircleDollarSign",
        color: "#0d9488",
        budgeted: monthly,
      });
      toast.success("Budget added");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    void confirm({
      title: "Delete Budget?",
      description:
        "This action cannot be undone and will remove all progress tracking for this category.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteCategory(id);
        toast.success("Budget deleted");
      },
    });
  };

  const viewBar = (
    <div className={cn(fintechGlass, "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between")}>
      <div>
        <p className={fintechLabel}>View as</p>
        <p className={cn("mt-1 text-xs", fintechMuted)}>
          {periodSpentLabel(viewPeriod)} of spending · {periodLabel(viewPeriod)} limits
        </p>
      </div>
      <SegmentToggle
        value={viewPeriod}
        options={BUDGET_PERIOD_OPTIONS}
        onChange={setViewPeriod}
      />
    </div>
  );

  if (expenseCategories.length === 0) {
    return (
      <PageFrame title="Budgets" description="Simple limits per category — calm and clear.">
        {viewBar}
        <div className={cn(fintechGlass, "p-10 text-center")}>
          <p className={cn("text-sm", fintechMuted)}>No categories yet.</p>
          <SetupOnboardingLink className={cn("mt-4 inline-block text-sm font-medium", fintechLink)}>
            Finish setup
          </SetupOnboardingLink>
        </div>
        <BudgetModal
          open={modalOpen}
          editingId={editingId}
          formName={formName}
          setFormName={setFormName}
          amountForm={amountForm}
          setAmountForm={setAmountForm}
          onClose={() => setModalOpen(false)}
          onSave={saveBudget}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Budgets" description="Simple limits per category — calm and clear.">
      <MotionSection className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
          <div className="min-w-0 flex-1">{viewBar}</div>
          <PrimaryButton type="button" onClick={openAdd} className="shrink-0 self-end sm:self-center">
            <Plus className="mr-1.5 inline h-4 w-4" />
            Add budget
          </PrimaryButton>
        </div>
      </MotionSection>

      <MotionSection delay={0.05} className="mt-6">
        <div
          className={cn(
            fintechGlass,
            "grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10 sm:p-8"
          )}
        >
          <ProgressRing
            pct={overallPct}
            size={100}
            label={`${Math.round(overallPct)}%`}
            sublabel="used"
          />
          <div className="grid grid-cols-3 gap-6">
            {(
              [
                ["Budgeted", totalBudgeted, false],
                ["Spent", totalSpent, false],
                ["Left", totalLeft, true],
              ] as const
            ).map(([label, value, positive]) => (
              <div key={label}>
                <p className={fintechLabel}>{label}</p>
                <p
                  className={cn(
                    "mt-2 text-xl font-semibold tabular-nums tracking-tight",
                    positive ? "text-[var(--positive)]" : fintechDisplay
                  )}
                >
                  {formatMoney(value, preferences.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection delay={0.1} className="mt-8">
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {displayRows.map((row) => (
              <motion.li
                key={row.id}
                layout
                className={cn(
                  fintechGlass,
                  "group px-5 py-5 transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
                )}
              >
                <div className="flex items-center gap-4">
                  <ProgressRing
                    pct={row.pct}
                    color={row.over ? "var(--negative)" : row.color}
                    size={52}
                    stroke={5}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn("truncate font-semibold", fintechForeground)}>{row.name}</p>
                        <p className={cn("mt-1 text-sm tabular-nums", fintechMuted)}>
                          <span className={cn("font-medium", fintechForeground)}>
                            {formatMoney(row.spent, preferences.currency)}
                          </span>
                          {" "}
                          of {formatMoney(row.budgeted, preferences.currency)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(row.id, row.name, row.monthlyBudgeted)}
                          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                          aria-label={`Edit ${row.name}`}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(row.id, row.name);
                          }}
                          className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10"
                          aria-label={`Delete ${row.name}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                    <ProgressBar pct={row.pct} over={row.over} className="mt-4" />
                    <p
                      className={cn(
                        "mt-2 text-xs font-medium",
                        row.over ? "text-[var(--negative)]" : "text-[var(--positive)]"
                      )}
                    >
                      {row.over
                        ? `Over by ${formatMoney(Math.abs(row.remaining), preferences.currency)}`
                        : `${formatMoney(row.remaining, preferences.currency)} left`}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </MotionSection>

      <BudgetModal
        open={modalOpen}
        editingId={editingId}
        formName={formName}
        setFormName={setFormName}
        amountForm={amountForm}
        setAmountForm={setAmountForm}
        onClose={() => setModalOpen(false)}
        onSave={saveBudget}
      />
    </PageFrame>
  );
}

function BudgetModal({
  open,
  editingId,
  formName,
  setFormName,
  amountForm,
  setAmountForm,
  onClose,
  onSave,
}: {
  open: boolean;
  editingId: string | null;
  formName: string;
  setFormName: (v: string) => void;
  amountForm: BudgetAmountFormState;
  setAmountForm: (s: BudgetAmountFormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <ModalOverlay
      open={open}
      onClose={onClose}
      title={editingId ? "Edit budget" : "Add budget"}
      variant="solid"
    >
      <div className="grid gap-5">
        {!editingId ? (
          <label className="grid gap-1.5">
            <FieldLabel>Category name</FieldLabel>
            <ShellInput
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Dining out"
            />
          </label>
        ) : (
          <p className={cn("text-sm font-medium", fintechForeground)}>{formName}</p>
        )}
        <BudgetAmountForm state={amountForm} onChange={setAmountForm} />
        <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={onSave}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </ModalOverlay>
  );
}
