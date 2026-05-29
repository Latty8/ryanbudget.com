"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import type { SharedBudgetPayload } from "@/lib/sharing/server-shares";

export default function SharedBudgetPage() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<SharedBudgetPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/budget?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Not found");
        setShare(data.share);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Link unavailable"));
  }, [token]);

  return (
    <MarketingShell showDemoCta>
      {error ? (
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-rose-300">{error}</p>
          <Link href="/templates" className="mt-4 inline-block text-sky-400 hover:underline">
            Browse templates
          </Link>
        </div>
      ) : !share ? (
        <p className="py-16 text-center text-slate-400">Loading shared budget…</p>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-sky-400">Read-only snapshot</p>
            <h1 className="mt-2 text-3xl font-semibold">{share.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Shared by {share.ownerLabel} · Expires {new Date(share.expiresAt).toLocaleDateString()}
            </p>
          </div>

          <section className="rounded-2xl border border-slate-800 bg-neutral-900/50 p-5">
            <h2 className="text-sm font-medium text-slate-300">Categories</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Budgeted</th>
                  <th className="pb-2">Spent</th>
                </tr>
              </thead>
              <tbody>
                {share.categories.map((c) => (
                  <tr key={c.name} className="border-t border-slate-800">
                    <td className="py-2">{c.name}</td>
                    <td>${c.budgeted.toFixed(2)}</td>
                    <td>${c.spent.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {share.recurring.length > 0 ? (
            <section className="rounded-2xl border border-slate-800 bg-neutral-900/50 p-5">
              <h2 className="text-sm font-medium text-slate-300">Recurring</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                {share.recurring.map((r) => (
                  <li key={r.name}>
                    {r.name}: ${Math.abs(r.amount).toFixed(2)} · {r.cadence}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {share.goals.length > 0 ? (
            <section className="rounded-2xl border border-slate-800 bg-neutral-900/50 p-5">
              <h2 className="text-sm font-medium text-slate-300">Goals</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                {share.goals.map((g) => (
                  <li key={g.name}>
                    {g.name}: ${g.current.toFixed(0)} / ${g.target.toFixed(0)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-center text-sm text-slate-500">
            Want your own plan?{" "}
            <Link href="/" className="text-sky-400 hover:underline">
              Try Paycheck Planner free
            </Link>
          </p>
        </div>
      )}
    </MarketingShell>
  );
}
