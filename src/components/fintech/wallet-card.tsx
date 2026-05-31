"use client";

import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { CategoryIconBadge, resolveCategoryIcon } from "@/components/fintech/category-icon";
import { ElevatedCard, ElevatedCardSection } from "@/components/fintech/elevated-card";
import { NumberField } from "@/components/fintech/number-field";
import {
  FieldLabel,
  GhostButton,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { getAccountKindTheme } from "@/lib/fintech/account-theme";
import { cn } from "@/lib/utils";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { AppAccount } from "@/types/app-settings";
import type { AccountKind } from "@/types/finance";

const ACCOUNT_KINDS: { value: AccountKind; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit card" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
];

const ICON_OPTIONS = ["Wallet", "PiggyBank", "CreditCard", "Banknote", "TrendingUp", "Landmark"];
const COLOR_SWATCHES = ["#38bdf8", "#34d399", "#f472b6", "#fbbf24", "#a78bfa", "#fb7185", "#22c55e", "#60a5fa"];

type WalletCardProps = {
  account: AppAccount;
  index: number;
  total: number;
  showHidden?: boolean;
  allowReorder?: boolean;
  onUpdate: (patch: Partial<AppAccount>) => void;
  onRemove: () => void;
  onReorder: (direction: "up" | "down") => void;
};

export function WalletCard({
  account,
  index,
  total,
  showHidden = true,
  allowReorder = true,
  onUpdate,
  onRemove,
  onReorder,
}: WalletCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const currency = useAppDataStore((s) => s.preferences.currency);
  const theme = getAccountKindTheme(account.kind);
  const Icon = resolveCategoryIcon(account.icon);
  const accent = account.color || theme.accent;

  return (
    <ElevatedCard accentColor={accent}>
      <div
        className={cn(
          "relative overflow-hidden px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5",
          "bg-gradient-to-br",
          theme.gradient
        )}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover/card:scale-[1.03] sm:h-14 sm:w-14"
              style={{
                backgroundColor: accent,
                boxShadow: `0 10px 28px -6px ${accent}88`,
              }}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
                {account.name}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    theme.badge
                  )}
                >
                  {theme.label}
                </span>
                {account.hidden ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--muted)]">
                    <EyeOff className="h-3 w-3" aria-hidden />
                    Hidden
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {allowReorder ? (
            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                className="rounded-lg border border-[var(--border)]/80 bg-[var(--surface)]/80 p-1.5 text-[var(--muted)] backdrop-blur-sm transition hover:bg-[var(--surface-hover)] disabled:opacity-25"
                disabled={index === 0}
                onClick={() => onReorder("up")}
                aria-label={`Move ${account.name} up`}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border)]/80 bg-[var(--surface)]/80 p-1.5 text-[var(--muted)] backdrop-blur-sm transition hover:bg-[var(--surface-hover)] disabled:opacity-25"
                disabled={index === total - 1}
                onClick={() => onReorder("down")}
                aria-label={`Move ${account.name} down`}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        <p className="relative mt-5 text-3xl font-bold tabular-nums tracking-tight text-[var(--foreground)] sm:text-[2rem]">
          {formatMoney(account.balance, account.currency ?? currency)}
        </p>
      </div>

      <div className="border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setEditOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] sm:px-5"
        >
          <span>Edit wallet</span>
          <ChevronRight
            className={cn("h-4 w-4 transition-transform duration-200", editOpen && "rotate-90")}
            aria-hidden
          />
        </button>

        {editOpen ? (
          <ElevatedCardSection muted className="space-y-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 sm:col-span-2">
                <FieldLabel>Name</FieldLabel>
                <ShellInput
                  value={account.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  aria-label={`Wallet name ${account.name}`}
                />
              </label>
              <label className="grid gap-1.5">
                <FieldLabel>Balance</FieldLabel>
                <NumberField
                  value={account.balance}
                  onChange={(balance) => onUpdate({ balance })}
                  aria-label={`Balance ${account.name}`}
                />
              </label>
              <label className="grid gap-1.5">
                <FieldLabel>Type</FieldLabel>
                <ShellSelect
                  value={account.kind}
                  onChange={(e) => onUpdate({ kind: e.target.value as AccountKind })}
                  aria-label={`Type ${account.name}`}
                >
                  {ACCOUNT_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </ShellSelect>
              </label>
              <label className="grid gap-1.5">
                <FieldLabel>Icon</FieldLabel>
                <ShellSelect
                  value={account.icon}
                  onChange={(e) => onUpdate({ icon: e.target.value })}
                  aria-label={`Icon ${account.name}`}
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </ShellSelect>
              </label>
            </div>

            <div>
              <FieldLabel>Color</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                      account.color === color
                        ? "scale-110 border-white shadow-md ring-2 ring-[var(--accent)]/40"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onUpdate({ color })}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
              {showHidden ? (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    className="rounded border-[var(--border)]"
                    checked={!account.hidden}
                    onChange={(e) => onUpdate({ hidden: !e.target.checked })}
                  />
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Show in app
                </label>
              ) : (
                <span />
              )}
              <GhostButton
                type="button"
                className="text-rose-400 hover:bg-rose-500/10"
                onClick={onRemove}
                aria-label={`Delete ${account.name}`}
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-1.5">Delete</span>
              </GhostButton>
            </div>
          </ElevatedCardSection>
        ) : null}
      </div>
    </ElevatedCard>
  );
}

export { ACCOUNT_KINDS, ICON_OPTIONS, COLOR_SWATCHES };
