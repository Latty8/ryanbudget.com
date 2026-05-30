"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { pullAndApplyCloudState } from "@/lib/supabase/sync/client";
import { useSyncStatusStore } from "@/store/useSyncStatusStore";

/** Fresh pull when a data-heavy page mounts (Dashboard, Wallets, Transactions). */
export function usePageCloudSync() {
  const { user } = useAuth();
  const pulledForPath = useRef(false);
  const setSyncing = useSyncStatusStore((s) => s.setSyncing);
  const setIdle = useSyncStatusStore((s) => s.setIdle);

  useEffect(() => {
    if (!user?.userId || isDemoUserId(user.userId) || !hasSupabaseDataSync) return;
    if (pulledForPath.current) return;
    pulledForPath.current = true;

    setSyncing("Syncing…");
    void pullAndApplyCloudState().finally(() => setIdle());
  }, [user?.userId, setSyncing, setIdle]);
}
