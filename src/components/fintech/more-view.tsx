"use client";

import Link from "next/link";
import { BarChart3, Goal, LayoutTemplate, RefreshCw, Settings, Users } from "lucide-react";
import { PageFrame, ShellCard } from "@/components/fintech/ui";

const moreLinks = [
  { href: "/recurring", label: "Recurring bills", desc: "Paycheck, rent, subscriptions", icon: RefreshCw },
  { href: "/goals", label: "Savings goals", desc: "Track progress over time", icon: Goal },
  { href: "/reports", label: "Reports", desc: "Charts and PDF export", icon: BarChart3 },
  { href: "/templates", label: "Templates", desc: "Starter budget packs", icon: LayoutTemplate },
  { href: "/household", label: "Household", desc: "Share with a partner", icon: Users },
  { href: "/settings", label: "Settings", desc: "Currency, accounts, data", icon: Settings },
] as const;

export function MoreView() {
  return (
    <PageFrame title="More">
      <p className="mb-4 text-sm text-slate-500">Advanced tools — use when you need them.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {moreLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <ShellCard className="flex h-full items-start gap-3 p-4 transition hover:border-sky-400/40">
                <div className="rounded-xl bg-sky-500/10 p-2">
                  <Icon className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{item.desc}</p>
                </div>
              </ShellCard>
            </Link>
          );
        })}
      </div>
    </PageFrame>
  );
}
