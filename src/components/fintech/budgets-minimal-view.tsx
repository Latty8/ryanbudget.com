"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleDollarSign, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { toastBudgetSaved } from "@/lib/feedback/app-feedback";
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
  monthlyFromPeriodAmount,
  periodLabel,
  periodSpentLabel,
  sumBudgetTotals,
  type BudgetPeriod,
} from "@/lib/budget/period";
import {
  buildAutoRolloverPatches,
  currentBudgetPeriodKey,
} from "@/lib/budget/rollover";
import { useBudgetRolloverStore } from "@/store/useBudgetRolloverStore";
import { CATEGORY_PRESETS, presetToCategory } from "@/lib/categories/category-presets";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import {
  EmptyState,
  FieldLabel,
  fintechDisplay,
  fintechForeground,
  fintechLabel,
  fintechLink,
  fintechMuted,
  fintechSurface,
  GhostButton,
  ModalOverlay,
  MotionSection,
  PageFrame,
  PrimaryButton,
  ProgressRing,
  SegmentToggle,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { SetupOnboardingLink } from "@/components/fintech/setup-onboarding-link";
import { usePageCloudSync } from "@/hooks/use-page-cloud-sync";
import { useBudgetPeriodPreference, useBudgetViewPeriod, useSetBudgetPeriodPreference } from "@/hooks/use-budget-view-period";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { BudgetPeriodPreference, CategoryBudgetBehavior } from "@/types/app-settings";

const QUICK_PRESETS = CATEGORY_PRESETS.filter((p) =>
  ["utilities", "groceries", "gas", "subscriptions", "restaurants", "entertainment"].includes(p.presetId)
);

export function BudgetsMinimalView() {
  usePageCloudSync();
  const confirm = useConfirm();
  const categories = useAppDataStore((s) => s.categories);
  const transactions = useAppDataStore((s) => s.demoTransactions);
  const demoRecurring = useAppDataStore((s) => s.demoRecurring);
  const preferences = useAppDataStore((s) => s.preferences);
  const budgetPeriodPref = useBudgetPeriodPreference();
  const setBudgetPeriodPref = useSetBudgetPeriodPreference();
  const addCategory = useAppDataStore((s) => s.addCategory);
  const updateCategory = useAppDataStore((s) => s.updateCategory);
  const deleteCategory = useAppDataStore((s) => s.deleteCategory);

  const viewPeriod: BudgetPeriod = useBudgetViewPeriod(demoRecurring);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [amountForm, setAmountForm] = useState<BudgetAmountFormState>(() =>
    createBudgetAmountFormState({ monthly: 100, source: "bi-weekly" })
  );
  const [flashId, setFlashId] = useState<string | null>(null);
  const [formBehavior, setFormBehavior] = useState<CategoryBudgetBehavior>("fixed");

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.name !== "Income" && c.name !== "Uncategorized"),
    [categories]
  );

  const globalRollover = useBudgetRolloverStore((s) => s.globalRolloverEnabled);
  const setGlobalRollover = useBudgetRolloverStore((s) => s.setGlobalRolloverEnabled);
  const lastPeriodKey = useBudgetRolloverStore((s) => s.lastAppliedPeriodKey);
  const setLastPeriodKey = useBudgetRolloverStore((s) => s.setLastAppliedPeriodKey);

  const rows = useMemo(
    () =>
      computeCategoryBudgetRows(categories, transactions, viewPeriod, {
        globalRolloverEnabled: globalRollover,
      }),
    [categories, transactions, viewPeriod, globalRollover]
  );

  useEffect(() => {
    const key = currentBudgetPeriodKey(viewPeriod);
    if (lastPeriodKey === null) {
      setLastPeriodKey(key);
      return;
    }
    if (lastPeriodKey === key) return;
    const latestCategories = useAppDataStore.getState().categories;
    const latestTx = useAppDataStore.getState().demoTransactions;
    const latestRows = computeCategoryBudgetRows(latestCategories, latestTx, viewPeriod, {
      globalRolloverEnabled: globalRollover,
    });
    const patches = buildAutoRolloverPatches(latestCategories, latestRows, globalRollover);
    for (const patch of patches) {
      updateCategory(patch.id, { rolloverBalance: patch.rolloverBalance });
    }
    setLastPeriodKey(key);
  }, [lastPeriodKey, viewPeriod, globalRollover, updateCategory, setLastPeriodKey]);

  const displayRows = useMemo(
    () =>
      rows
        .filter((r) => r.name !== "Uncategorized")
        .sort((a, b) => b.pct - a.pct),
    [rows]
  );

  const { totalBudgeted, totalSpent, totalLeft, totalRollover, overallPct } =
    sumBudgetTotals(displayRows);

  const resetAllRollovers = () => {
    for (const cat of categories) {
      if ((cat.rolloverBalance ?? 0) > 0) {
        updateCategory(cat.id, { rolloverBalance: 0 });
      }
    }
    toast.success("Rollover balances cleared");
  };

  const applyRolloverNow = () => {
    const patches = buildAutoRolloverPatches(categories, rows, globalRollover);
    if (patches.length === 0) {
      toast.message("Nothing to roll over", {
        description: "Only categories with leftover funds and rollover enabled qualify.",
      });
      return;
    }
    for (const patch of patches) {
      updateCategory(patch.id, { rolloverBalance: patch.rolloverBalance });
    }
    toast.success(`Rolled over ${patches.length} categor${patches.length === 1 ? "y" : "ies"}`);
  };

  const setViewPeriod = (value: BudgetPeriodPreference) => {
    setBudgetPeriodPref(value);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setAmountForm(createBudgetAmountFormState({ monthly: 100, source: "bi-weekly" }));
    setModalOpen(true);
  };

  const openEdit = (id: string, name: string, monthlyBudgeted: number) => {
    const cat = categories.find((c) => c.id === id);
    setEditingId(id);
    setFormName(name);
    setFormBehavior(cat?.budgetBehavior ?? "fixed");
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
      updateCategory(editingId, { budgeted: monthly, budgetBehavior: formBehavior });
      setFlashId(editingId);
      toastBudgetSaved(true);
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
      const newId = useAppDataStore.getState().categories.at(-1)?.id ?? null;
      if (newId) setFlashId(newId);
      toastBudgetSaved(false);
    }
    window.setTimeout(() => setFlashId(null), 1200);
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
    <div className={cn(fintechSurface, "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4")}>
      <div className="min-w-0">
        <p className={fintechLabel}>View as</p>
        <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>
          {periodSpentLabel(viewPeriod)} of spending · {periodLabel(viewPeriod)} limits
        </p>
      </div>
      <SegmentToggle value={budgetPeriodPref} options={BUDGET_PERIOD_OPTIONS} onChange={setViewPeriod} className="w-full sm:w-auto" />
    </div>
  );

  const summaryCard = (
    <div
      className={cn(
        fintechSurface,
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
      <div className="grid grid-cols-3 gap-2 text-center sm:gap-6 sm:text-left">
        {(
          [
            ["Budgeted", totalBudgeted, false],
            ["Spent", totalSpent, false],
            ["Left", totalLeft, true],
          ] as const
        ).map(([label, value, positive]) => (
          <div key={label} className="min-w-0">
            <p className={cn(fintechLabel, "text-[10px] sm:text-xs")}>{label}</p>
            <p
              className={cn(
                "mt-1 text-base font-semibold tabular-nums tracking-tight sm:mt-2 sm:text-xl",
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
        <EmptyState
          icon={CircleDollarSign}
          title="No budget categories yet"
          description="Add categories with spending limits to see how much you have left before your next paycheck."
          action={
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <PrimaryButton type="button" onClick={openAdd}>
                <Plus className="mr-1.5 inline h-4 w-4" />
                Add budget
              </PrimaryButton>
              <SetupOnboardingLink className={cn("text-sm font-medium", fintechLink)}>
                Finish setup
              </SetupOnboardingLink>
            </div>
          }
        />
        <BudgetModal
          open={modalOpen}
          editingId={editingId}
          formName={formName}
          setFormName={setFormName}
          amountForm={amountForm}
          setAmountForm={setAmountForm}
          onQuickPreset={applyQuickPreset}
          onClose={() => setModalOpen(false)}
          formBehavior={formBehavior}
          setFormBehavior={setFormBehavior}
          onSave={saveBudget}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Budgets" description="Simple limits per category — calm and clear.">
      <MotionSection className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">{viewBar}</div>
          <PrimaryButton type="button" onClick={openAdd} className="w-full shrink-0 sm:w-auto">
            <Plus className="mr-1.5 inline h-4 w-4" />
            Add budget
          </PrimaryButton>
        </div>
      </MotionSection>

      <MotionSection delay={0.05} className="mt-6 space-y-4">
        <div
          className={cn(
            fintechSurface,
            "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          )}
        >
          <div>
            <p className={cn("text-sm font-medium", fintechForeground)}>Budget rollover</p>
            <p className={cn("mt-1 text-xs", fintechMuted)}>
              Carry unused funds to the next period. Per-category: set behavior to Rollover in edit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={globalRollover}
                onChange={(e) => setGlobalRollover(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
              />
              All categories
            </label>
            <GhostButton type="button" className="!text-xs" onClick={applyRolloverNow}>
              Rollover now
            </GhostButton>
            <GhostButton type="button" className="!text-xs" onClick={resetAllRollovers}>
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
              Reset
            </GhostButton>
          </div>
        </div>
        {summaryCard}
        {totalRollover > 0 ? (
          <p className={cn("text-center text-xs", fintechMuted)}>
            Includes{" "}
            <span className="font-medium text-[var(--accent)]">
              {formatMoney(totalRollover, preferences.currency)}
            </span>{" "}
            rolled over from prior periods
          </p>
        ) : null}
      </MotionSection>

      <MotionSection delay={0.1} className="mt-6">
        {displayRows.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title="No budgets set yet"
            description="Add a spending limit for groceries, utilities, or anything you track between paychecks."
            action={
              <PrimaryButton type="button" onClick={openAdd}>
                <Plus className="mr-1.5 inline h-4 w-4" />
                Add budget
              </PrimaryButton>
            }
          />
        ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {displayRows.map((row) => (
              <motion.div key={row.id} layout>
                <BudgetCategoryCard
                  row={row}
                  currency={preferences.currency}
                  highlight={flashId === row.id}
                  onEdit={() => openEdit(row.id, row.name, row.monthlyBudgeted)}
                  onDelete={() => handleDelete(row.id, row.name)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        )}
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
        formBehavior={formBehavior}
        setFormBehavior={setFormBehavior}
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
  formBehavior,
  setFormBehavior,
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
  formBehavior: CategoryBudgetBehavior;
  setFormBehavior: (v: CategoryBudgetBehavior) => void;
}) {
  return (
    <ModalOverlay
      open={open}
      onClose={onClose}
      title={editingId ? "Edit budget" : "Add budget"}
      variant="solid"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <GhostButton type="button" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </GhostButton>
          <PrimaryButton type="button" onClick={onSave} className="w-full sm:w-auto">
            Save
          </PrimaryButton>
        </div>
      }
    >
      <div className="grid gap-5 pb-1">
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
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-xs font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    <CategoryIconBadge icon={preset.icon} color={preset.color} size="sm" />
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
        {editingId ? (
          <label className="grid gap-1.5">
            <FieldLabel>Budget behavior</FieldLabel>
            <ShellSelect
              value={formBehavior}
              onChange={(e) => setFormBehavior(e.target.value as CategoryBudgetBehavior)}
            >
              <option value="fixed">Fixed (no rollover)</option>
              <option value="rollover">Rollover unused</option>
              <option value="flexible">Flexible</option>
            </ShellSelect>
          </label>
        ) : null}
      </div>
    </ModalOverlay>
  );
}
