"use client";

import Link from "next/link";
import { PiggyBank, RefreshCw, Settings, Users, Wallet } from "lucide-react";
import {
  fintechDivide,
  fintechForeground,
  fintechGlass,
  fintechMuted,
  PageFrame,
} from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

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
      <ul className={cn(fintechGlass, fintechDivide, "divide-y overflow-hidden")}>
        {moreLinks.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-[var(--surface-hover)] active:scale-[0.995]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-inner)] transition group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent)]">
                  <Icon className="h-5 w-5 text-[var(--muted)] transition group-hover:text-[var(--accent)]" strokeWidth={1.75} />
                </span>
                <span>
                  <p className={cn("font-medium", fintechForeground)}>{item.label}</p>
                  <p className={cn("text-sm", fintechMuted)}>{item.desc}</p>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageFrame>
  );
}
