"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import {
  FieldLabel,
  GhostButton,
  PrimaryButton,
  ShellInput,
  ShellSelect,
  useShellTheme,
} from "@/components/fintech/ui";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { cn } from "@/lib/utils";
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

type AccountWalletListProps = {
  accounts: AppAccount[];
  onChange: (accounts: AppAccount[]) => void;
  transactionCountByAccount?: (accountName: string) => number;
  onReassignTransactions?: (fromAccount: string, toAccount: string) => void;
  showHidden?: boolean;
  compact?: boolean;
  allowReorder?: boolean;
};

export function AccountWalletList({
  accounts,
  onChange,
  transactionCountByAccount,
  onReassignTransactions,
  showHidden = true,
  compact = false,
  allowReorder = true,
}: AccountWalletListProps) {
  const confirm = useConfirm();
  const { isLight } = useShellTheme();
  const [draft, setDraft] = useState<Omit<AppAccount, "id">>({
    name: "",
    kind: "checking",
    balance: 0,
    color: COLOR_SWATCHES[0],
    icon: "Wallet",
  });
  const [moveTarget, setMoveTarget] = useState<string>("");
  const moveTargetRef = useRef("");

  const visible = showHidden ? accounts : accounts.filter((a) => !a.hidden);

  const updateOne = (id: string, patch: Partial<AppAccount>) => {
    onChange(accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const reorder = (id: string, direction: "up" | "down") => {
    const index = accounts.findIndex((a) => a.id === id);
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= accounts.length) return;
    const next = [...accounts];
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  };

  const requestRemove = (account: AppAccount) => {
    const txCount = transactionCountByAccount?.(account.name) ?? 0;
    const others = accounts.filter((a) => a.id !== account.id);
    moveTargetRef.current = others[0]?.name ?? "";
    setMoveTarget(others[0]?.name ?? "");

    void confirm({
      title: "Delete Wallet?",
      description: `"${account.name}" will be removed from your plan.`,
      warning:
        txCount > 0
          ? `This wallet has ${txCount} linked transaction${txCount === 1 ? "" : "s"}. Choose where to move them below.`
          : "This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        const target = moveTargetRef.current || moveTarget;
        if (txCount > 0 && target && onReassignTransactions) {
          onReassignTransactions(account.name, target);
          toast.success(`Moved ${txCount} transaction${txCount === 1 ? "" : "s"} to ${target}`);
        }
        onChange(accounts.filter((a) => a.id !== account.id));
        toast.success("Wallet deleted");
      },
      children:
        txCount > 0 && others.length > 0 && onReassignTransactions ? (
          <div className="grid gap-2">
            <FieldLabel htmlFor="move-tx-target">Move transactions to</FieldLabel>
            <ShellSelect
              id="move-tx-target"
              value={moveTarget}
              onChange={(e) => {
                setMoveTarget(e.target.value);
                moveTargetRef.current = e.target.value;
              }}
            >
              {others.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </ShellSelect>
          </div>
        ) : undefined,
    });
  };

  const addAccount = () => {
    if (!draft.name.trim()) {
      toast.error("Enter a wallet name");
      return;
    }
    onChange([
      ...accounts,
      {
        ...draft,
        id: `acc-${Date.now()}`,
        name: draft.name.trim(),
      },
    ]);
    setDraft({ name: "", kind: "checking", balance: 0, color: COLOR_SWATCHES[0], icon: "Wallet" });
    toast.success("Wallet added");
  };

  return (
    <div className="space-y-3">
      {visible.length === 0 ? (
        <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
          No wallets yet — add the accounts you actually use.
        </p>
      ) : (
        visible.map((account, index) => (
          <div
            key={account.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition hover:border-[var(--border-strong)]"
          >
            {/* Mobile header row */}
            <div className="mb-3 flex items-center gap-3 lg:hidden">
              <span
                className="h-10 w-10 shrink-0 rounded-xl border border-[var(--border-subtle)]"
                style={{ backgroundColor: account.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{account.name}</p>
                <p className="text-xs capitalize text-[var(--muted)]">{account.kind}</p>
              </div>
              {allowReorder ? (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => reorder(account.id, "up")}
                    aria-label={`Move ${account.name} up`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] disabled:opacity-30"
                    disabled={index === accounts.length - 1}
                    onClick={() => reorder(account.id, "down")}
                    aria-label={`Move ${account.name} down`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>

            <div
              className={cn(
                "grid gap-3",
                compact ? "sm:grid-cols-2" : "grid-cols-1 lg:grid-cols-[auto_1fr_140px_auto]"
              )}
            >
              {allowReorder ? (
                <div className="hidden flex-col gap-1 lg:flex">
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => reorder(account.id, "up")}
                    aria-label={`Move ${account.name} up`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] disabled:opacity-30"
                    disabled={index === accounts.length - 1}
                    onClick={() => reorder(account.id, "down")}
                    aria-label={`Move ${account.name} down`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <label className="grid gap-1 lg:contents">
                  <span className="text-xs font-medium text-[var(--muted)] lg:sr-only">Name</span>
                  <ShellInput
                    value={account.name}
                    onChange={(e) => updateOne(account.id, { name: e.target.value })}
                    aria-label={`Wallet name ${account.name}`}
                  />
                </label>
                <label className="grid gap-1 lg:contents">
                  <span className="text-xs font-medium text-[var(--muted)] lg:sr-only">Balance</span>
                  <NumberField
                    value={account.balance}
                    onChange={(balance) => updateOne(account.id, { balance })}
                    aria-label={`Balance ${account.name}`}
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <label className="grid gap-1 lg:contents">
                  <span className="text-xs font-medium text-[var(--muted)] lg:sr-only">Type</span>
                  <ShellSelect
                    value={account.kind}
                    onChange={(e) => updateOne(account.id, { kind: e.target.value as AccountKind })}
                    aria-label={`Type ${account.name}`}
                  >
                    {ACCOUNT_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </ShellSelect>
                </label>
                <label className="grid gap-1 lg:contents">
                  <span className="text-xs font-medium text-[var(--muted)] lg:sr-only">Icon</span>
                  <ShellSelect
                    value={account.icon}
                    onChange={(e) => updateOne(account.id, { icon: e.target.value })}
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

              <div className="flex flex-col gap-3 lg:gap-2">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--muted)] lg:sr-only">Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "h-7 w-7 rounded-full border-2 transition sm:h-6 sm:w-6",
                          account.color === color ? "scale-110 border-white" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => updateOne(account.id, { color })}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {showHidden ? (
                    <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={!account.hidden}
                        onChange={(e) => updateOne(account.id, { hidden: !e.target.checked })}
                      />
                      Show in app
                    </label>
                  ) : null}
                  <GhostButton
                    type="button"
                    className="ml-auto text-rose-400 hover:bg-rose-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestRemove(account);
                    }}
                    aria-label={`Delete ${account.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </GhostButton>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-4">
        <p className="mb-3 text-xs font-medium text-[var(--muted)]">Add wallet</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_140px_120px_auto]">
          <ShellInput
            placeholder="Wallet name"
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
          />
          <ShellSelect
            value={draft.kind}
            onChange={(e) => setDraft((s) => ({ ...s, kind: e.target.value as AccountKind }))}
          >
            {ACCOUNT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </ShellSelect>
          <NumberField value={draft.balance} onChange={(balance) => setDraft((s) => ({ ...s, balance }))} />
          <PrimaryButton onClick={addAccount} className="sm:col-span-2 lg:col-span-1">
            <Plus className="mr-1 inline h-4 w-4" />
            Add
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
