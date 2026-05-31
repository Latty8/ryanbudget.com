"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { NumberField } from "@/components/fintech/number-field";
import {
  FieldLabel,
  GhostButton,
  PrimaryButton,
  ProgressBar,
  ShellInput,
  ShellSelect,
  fintechMuted,
} from "@/components/fintech/ui";
import type { CategoryKind } from "@/lib/categories/category-kind";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { AppCategory, CurrencyCode } from "@/types/app-settings";

type CategoryRowProps = {
  category: AppCategory;
  spent: number;
  kind: CategoryKind;
  isSystem: boolean;
  isEditing: boolean;
  groupOptions: string[];
  iconOptions: string[];
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: Partial<AppCategory>) => void;
  onDelete: () => void;
  variant: "table" | "card";
};

function useCategoryMetrics(category: AppCategory, spent: number) {
  const budgeted = category.budgeted;
  const pct = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0;
  const over = spent > budgeted && budgeted > 0;
  const remaining = budgeted - spent;
  return { budgeted, pct, over, remaining };
}

function KindBadge({ kind }: { kind: CategoryKind }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        kind === "income"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-[var(--surface-elevated)] text-[var(--muted)]"
      )}
    >
      {kind === "income" ? "Income" : "Expense"}
    </span>
  );
}

function SystemBadge() {
  return (
    <span className="inline-flex rounded-md bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
      System
    </span>
  );
}

