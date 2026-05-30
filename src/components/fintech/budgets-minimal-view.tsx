"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  BudgetAmountForm,
  createBudgetAmountFormState,
  type BudgetAmountFormState,
} from "@/components/fintech/budget-amount-form";
import { BudgetCategoryCard } from "@/components/fintech/budget-category-card";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
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
import { CATEGORY_PRESETS, presetToCategory } from "@/lib/categories/category-presets";
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
  ProgressRing,
  SegmentToggle,
  ShellInput,
} from "@/components/fintech/ui";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { BudgetPeriodPreference } from "@/types/app-settings";

const QUICK_PRESETS = CATEGORY_PRESETS.filter((p) =>
  ["utilities", "groceries", "gas", "subscriptions", "restaurants", "entertainment"].includes(p.presetId)
);

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

  const applyQuickPreset = (presetId: string) => {
    const preset = CATEGORY_PRESETS.find((p) => p.presetId === presetId);
    if (!preset) return;
    if (categories.some((c) => c.name.toLowerCase() === preset.name.toLowerCase())) {
      toast.error(`"${preset.name}" already exists`);
      return;
    }
    const category = presetToCategory(preset);
    setFormName(category.name);
    setAmountForm(
      createBudgetAmountFormState({ monthly: category.budgeted, source: "bi-weekly" })
    );
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
      const preset = CATEGORY_PRESETS.find(
        (p) => p.name.toLowerCase() === formName.trim().toLowerCase()
      );
      if (preset) {
        addCategory({ ...presetToCategory(preset), budgeted: monthly });
      } else {
        addCategory({
          name: formName.trim(),
          group: "Miscellaneous",
          icon: "Sparkles",
          color: "#0d9488",
          budgeted: monthly,
          budgetBehavior: "fixed",
        });
      }
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
      <SegmentToggle value={viewPeriod} options={BUDGET_PERIOD_OPTIONS} onChange={setViewPeriod} />
    </div>
  );

  const summaryCard = (
    <div
      className={cn(
        fintechGlass,
        "grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-6"
      )}
    >
      <ProgressRing
        pct={overallPct}
        size={88}
        stroke={6}
        label={`${Math.round(overallPct)}%`}
        sublabel="used"
      />
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
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
                "mt-2 text-lg font-semibold tabular-nums tracking-tight sm:text-xl",
                positive ? "text-[var(--positive)]" : fintechDisplay
              )}
            >
              {formatMoney(value, preferences.currency)}
            </p>
          </div>
        ))}
      </div>
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
          onQuickPreset={applyQuickPreset}
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
        {summaryCard}
      </MotionSection>

      <MotionSection delay={0.1} className="mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {displayRows.map((row) => (
              <motion.div key={row.id} layout>
                <BudgetCategoryCard
                  row={row}
                  currency={preferences.currency}
                  onEdit={() => openEdit(row.id, row.name, row.monthlyBudgeted)}
                  onDelete={() => handleDelete(row.id, row.name)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </MotionSection>

      <BudgetModal
        open={modalOpen}
        editingId={editingId}
        formName={formName}
        setFormName={setFormName}
        amountForm={amountForm}
        setAmountForm={setAmountForm}
        onQuickPreset={applyQuickPreset}
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
  onQuickPreset,
  onClose,
  onSave,
}: {
  open: boolean;
  editingId: string | null;
  formName: string;
  setFormName: (v: string) => void;
  amountForm: BudgetAmountFormState;
  setAmountForm: (s: BudgetAmountFormState) => void;
  onQuickPreset: (presetId: string) => void;
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
          <>
            <label className="grid gap-1.5">
              <FieldLabel>Category name</FieldLabel>
              <ShellInput
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Utilities"
              />
            </label>
            <div>
              <FieldLabel>Quick presets</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.presetId}
                    type="button"
                    onClick={() => onQuickPreset(preset.presetId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    <CategoryIconBadge name={preset.icon} color={preset.color} size="sm" />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </>
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
