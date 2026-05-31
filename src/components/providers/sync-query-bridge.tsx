"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { isApplyingRemoteSync } from "@/lib/supabase/sync/apply-sync";
import { useAppDataStore } from "@/store/useAppDataStore";

export const APP_QUERY_KEYS = {
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  transactions: ["transactions"] as const,
  budgets: ["budgets"] as const,
  goals: ["goals"] as const,
};

export function invalidateAppQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: APP_QUERY_KEYS.accounts });
  void queryClient.invalidateQueries({ queryKey: APP_QUERY_KEYS.categories });
  void queryClient.invalidateQueries({ queryKey: APP_QUERY_KEYS.transactions });
  void queryClient.invalidateQueries({ queryKey: APP_QUERY_KEYS.budgets });
  void queryClient.invalidateQueries({ queryKey: APP_QUERY_KEYS.goals });
}

/** Invalidate TanStack Query caches when Zustand app data changes (including remote sync apply). */
export function SyncQueryBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return useAppDataStore.subscribe((state, prev) => {
      if (isApplyingRemoteSync()) return;
      if (
        state.accounts === prev.accounts &&
        state.categories === prev.categories &&
        state.demoTransactions === prev.demoTransactions &&
        state.demoRecurring === prev.demoRecurring &&
        state.goals === prev.goals
      ) {
        return;
      }
      invalidateAppQueries(queryClient);
    });
  }, [queryClient]);

  return null;
}
