"use client";

import { Loader2 } from "lucide-react";
import { useSyncStatusStore } from "@/store/useSyncStatusStore";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator({ className }: { className?: string }) {
  const status = useSyncStatusStore((s) => s.status);
  const message = useSyncStatusStore((s) => s.message);

  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px]",
        status === "syncing" && "bg-[var(--accent-muted)] text-[var(--accent)]",
        status === "error" && "bg-rose-500/15 text-rose-400",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === "syncing" ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
      ) : null}
      <span className="truncate">{message ?? (status === "error" ? "Sync failed" : "Syncing…")}</span>
    </div>
  );
}

/** Full-width banner during initial login sync. */
export function SyncStatusBanner() {
  const status = useSyncStatusStore((s) => s.status);
  const message = useSyncStatusStore((s) => s.message);

  if (status !== "syncing") return null;

  return (
    <div
      className="flex items-center justify-center gap-2 border-b border-[var(--border)] bg-[var(--accent-muted)] px-4 py-2 text-xs font-medium text-[var(--accent)]"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      <span>{message ?? "Syncing your data…"}</span>
    </div>
  );
}
