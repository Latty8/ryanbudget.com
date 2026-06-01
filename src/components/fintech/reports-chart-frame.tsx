"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fintechMuted } from "@/components/fintech/ui";

type Props = {
  children: ReactNode;
  empty?: ReactNode;
  isEmpty?: boolean;
  className?: string;
  heightClass?: string;
};

export function ReportsChartFrame({
  children,
  empty,
  isEmpty,
  className,
  heightClass = "h-72 md:h-80",
}: Props) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 sm:p-4",
        heightClass,
        className
      )}
    >
      {isEmpty ? (
        empty ?? (
          <p className={cn("flex h-full items-center justify-center text-sm", fintechMuted)}>
            No data for this view
          </p>
        )
      ) : (
        children
      )}
    </div>
  );
}
