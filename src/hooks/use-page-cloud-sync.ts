"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { isClientCloudSyncEnabled } from "@/lib/db/client";
import { pullAndApplyCloudState } from "@/lib/supabase/sync/client";

/** Silent fresh pull when navigating to a data-heavy page. */
export function usePageCloudSync() {
  const { user } = useAuth();
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.userId || isDemoUserId(user.userId) || !isClientCloudSyncEnabled()) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    void pullAndApplyCloudState();
  }, [user?.userId, pathname]);
}
