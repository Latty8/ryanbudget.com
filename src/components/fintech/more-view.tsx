"use client";

import Link from "next/link";
import { BarChart3, PiggyBank, RefreshCw, Settings, Tags, Users } from "lucide-react";
import {
  fintechDivide,
  fintechForeground,
  fintechMuted,
  fintechSurface,
  PageFrame,
} from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

const moreLinks = [
  { href: "/categories", label: "Categories", desc: "Organize spending and income", icon: Tags },
  { href: "/recurring", label: "Recurring bills", desc: "Paycheck, rent, subscriptions", icon: RefreshCw },
  { href: "/goals", label: "Savings goals", desc: "Track progress over time", icon: PiggyBank },
  { href: "/reports", label: "Reports", desc: "Income, spending, and trends", icon: BarChart3 },
  { href: "/household", label: "Household", desc: "Share with a partner", icon: Users },
  { href: "/settings", label: "Settings", desc: "Currency, data, preferences", icon: Settings },
] as const;

export function MoreView() {
  return (
    <PageFrame title="More" description="Categories, recurring bills, goals, and settings.">
      <ul className={cn(fintechSurface, fintechDivide, "divide-y overflow-hidden")}>
        {moreLinks.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex min-h-[4.5rem] items-center gap-4 px-4 py-4 transition-colors duration-200 hover:bg-[var(--surface-hover)] active:scale-[0.995] sm:px-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-sm transition group-hover:border-[var(--accent)]/30">
                  <Icon
                    className="h-5 w-5 text-[var(--muted)] transition group-hover:text-[var(--accent)]"
                    strokeWidth={1.75}
                  />
                </span>
                <span className="min-w-0">
                  <p className={cn("font-medium", fintechForeground)}>{item.label}</p>
                  <p className={cn("text-sm leading-snug", fintechMuted)}>{item.desc}</p>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageFrame>
  );
}
