"use client";

import Link from "next/link";
import { PiggyBank, RefreshCw, Settings, Users, Wallet } from "lucide-react";
import { PageFrame } from "@/components/fintech/ui";

const moreLinks = [
  { href: "/recurring", label: "Recurring bills", desc: "Paycheck, rent, subscriptions", icon: RefreshCw },
  { href: "/accounts", label: "Accounts", desc: "Checking, savings, cards", icon: Wallet },
  { href: "/goals", label: "Savings goals", desc: "Track progress over time", icon: PiggyBank },
  { href: "/household", label: "Household", desc: "Share with a partner", icon: Users },
  { href: "/settings", label: "Settings", desc: "Currency, data, preferences", icon: Settings },
] as const;

export function MoreView() {
  return (
    <PageFrame title="More" description="Extra tools when you need them.">
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {moreLinks.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </span>
                <span>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageFrame>
  );
}
