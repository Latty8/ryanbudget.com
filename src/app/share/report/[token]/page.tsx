"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import type { SharedReportPayload } from "@/lib/sharing/server-shares";

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<SharedReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/report?token=${encodeURIComponent(token)}`)
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
          <Link href="/" className="mt-4 inline-block text-sky-400 hover:underline">
            Go home
          </Link>
        </div>
      ) : !share ? (
        <p className="py-16 text-center text-slate-400">Loading report…</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-sky-400">Shared report</p>
            <h1 className="mt-2 text-2xl font-semibold">{share.title}</h1>
            <p className="text-sm text-slate-500">
              {share.ownerLabel} · Expires {new Date(share.expiresAt).toLocaleDateString()}
            </p>
          </div>
          <div
            className="overflow-hidden rounded-2xl border border-slate-800 bg-white text-slate-900"
            dangerouslySetInnerHTML={{ __html: share.html }}
          />
        </div>
      )}
    </MarketingShell>
  );
}
