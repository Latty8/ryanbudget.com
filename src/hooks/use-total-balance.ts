"use client";

import { useAppDataStore } from "@/store/useAppDataStore";

/** Lightweight balance for chrome; avoids full dashboard summary on every route. */
export function useTotalBalance() {
  return useAppDataStore((s) =>
    s.accounts.filter((a) => !a.hidden).reduce((sum, a) => sum + a.balance, 0)
  );
}
