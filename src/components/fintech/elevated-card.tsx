"use client";

import { cn } from "@/lib/utils";

/** Flat, calm card shell — border-first, minimal shadow. */
export function ElevatedCard({
  children,
  className,
  accentColor,
  as: Tag = "article",
}: {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  as?: "article" | "div" | "section";
}) {
  return (
    <Tag
      className={cn(
        "group/card relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]",
        "shadow-sm transition-colors duration-200",
        "hover:border-[var(--border-strong)]",
        className
      )}
    >
      {accentColor ? (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-0.5 opacity-70"
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
        "px-4 py-4 sm:px-5 sm:py-4",
        muted && "border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]",
        className
      )}
    >
      {children}
    </div>
  );
}
