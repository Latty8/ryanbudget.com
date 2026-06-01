"use client";

import { fintechCardBody } from "@/components/fintech/ui";
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
        "group/card relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]",
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
        fintechCardBody,
        muted && "border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]",
        className
      )}
    >
      {children}
    </div>
  );
}
