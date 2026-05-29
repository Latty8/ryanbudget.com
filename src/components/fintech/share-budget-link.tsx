"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { GhostButton, ShellCard } from "@/components/fintech/ui";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useShellTheme } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

export function ShareBudgetLink() {
  const { isLight } = useShellTheme();
  const profile = useAppDataStore((s) => s.profile);
  const categories = useAppDataStore((s) => s.categories);
  const recurring = useAppDataStore((s) => s.demoRecurring);
  const goals = useAppDataStore((s) => s.goals);
  const transactions = useAppDataStore((s) => s.demoTransactions);
  const [loading, setLoading] = useState(false);

  const createLink = async () => {
    setLoading(true);
    try {
      const spentByCategory = new Map<string, number>();
      for (const t of transactions) {
        if (t.amount >= 0) continue;
        spentByCategory.set(t.category, (spentByCategory.get(t.category) ?? 0) + Math.abs(t.amount));
      }

      const res = await fetch("/api/share/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${profile.name}'s budget snapshot`,
          ownerLabel: profile.name,
          categories: categories.map((c) => ({
            name: c.name,
            budgeted: c.budgeted,
            spent: spentByCategory.get(c.name) ?? 0,
          })),
          recurring: recurring.map((r) => ({
            name: r.name,
            amount: r.amount,
            cadence: r.cadence,
          })),
          goals: goals.map((g) => ({
            name: g.name,
            current: g.current,
            target: g.target,
          })),
        }),
      });
      const data = (await res.json()) as { shareUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not create link");
      const full = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(full);
      toast.success("Read-only budget link copied (expires in 30 days)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Share failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShellCard>
      <p className="text-sm font-medium">Public read-only link</p>
      <p className={cn("mt-1 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
        Anyone with the link can view your categories, recurring items, and goals — not edit.
      </p>
      <GhostButton className="mt-3" disabled={loading} onClick={() => void createLink()}>
        <Link2 className="mr-1 inline h-4 w-4" />
        {loading ? "Creating…" : "Copy shareable link"}
      </GhostButton>
    </ShellCard>
  );
}
