"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useAppDataStore } from "@/store/useAppDataStore";

export function DemoModeBanner() {
  const { demoMode } = useDemoMode();
  const loadDemoData = useAppDataStore((s) => s.loadDemoData);
  const [dismissed, setDismissed] = useState(false);

  if (!demoMode || dismissed) return null;

  return (
    <div
      className="relative z-30 border-b border-emerald-500/30 bg-gradient-to-r from-emerald-600/90 to-sky-600/90 px-4 py-2.5 text-sm text-white shadow-md"
      role="status"
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-2 md:justify-between">
        <p className="inline-flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          Demo mode — Premium unlocked
          <span className="hidden font-normal opacity-90 sm:inline">
            · All features active with sample bi-weekly data
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadDemoData();
              toast.success("Bi-weekly demo data refreshed");
            }}
            className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
          >
            Reload demo data
          </button>
          <Link
            href="/settings"
            className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
          >
            Connect real account
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1 hover:bg-white/15"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
