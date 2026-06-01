"use client";

import Link from "next/link";
import {
  fintechDivide,
  fintechForeground,
  fintechMuted,
  fintechSurface,
  PageFrame,
} from "@/components/fintech/ui";
import { MORE_NAV } from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils";

export function MoreView() {
  return (
    <PageFrame title="More" description="Additional tools and settings.">
      <ul className={cn(fintechSurface, fintechDivide, "divide-y overflow-hidden rounded-[var(--radius-card)]")}>
        {MORE_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex min-h-[4rem] items-center gap-4 px-4 py-3.5 transition hover:bg-[var(--surface-hover)] sm:px-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                  <Icon className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--accent)]" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <p className={cn("font-medium", fintechForeground)}>{item.label}</p>
                  {item.description ? (
                    <p className={cn("text-sm", fintechMuted)}>{item.description}</p>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageFrame>
  );
}
