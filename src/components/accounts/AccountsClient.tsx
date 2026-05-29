"use client";

import { useCallback, useEffect, useState } from "react";
import { PlaidLinkButton } from "@/components/accounts/PlaidLinkButton";
import { PageHeader } from "@/components/ui/PageChrome";
import { formatMoney } from "@/lib/format-money";
import type { LinkedBankAccount } from "@/lib/types";
import type { PlaidSyncResult } from "@/lib/plaid/types";
import { useMounted } from "@/components/use-mounted";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useBudgetStore } from "@/store/useBudgetStore";

export function AccountsClient() {
  const confirm = useConfirm();
  const mounted = useMounted();
  const categories = useBudgetStore((s) => s.categories);
  const linkedAccounts = useBudgetStore((s) => s.linkedAccounts);
  const setLinkedAccounts = useBudgetStore((s) => s.setLinkedAccounts);
  const applyPlaidSync = useBudgetStore((s) => s.applyPlaidSync);

  const [items, setItems] = useState<
    Array<{ id: string; institutionName: string | null; createdAt: string }>
  >([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/plaid/accounts");
      const data = (await res.json()) as {
        items?: typeof items;
        accounts?: LinkedBankAccount[];
        error?: string;
      };
      if (!res.ok) {
        if (res.status === 503) {
          setConfigured(false);
          return;
        }
        throw new Error(data.error ?? "Failed to load accounts");
      }
      setConfigured(true);
      setItems(data.items ?? []);
      setLinkedAccounts(data.accounts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    }
  }, [setLinkedAccounts]);

  useEffect(() => {
    if (!mounted) return;
    const id = window.setTimeout(() => {
      void refreshAccounts();
    }, 0);
    return () => window.clearTimeout(id);
  }, [mounted, refreshAccounts]);

  async function syncNow() {
    setSyncing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      const data = (await res.json()) as PlaidSyncResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Sync failed");
      }
      const stats = applyPlaidSync(data);
      setMessage(
        `Synced ${stats.added} new, ${stats.updated} updated` +
          (stats.removed > 0 ? `, ${stats.removed} removed` : "") +
          ". Categories were suggested from merchant names — review on Transactions."
      );
      await refreshAccounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect(itemId: string) {
    await confirm({
      title: "Disconnect this bank?",
      description: "New syncs will stop for this connection.",
      warning: "Imported transactions will stay in your ledger.",
      confirmLabel: "Disconnect",
      onConfirm: async () => {
        setError(null);
        const res = await fetch(`/api/plaid/items/${itemId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Could not disconnect");
        }
        await refreshAccounts();
      },
    });
  }

  if (!mounted) {
    return (
      <div className="surface-card animate-pulse p-12 text-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  if (configured === false) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Bank connections"
          title="Accounts"
          description="Link SoFi and other banks via Plaid. The server needs API keys before you can connect."
        />
        <section className="surface-card p-6 sm:p-8">
          <p className="text-[15px] leading-relaxed text-[var(--muted)]">
            Add <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">PLAID_CLIENT_ID</code> and{" "}
            <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">PLAID_SECRET</code> to{" "}
            <code className="rounded bg-[var(--surface-elevated)] px-1.5 py-0.5 text-sm">.env.local</code> (see{" "}
            <code className="text-sm">.env.example</code>), then restart{" "}
            <code className="text-sm">npm run dev</code>.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Bank connections"
        title="Accounts"
        description="Connect checking, savings, and credit accounts. Sync pulls new activity into Transactions with suggested categories."
      />

      <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
        <div>
          <h2 className="type-form-title mb-1">Plaid</h2>
          <p className="max-w-xl text-[15px] text-[var(--muted)]">
            Use sandbox credentials in development. For SoFi, search &quot;SoFi&quot; in Link or set{" "}
            <code className="text-sm">PLAID_INSTITUTION_IDS</code> in your env.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PlaidLinkButton onSuccess={() => void refreshAccounts()} />
          <button
            type="button"
            className="btn-secondary"
            disabled={syncing || items.length === 0}
            onClick={() => void syncNow()}
          >
            {syncing ? "Syncing…" : "Sync transactions"}
          </button>
        </div>
      </section>

      {message ? (
        <p className="rounded-[var(--radius-field)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--positive)_12%,transparent)] px-4 py-3 text-sm text-[var(--foreground)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius-field)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--negative)_12%,transparent)] px-4 py-3 text-sm text-negative">
          {error}
        </p>
      ) : null}

      <section className="surface-card overflow-hidden p-0">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-7">
          <h2 className="text-[1.125rem] font-semibold tracking-[-0.02em]">
            Connections
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-[15px] text-[var(--muted)] sm:px-7">
            No banks connected yet. Connect SoFi or another institution to get started.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"
              >
                <div>
                  <p className="font-semibold">
                    {item.institutionName ?? "Bank connection"}
                  </p>
                  <p className="type-caption mt-0.5">
                    Linked {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-ghost text-negative"
                  onClick={() => void disconnect(item.id)}
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card overflow-hidden p-0">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-7">
          <h2 className="text-[1.125rem] font-semibold tracking-[-0.02em]">
            Accounts
          </h2>
        </div>
        {linkedAccounts.length === 0 ? (
          <p className="px-5 py-10 text-center text-[15px] text-[var(--muted)] sm:px-7">
            Connect a bank to see accounts here.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {linkedAccounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"
              >
                <div>
                  <p className="font-semibold">
                    {a.name}
                    {a.mask ? (
                      <span className="text-[var(--muted)]"> ···{a.mask}</span>
                    ) : null}
                  </p>
                  <p className="type-caption mt-0.5">
                    {a.institutionName ?? "Bank"}
                    {a.subtype ? ` · ${a.subtype}` : ""}
                  </p>
                </div>
                {a.currentBalance != null ? (
                  <p className="figure font-mono text-sm font-semibold tabular-nums">
                    {formatMoney(a.currentBalance)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
