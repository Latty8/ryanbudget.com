"use client";

import { StickyNote } from "lucide-react";
import Link from "next/link";
import { fintechCard, fintechForeground, fintechMuted, PageFrame } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

export function NotesPlaceholderView() {
  return (
    <PageFrame
      title="Notes"
      description="A dedicated space for financial notes and planning — coming soon."
    >
      <section className={cn(fintechCard, "flex flex-col items-center px-6 py-14 text-center sm:py-16")}>
        <span className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-inner)] bg-[var(--surface-elevated)] text-[var(--accent)]">
          <StickyNote className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <h2 className={cn("mt-5 text-lg font-semibold", fintechForeground)}>Notes are on the way</h2>
        <p className={cn("mt-2 max-w-md text-sm leading-relaxed", fintechMuted)}>
          Capture ideas, meeting notes, and planning thoughts alongside your budget — all in one calm
          workspace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-field)] border border-[var(--border)] px-5 text-sm font-medium transition hover:bg-[var(--surface-hover)]"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/budgeting"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-field)] border border-[var(--border)] px-5 text-sm font-medium transition hover:bg-[var(--surface-hover)]"
          >
            Open Budgeting
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
