"use client";

import { ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { ElevatedCard, ElevatedCardSection } from "@/components/fintech/elevated-card";
import { NumberField } from "@/components/fintech/number-field";
import {
  FieldLabel,
  GhostButton,
  ProgressBar,
  ShellInput,
  ShellSelect,
  fintechMuted,
} from "@/components/fintech/ui";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { AppCategory } from "@/types/app-settings";

type CategoryEditCardProps = {
  category: AppCategory;
  spent: number;
  groupOptions: string[];
  iconOptions: string[];
  onUpdate: (patch: Partial<AppCategory>) => void;
  onDelete: () => void;
};

export function CategoryEditCard({
  category,
  spent,
  groupOptions,
  iconOptions,
  onUpdate,
  onDelete,
}: CategoryEditCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const currency = useAppDataStore((s) => s.preferences.currency);
  const budgeted = category.budgeted;
  const pct = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0;
  const over = spent > budgeted && budgeted > 0;
  const remaining = budgeted - spent;

  return (
    <ElevatedCard accentColor={category.color} className="flex h-full flex-col">
      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--surface-elevated)]/80 to-transparent opacity-60"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${category.color}12, transparent 70%)`,
          }}
          aria-hidden
        />

        <div className="relative flex items-start gap-3">
          <CategoryIconBadge name={category.icon} color={category.color} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-lg">
                  {category.name}
                </h3>
                <p className="mt-1 inline-flex rounded-full bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                  {category.group}
                </p>
              </div>
              <GhostButton
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${category.name}`}
                className="shrink-0 text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </GhostButton>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    over ? "text-[var(--negative)]" : "text-[var(--foreground)]"
                  )}
                >
                  {formatMoney(spent, currency)}
                  <span className={cn("font-normal", fintechMuted)}> spent</span>
                </span>
                <span className={cn("text-xs tabular-nums", fintechMuted)}>
                  of {formatMoney(budgeted, currency)}
                </span>
              </div>
              <ProgressBar pct={pct} over={over} size="slim" accentColor={category.color} />
              <p className={cn("text-xs tabular-nums", over ? "text-[var(--negative)]" : "text-[var(--positive)]")}>
                {budgeted <= 0
                  ? "No budget set"
                  : over
                    ? `${formatMoney(Math.abs(remaining), currency)} over`
                    : `${formatMoney(remaining, currency)} left`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setEditOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] sm:px-5"
        >
          <span>Edit category</span>
          <ChevronRight
            className={cn("h-4 w-4 transition-transform duration-200", editOpen && "rotate-90")}
            aria-hidden
          />
        </button>

        {editOpen ? (
          <ElevatedCardSection muted className="space-y-3 pt-0">
            <label className="grid gap-1.5">
              <FieldLabel>Name</FieldLabel>
              <ShellInput
                value={category.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                aria-label={`Category ${category.name}`}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <FieldLabel>Group</FieldLabel>
                <ShellSelect
                  value={category.group}
                  onChange={(e) => onUpdate({ group: e.target.value })}
                  aria-label={`Group for ${category.name}`}
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
                  value={category.icon}
                  onChange={(e) => onUpdate({ icon: e.target.value })}
                  aria-label={`Icon for ${category.name}`}
                >
                  {iconOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </ShellSelect>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <FieldLabel>Color</FieldLabel>
                <ShellInput
                  type="color"
                  value={category.color}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  aria-label={`Color for ${category.name}`}
                  className="h-11 cursor-pointer p-1.5"
                />
              </label>
              <label className="grid gap-1.5">
                <FieldLabel>Monthly budget</FieldLabel>
                <NumberField
                  value={category.budgeted}
                  onChange={(budgeted) => onUpdate({ budgeted })}
                  aria-label={`Budget for ${category.name}`}
                />
              </label>
            </div>
          </ElevatedCardSection>
        ) : null}
      </div>
    </ElevatedCard>
  );
}
