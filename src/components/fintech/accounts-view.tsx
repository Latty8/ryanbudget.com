"use client";

import { Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountWalletList } from "@/components/fintech/account-wallet-list";
import {
  EmptyState,
  fintechGlass,
  fintechMuted,
  PageFrame,
  ShellCard,
  Skeleton,
} from "@/components/fintech/ui";
import { usePageCloudSync } from "@/hooks/use-page-cloud-sync";
import { usePremium } from "@/hooks/use-premium";
import { useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";

export function AccountsView() {
  usePageCloudSync();

  const router = useRouter();
  const { canAddAccount } = usePremium();
  const accounts = useAppDataStore((s) => s.accounts);
  const demoTransactions = useAppDataStore((s) => s.demoTransactions);
  const setAccounts = useAppDataStore((s) => s.setAccounts);
  const [hydrated, setHydrated] = useState(() => useAppDataStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useAppDataStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  const loading = !hydrated;

  const countTransactionsForAccount = (accountName: string) =>
    demoTransactions.filter((t) => t.account === accountName).length;

  const handleAccountsChange = (next: typeof accounts) => {
    if (!canAddAccount(next.filter((a) => !a.hidden).length) && next.length > accounts.length) {
      toast.error("Free plan allows 2 accounts. Upgrade for unlimited.");
      router.push("/pricing?feature=unlimited_accounts");
      return;
    }
    setAccounts(next);
  };

  return (
    <PageFrame
      title="Wallets"
      description="Manage checking, savings, credit, and cash accounts. Reorder to set your preferred picker order."
    >
      {loading ? (
        <ShellCard className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" aria-hidden />
          Loading wallets…
        </ShellCard>
      ) : null}

      {!loading && accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No wallets yet"
          description="Add the accounts you actually use — checking, savings, credit cards, and cash."
        />
      ) : null}

      {!loading ? (
        <ShellCard className="p-5">
          <AccountWalletList
            accounts={accounts}
            onChange={handleAccountsChange}
            transactionCountByAccount={countTransactionsForAccount}
            onReassignTransactions={(from, to) => {
              useAppDataStore.setState((state) => ({
                demoTransactions: state.demoTransactions.map((t) =>
                  t.account === from ? { ...t, account: to } : t
                ),
              }));
            }}
            showHidden
            allowReorder
          />
        </ShellCard>
      ) : (
        <ShellCard className="space-y-3 p-5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </ShellCard>
      )}

      <p className={cn(fintechGlass, "mt-4 px-4 py-3 text-xs", fintechMuted)}>
        Hidden wallets stay in your data but won&apos;t appear in transaction pickers.
      </p>
    </PageFrame>
  );
}
