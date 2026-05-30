"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { forceSyncNow } from "@/lib/supabase/sync/client";
import { useSyncStatusStore } from "@/store/useSyncStatusStore";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator({ className }: { className?: string }) {
  const { user } = useAuth();
  const status = useSyncStatusStore((s) => s.status);
  const message = useSyncStatusStore((s) => s.message);
  const setSyncing = useSyncStatusStore((s) => s.setSyncing);
  const setIdle = useSyncStatusStore((s) => s.setIdle);
  const setError = useSyncStatusStore((s) => s.setError);
  const [manualBusy, setManualBusy] = useState(false);

  const syncEnabled = Boolean(user?.userId && !isDemoUserId(user.userId) && hasSupabaseDataSync);
  const busy = status === "syncing" || manualBusy;

  const handleSyncNow = async () => {
    if (!syncEnabled || busy) return;
    setManualBusy(true);
    setSyncing("Syncing…");
    try {
      const result = await forceSyncNow();
      if (result.ok) {
        setIdle();
        toast.success(result.message);
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch {
      setError("Sync failed");
      toast.error("Sync failed. Try again.");
    } finally {
      setManualBusy(false);
    }
  };

  if (!syncEnabled && status === "idle") return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {status !== "idle" ? (
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px]",
            status === "syncing" && "bg-[var(--accent-muted)] text-[var(--accent)]",
            status === "error" && "bg-rose-500/15 text-rose-400"
          )}
          role="status"
          aria-live="polite"
        >
          {status === "syncing" ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
          ) : null}
          <span className="truncate">
            {message ?? (status === "error" ? "Sync failed" : "Syncing…")}
          </span>
        </div>
      ) : null}

      {syncEnabled ? (
        <button
          type="button"
          onClick={() => void handleSyncNow()}
          disabled={busy}
          className={cn(
            "flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 sm:text-[11px]"
          )}
          title="Sync now"
        >
          <RefreshCw className={cn("h-3 w-3", busy && "animate-spin")} aria-hidden />
          <span className="hidden sm:inline">Sync</span>
        </button>
      ) : null}
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
