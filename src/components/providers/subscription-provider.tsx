"use client";

import { useEffect } from "react";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const syncFromServer = useSubscriptionStore((s) => s.syncFromServer);

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  return children;
}