function CategoryEditForm({
  draft,
  setDraft,
  groupOptions,
  iconOptions,
  isSystem,
  onCancel,
  onSave,
}: {
  draft: AppCategory;
  setDraft: React.Dispatch<React.SetStateAction<AppCategory>>;
  groupOptions: string[];
  iconOptions: string[];
  isSystem: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-4 sm:px-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <FieldLabel>Name</FieldLabel>
          <ShellInput
            value={draft.name}
            disabled={isSystem}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
            aria-label="Category name"
          />
          {isSystem ? (
            <p className={cn("text-[11px]", fintechMuted)}>System categories cannot be renamed.</p>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <FieldLabel>Group</FieldLabel>
          <ShellSelect
            value={draft.group}
            onChange={(e) => setDraft((s) => ({ ...s, group: e.target.value }))}
            aria-label="Category group"
          >
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </ShellSelect>
        </label>
        <label className="grid gap-1.5">
          <FieldLabel>Icon</FieldLabel>
          <ShellSelect
            value={draft.icon}
            onChange={(e) => setDraft((s) => ({ ...s, icon: e.target.value }))}
            aria-label="Category icon"
          >
            {iconOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </ShellSelect>
        </label>
        <label className="grid gap-1.5">
          <FieldLabel>Color</FieldLabel>
          <ShellInput
            type="color"
            value={draft.color}
            onChange={(e) => setDraft((s) => ({ ...s, color: e.target.value }))}
            aria-label="Category color"
            className="h-10 cursor-pointer p-1"
          />
        </label>
        <label className="grid gap-1.5">
          <FieldLabel>Monthly budget</FieldLabel>
          <NumberField
            value={draft.budgeted}
            onChange={(budgeted) => setDraft((s) => ({ ...s, budgeted }))}
            aria-label="Category budget"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <GhostButton type="button" onClick={onCancel}>
          Cancel
        </GhostButton>
        <PrimaryButton type="button" onClick={onSave} className="min-h-10 px-4 py-2 shadow-sm">
          Save changes
        </PrimaryButton>
      </div>
    </div>
  );
}

function CategoryActions({
  isSystem,
  isEditing,
  onStartEdit,
  onDelete,
}: {
  isSystem: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onDelete: () => void;
}) {
  if (isEditing) return null;
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onStartEdit}
        className="rounded-md border border-transparent p-2 text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        aria-label="Edit category"
      >
        <Pencil className="h-4 w-4" />
      </button>
      {!isSystem ? (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-transparent p-2 text-rose-500 transition hover:border-rose-500/20 hover:bg-rose-500/10"
          aria-label="Delete category"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function ProgressCell({
  spent,
  budgeted,
  pct,
  over,
  remaining,
  currency,
  accentColor,
}: {
  spent: number;
  budgeted: number;
  pct: number;
  over: boolean;
  remaining: number;
  currency: CurrencyCode;
  accentColor: string;
}) {
  return (
    <div className="min-w-[120px] space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={cn("font-medium tabular-nums", over ? "text-[var(--negative)]" : "text-[var(--foreground)]")}>
          {formatMoney(spent, currency)}
        </span>
        <span className={cn("tabular-nums", fintechMuted)}>
          / {formatMoney(budgeted, currency)}
        </span>
      </div>
      <ProgressBar pct={pct} over={over} size="slim" accentColor={accentColor} />
      <p className={cn("text-[11px] tabular-nums", over ? "text-[var(--negative)]" : fintechMuted)}>
        {budgeted <= 0
          ? "No budget"
          : over
            ? `${formatMoney(Math.abs(remaining), currency)} over`
            : `${formatMoney(remaining, currency)} left`}
      </p>
    </div>
  );
}

export function CategoryRow({
  category,
  spent,
  kind,
  isSystem,
  isEditing,
  groupOptions,
  iconOptions,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  variant,
}: CategoryRowProps) {
  const currency = useAppDataStore((s) => s.preferences.currency);
  const [draft, setDraft] = useState(category);
  const { budgeted, pct, over, remaining } = useCategoryMetrics(category, spent);

  useEffect(() => {
    if (isEditing) setDraft(category);
  }, [isEditing, category.id]); // eslint-disable-line react-hooks/exhaustive-deps -- seed draft only when opening editor

  const handleSave = () => {
    onSave({
      name: draft.name.trim() || category.name,
      group: draft.group,
      icon: draft.icon,
      color: draft.color,
      budgeted: draft.budgeted,
    });
  };

  if (variant === "table") {
    return (
      <>
        <tr
          className={cn(
            "border-b border-[var(--border-subtle)] transition-colors",
            isEditing ? "bg-[var(--surface-elevated)]" : "hover:bg-[var(--surface-hover)]/50"
          )}
        >
          <td className="py-3 pl-4 pr-3">
            <div className="flex items-center gap-3">
              <CategoryIconBadge name={category.icon} color={category.color} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{category.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <KindBadge kind={kind} />
                  {isSystem ? <SystemBadge /> : null}
                </div>
              </div>
            </div>
          </td>
          <td className="hidden px-3 py-3 text-sm text-[var(--muted)] xl:table-cell">{category.group}</td>
          <td className="px-3 py-3">
            <ProgressCell
              spent={spent}
              budgeted={budgeted}
              pct={pct}
              over={over}
              remaining={remaining}
              currency={currency}
              accentColor={category.color}
            />
          </td>
          <td className="py-3 pl-3 pr-4 text-right">
            <CategoryActions
              isSystem={isSystem}
              isEditing={isEditing}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
            />
          </td>
        </tr>
        {isEditing ? (
          <tr className="border-b border-[var(--border-subtle)]">
            <td colSpan={4} className="p-0">
              <CategoryEditForm
                draft={draft}
                setDraft={setDraft}
                groupOptions={groupOptions}
                iconOptions={iconOptions}
                isSystem={isSystem}
                onCancel={onCancelEdit}
                onSave={handleSave}
              />
            </td>
          </tr>
        ) : null}
      </>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm",
        isEditing && "border-[var(--border-strong)]"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <CategoryIconBadge name={category.icon} color={category.color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-[var(--foreground)]">{category.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <KindBadge kind={kind} />
                <span className={cn("text-xs", fintechMuted)}>{category.group}</span>
                {isSystem ? <SystemBadge /> : null}
              </div>
            </div>
            <CategoryActions
              isSystem={isSystem}
              isEditing={isEditing}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
            />
          </div>
          <div className="mt-3">
            <ProgressCell
              spent={spent}
              budgeted={budgeted}
              pct={pct}
              over={over}
              remaining={remaining}
              currency={currency}
              accentColor={category.color}
            />
          </div>
        </div>
      </div>
      {isEditing ? (
        <CategoryEditForm
          draft={draft}
          setDraft={setDraft}
          groupOptions={groupOptions}
          iconOptions={iconOptions}
          isSystem={isSystem}
          onCancel={onCancelEdit}
          onSave={handleSave}
        />
      ) : null}
    </article>
  );
}
