"use client";

import { cn } from "@/lib/utils";

/** Shared elevated card shell — soft shadow, rounded corners, hover lift. */
export function ElevatedCard({
  children,
  className,
  accentColor,
  as: Tag = "article",
}: {
  children: React.ReactNode;
  className?: string;
  /** Optional left accent stripe color */
  accentColor?: string;
  as?: "article" | "div" | "section";
}) {
  return (
    <Tag
      className={cn(
        "group/card relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
        "shadow-[var(--shadow-card)] transition-all duration-300 ease-out",
        "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-card-hover)]",
        "active:scale-[0.995] motion-reduce:active:scale-100",
        className
      )}
    >
      {accentColor ? (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-1 opacity-80"
          style={{ backgroundColor: accentColor }}
          aria-hidden
        />
      ) : null}
      {children}
    </Tag>
  );
}

export function ElevatedCardSection({
  children,
  className,
  muted,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 py-4 sm:px-5 sm:py-5",
        muted && "border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50",
        className
      )}
    >
      {children}
    </div>
  );
}
