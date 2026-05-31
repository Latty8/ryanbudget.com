"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { NumberField } from "@/components/fintech/number-field";
import {
  ColorSwatchPicker,
  FieldLabel,
  fintechMuted,
  PrimaryButton,
  SectionTitle,
  ShellCard,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import {
  type CategoryKind,
  expenseSubgroupsForSelect,
  getCategoryKind,
  groupForKind,
} from "@/lib/categories/category-kind";
import {
  BUDGET_BEHAVIOR_OPTIONS,
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_NAMES,
  CATEGORY_PRESETS,
  presetToCategory,
  type CategoryPreset,
} from "@/lib/categories/category-presets";
import { SYSTEM_UNCATEGORIZED_NAME } from "@/lib/categories/system-category";
import { cn } from "@/lib/utils";
import type { AppCategory } from "@/types/app-settings";

type Draft = Omit<AppCategory, "id"> & { kind: CategoryKind };

const emptyDraft = (): Draft => ({
  name: "",
  kind: "expense",
  group: "Miscellaneous",
  icon: "Sparkles",
  color: CATEGORY_COLOR_OPTIONS[0],
  budgeted: 0,
  budgetBehavior: "fixed",
});

type CategoryAddPanelProps = {
  existingCategoryNames: string[];
  existingGroups: string[];
  onAdd: (category: Omit<AppCategory, "id">) => void;
  onClose?: () => void;
};

export function CategoryAddPanel({
  existingCategoryNames,
  existingGroups,
  onAdd,
  onClose,
}: CategoryAddPanelProps) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [presetFilter, setPresetFilter] = useState<"all" | CategoryKind>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const subgroupOptions = useMemo(() => expenseSubgroupsForSelect(existingGroups), [existingGroups]);

  const filteredPresets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATEGORY_PRESETS.filter((p) => {
      const kind = getCategoryKind(p);
      if (presetFilter !== "all" && kind !== presetFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q);
    });
  }, [search, presetFilter]);

  const applyPreset = (preset: CategoryPreset) => {
    if (existingCategoryNames.some((n) => n.toLowerCase() === preset.name.toLowerCase())) {
      toast.error(`"${preset.name}" already exists`);
      return;
    }
    onAdd(presetToCategory(preset));
  };

  const saveCustom = () => {
    if (!draft.name.trim()) {
      toast.error("Enter a category name");
      return;
    }
    if (draft.name.trim().toLowerCase() === SYSTEM_UNCATEGORIZED_NAME.toLowerCase()) {
      toast.error(`"${SYSTEM_UNCATEGORIZED_NAME}" is reserved for system use`);
      return;
    }
    if (existingCategoryNames.some((n) => n.toLowerCase() === draft.name.trim().toLowerCase())) {
      toast.error("A category with this name already exists");
      return;
    }
    if (draft.budgeted < 0) {
      toast.error("Budget must be zero or more");
      return;
    }
    const { kind, ...rest } = draft;
    onAdd({
      ...rest,
      name: draft.name.trim(),
      group: groupForKind(kind, draft.group),
    });
    setDraft(emptyDraft());
  };

  return (
    <ShellCard className="border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div id="add-category" className="scroll-mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="Create a category"
          description="Choose a preset for common budgets, or build a custom category."
        />
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1"
            role="tablist"
            aria-label="Category creation mode"
          >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "preset"}
            onClick={() => setMode("preset")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              mode === "preset"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            Presets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "custom"}
            onClick={() => setMode("custom")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              mode === "custom"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            Custom
          </button>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              aria-label="Close add category panel"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {mode === "preset" ? (
        <div className="mt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ShellInput
              placeholder="Search presets (e.g. Utilities, Paycheck…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md flex-1"
            />
            <div className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-0.5">
              {(["all", "expense", "income"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPresetFilter(filter)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition",
                    presetFilter === filter
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  {filter === "all" ? "All" : filter === "income" ? "Income" : "Expenses"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid max-h-[min(420px,50vh)] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {filteredPresets.map((preset) => {
              const kind = getCategoryKind(preset);
              return (
                <button
                  key={preset.presetId}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                >
                  <CategoryIconBadge name={preset.icon} color={preset.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                      {preset.name}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--muted)]">
                      {kind === "income" ? "Income" : preset.group}
                    </span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
                </button>
              );
            })}
          </div>
          {filteredPresets.length === 0 ? (
            <p className={cn("mt-4 text-center text-sm", fintechMuted)}>No presets match your search.</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
              <FieldLabel>Name</FieldLabel>
              <ShellInput
                placeholder="e.g. Utilities"
                value={draft.name}
                onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>Type</FieldLabel>
              <ShellSelect
                value={draft.kind}
                onChange={(e) => {
                  const kind = e.target.value as CategoryKind;
                  setDraft((s) => ({
                    ...s,
                    kind,
                    group: kind === "income" ? "Income" : s.group === "Income" ? "Miscellaneous" : s.group,
                  }));
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </ShellSelect>
            </label>
            {draft.kind === "expense" ? (
              <label className="grid gap-1.5">
                <FieldLabel>Subtype (optional)</FieldLabel>
                <ShellSelect
                  value={draft.group === "Income" ? "Miscellaneous" : draft.group}
                  onChange={(e) => setDraft((s) => ({ ...s, group: e.target.value }))}
                >
                  {subgroupOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </ShellSelect>
              </label>
            ) : null}
            <label className="grid gap-1.5">
              <FieldLabel>Budget behavior</FieldLabel>
              <ShellSelect
                value={draft.budgetBehavior ?? "fixed"}
                onChange={(e) =>
                  setDraft((s) => ({
                    ...s,
                    budgetBehavior: e.target.value as Draft["budgetBehavior"],
                  }))
                }
              >
                {BUDGET_BEHAVIOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </ShellSelect>
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>Icon</FieldLabel>
              <ShellSelect
                value={draft.icon}
                onChange={(e) => setDraft((s) => ({ ...s, icon: e.target.value }))}
              >
                {CATEGORY_ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </ShellSelect>
            </label>
            <label className="grid gap-1.5">
              <FieldLabel>Monthly budget</FieldLabel>
              <NumberField
                value={draft.budgeted}
                onChange={(budgeted) => setDraft((s) => ({ ...s, budgeted }))}
              />
            </label>
          </div>
          <div>
            <FieldLabel>Color</FieldLabel>
            <ColorSwatchPicker
              className="mt-2"
              colors={CATEGORY_COLOR_OPTIONS}
              value={draft.color}
              onChange={(color) => setDraft((s) => ({ ...s, color }))}
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5">
            <CategoryIconBadge name={draft.icon} color={draft.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {draft.name.trim() || "Preview"}
              </p>
              <p className="truncate text-xs text-[var(--muted)]">
                {draft.kind === "income" ? "Income" : draft.group} ·{" "}
                {BUDGET_BEHAVIOR_OPTIONS.find((b) => b.value === draft.budgetBehavior)?.label}
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-[var(--muted)]" aria-hidden />
          </div>
          <PrimaryButton type="button" onClick={saveCustom}>
            <Plus className="mr-1 inline h-4 w-4" />
            Add custom category
          </PrimaryButton>
        </div>
      )}
      </div>
    </ShellCard>
  );
}
