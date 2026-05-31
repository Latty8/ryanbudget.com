"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PLAN_FEATURES, PREMIUM_PRICE } from "@/lib/billing/plans";
import { jsonResponseError, parseJsonResponse } from "@/lib/http/parse-json-response";
import { PrimaryButton, ShellCard, GhostButton } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";
import { useIsPremium, useSubscriptionStore } from "@/store/useSubscriptionStore";

export function PricingTable() {
  const isPremium = useIsPremium();
  const syncFromServer = useSubscriptionStore((s) => s.syncFromServer);
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await parseJsonResponse<{ url?: string; error?: string; granted?: boolean }>(
        response
      );
      if (!data) {
        toast.error(jsonResponseError(response, "Checkout unavailable"));
        return;
      }
      if (!response.ok || !data.url) {
        toast.error(data.error ?? jsonResponseError(response, "Checkout unavailable"));
        return;
      }
      if (data.granted) {
        await syncFromServer();
      }
      window.location.href = data.url;
    } catch {
      toast.error("Could not start checkout — sign in and try again.");
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      credentials: "include",
    });
    const data = await parseJsonResponse<{ url?: string }>(response);
    if (data?.url) window.location.href = data.url;
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border border-slate-600 p-1">
        <button
          className={cn("rounded-lg px-4 py-2 text-sm", interval === "monthly" ? "bg-sky-500 text-slate-950" : "text-slate-300")}
          onClick={() => setInterval("monthly")}
        >
          Monthly
        </button>
        <button
          className={cn("rounded-lg px-4 py-2 text-sm", interval === "annual" ? "bg-sky-500 text-slate-950" : "text-slate-300")}
          onClick={() => setInterval("annual")}
        >
          Annual (save 27%)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ShellCard>
          <p className="text-lg font-semibold">{PLAN_FEATURES.free.label}</p>
          <p className="mt-1 text-3xl font-bold">$0</p>
          <p className="text-sm text-slate-400">Forever</p>
          <ul className="mt-4 space-y-2">
            {PLAN_FEATURES.free.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-slate-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="mt-6 flex w-full items-center justify-center rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-neutral-900"
          >
            Sign in
          </Link>
        </ShellCard>

        <ShellCard className="border-violet-500/40 ring-1 ring-violet-500/20">
          <p className="text-lg font-semibold text-violet-300">Premium</p>
          <p className="mt-1 text-3xl font-bold">
            ${interval === "monthly" ? PREMIUM_PRICE.monthly : PREMIUM_PRICE.annual}
            <span className="text-base font-normal text-slate-400">
              /{interval === "monthly" ? "mo" : "yr"}
            </span>
          </p>
          <p className="text-sm text-slate-400">Cancel anytime · 7-day trial in demo mode</p>
          <ul className="mt-4 space-y-2">
            {PLAN_FEATURES.premium.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-slate-200">
                <Check className="h-4 w-4 shrink-0 text-violet-400" />
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <GhostButton className="mt-6 w-full" onClick={() => void openPortal()}>
              Manage subscription
            </GhostButton>
          ) : (
            <PrimaryButton className="mt-6 w-full" disabled={loading} onClick={() => void startCheckout()}>
              {loading ? "Loading..." : "Upgrade to Premium"}
            </PrimaryButton>
          )}
        </ShellCard>
      </div>
    </div>
  );
}
