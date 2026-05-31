"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import {
  ACCOUNT_KINDS,
  COLOR_SWATCHES,
  WalletCard,
} from "@/components/fintech/wallet-card";
import { ElevatedCard, ElevatedCardSection } from "@/components/fintech/elevated-card";
import {
  FieldLabel,
  PrimaryButton,
  ShellInput,
  ShellSelect,
} from "@/components/fintech/ui";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import type { AppAccount } from "@/types/app-settings";
import type { AccountKind } from "@/types/finance";

type AccountWalletListProps = {
  accounts: AppAccount[];
  onChange: (accounts: AppAccount[]) => void;
  transactionCountByAccount?: (accountName: string) => number;
  onReassignTransactions?: (fromAccount: string, toAccount: string) => void;
  showHidden?: boolean;
  allowReorder?: boolean;
};

export function AccountWalletList({
  accounts,
  onChange,
  transactionCountByAccount,
  onReassignTransactions,
  showHidden = true,
  allowReorder = true,
}: AccountWalletListProps) {
  const confirm = useConfirm();
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
    <div className="space-y-5">
      {visible.length > 0 ? (
        <div className="flex flex-col gap-3">
          {visible.map((account) => {
            const index = accounts.findIndex((a) => a.id === account.id);
            return (
              <WalletCard
                key={account.id}
                account={account}
                index={index}
                total={accounts.length}
                showHidden={showHidden}
                allowReorder={allowReorder}
                onUpdate={(patch) => updateOne(account.id, patch)}
                onRemove={() => requestRemove(account)}
                onReorder={(direction) => reorder(account.id, direction)}
              />
            );
          })}
        </div>
      ) : null}

      <ElevatedCard className="border-dashed">
        <ElevatedCardSection>
          <p className="mb-4 text-sm font-semibold text-[var(--foreground)]">Add wallet</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_140px_120px_auto]">
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
        </ElevatedCardSection>
      </ElevatedCard>
    </div>
  );
}
