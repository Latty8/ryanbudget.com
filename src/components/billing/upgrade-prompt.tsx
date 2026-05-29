"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ShellCard } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

export function UpgradePrompt({
  title,
  description,
  feature = "premium",
  compact = false,
}: {
  title: string;
  description: string;
  feature?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href={`/pricing?feature=${feature}`}
        className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs text-violet-200 hover:bg-violet-500/20"
      >
        <Sparkles className="h-3 w-3" aria-hidden />
        Upgrade to Premium
      </Link>
    );
  }

  return (
    <ShellCard className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-sky-500/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-violet-400" aria-hidden />
            {title}
          </p>
          <p className={cn("mt-1 max-w-lg text-sm text-slate-400")}>{description}</p>
        </div>
        <Link
          href={`/pricing?feature=${feature}`}
          className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400"
        >
          View plans
        </Link>
      </div>
    </ShellCard>
  );
}
