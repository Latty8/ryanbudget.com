"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { fintechForeground, fintechLink, fintechMuted, fintechSurface } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

type Props = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function ReportsEmptyState({
  icon: Icon = BarChart3,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: Props) {
  return (
    <div
      className={cn(
        fintechSurface,
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-inner)] bg-[var(--surface-elevated)] text-[var(--accent)]">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className={cn("mt-4 text-sm font-semibold", fintechForeground)}>{title}</p>
      <p className={cn("mt-2 max-w-sm text-sm leading-relaxed", fintechMuted)}>{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={cn("mt-5 text-sm font-medium", fintechLink)}>
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}
