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
import { resolveCategoryIcon } from "@/components/fintech/category-icon";
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
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg lg:h-11 lg:w-11"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[var(--foreground)] lg:text-[15px]">
                {account.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", theme.badge)}>
                  {theme.label}
                </span>
                {account.hidden ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]">
                    <EyeOff className="h-3 w-3" aria-hidden />
                    Hidden
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 lg:justify-end lg:gap-5">
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--foreground)] lg:text-right lg:text-xl">
              {formatMoney(account.balance, account.currency ?? currency)}
            </p>
            {allowReorder ? (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-25"
                  disabled={index === 0}
                  onClick={() => onReorder("up")}
                  aria-label={`Move ${account.name} up`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-25"
                  disabled={index === total - 1}
                  onClick={() => onReorder("down")}
                  aria-label={`Move ${account.name} down`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setEditOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] sm:px-5"
        >
          <span>Edit wallet</span>
          <ChevronRight
            className={cn("h-4 w-4 transition-transform duration-200", editOpen && "rotate-90")}
            aria-hidden
          />
        </button>

        {editOpen ? (
          <ElevatedCardSection muted className="space-y-4 pt-0">
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1.5 lg:col-span-2">
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
                      "h-7 w-7 rounded-full border-2 transition-colors",
                      account.color === color
                        ? "border-[var(--foreground)]"
                        : "border-transparent hover:border-[var(--border-strong)]"
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
                className="text-rose-500 hover:bg-rose-500/10"
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
