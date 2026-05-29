"use client";

import { useSyncExternalStore } from "react";

/** Avoid SSR/client hydration mismatches for persisted client state. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
