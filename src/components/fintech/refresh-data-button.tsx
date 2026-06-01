"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { isClientCloudSyncEnabled } from "@/lib/db/client";
import { logDataSync, logLocalStoreSnapshot } from "@/lib/debug/data-sync-log";
import { pullAndApplyCloudState } from "@/lib/supabase/sync/client";
import { cn } from "@/lib/utils";

type RefreshDataButtonProps = {
  className?: string;
  compact?: boolean;
};

/** Dev-friendly control to force a MongoDB pull for the signed-in user. */
export function RefreshDataButton({ className, compact }: RefreshDataButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user?.userId || isDemoUserId(user.userId)) return null;

  const refresh = async () => {
    setLoading(true);
    try {
      logDataSync("manual-refresh", { userId: user.userId, email: user.email });
      logLocalStoreSnapshot("before-refresh");

      if (!isClientCloudSyncEnabled()) {
        toast.error("Cloud sync is off — set MONGODB_URI and NEXT_PUBLIC_ENABLE_CLOUD_SYNC=true");
        return;
      }

      const applied = await pullAndApplyCloudState({ force: true });
      logLocalStoreSnapshot("after-refresh");

      if (applied) {
        toast.success("Loaded your data from the server");
      } else {
        toast.message("Already up to date (or no remote data for this account)");
      }
    } catch {
      toast.error("Could not refresh data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      disabled={loading}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-50",
        compact ? "min-w-11 px-2.5" : "px-3 text-xs font-medium",
        className
      )}
      aria-label="Refresh data from server"
      title="Refresh data from MongoDB (debug)"
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      {!compact ? <span>Refresh data</span> : null}
    </button>
  );
}
