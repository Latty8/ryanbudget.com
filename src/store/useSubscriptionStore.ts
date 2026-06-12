"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createDebouncedStorage } from "@/lib/storage/debounced-storage";
import type { SessionPayload } from "@/lib/auth/session";
import type { UserSubscription } from "@/types/billing";

type SubscriptionState = UserSubscription & {
  setSubscription: (patch: Partial<UserSubscription>) => void;
  setPremium: (active: boolean) => void;
  syncFromServer: () => Promise<void>;
};

const defaultSubscription: UserSubscription = {
  tier: "free",
  status: "none",
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...defaultSubscription,
      setSubscription: (patch) => set((state) => ({ ...state, ...patch })),
      setPremium: (active) =>
        set({
          tier: active ? "premium" : "free",
          status: active ? "active" : "none",
        }),
      syncFromServer: async () => {
        try {
          const sessionRes = await fetch("/api/auth/session", { credentials: "include" });
          if (sessionRes.ok) {
            const body = (await sessionRes.json()) as {
              user?: SessionPayload | null;
            };
            const { resolveClientDemoMode } = await import("@/lib/auth/demo-mode");
            if (resolveClientDemoMode(body.user)) {
              get().setPremium(true);
              return;
            }
          }
        } catch {
          /* fall through to billing API */
        }
        try {
          const response = await fetch("/api/billing/status");
          if (!response.ok) return;
          const data = (await response.json()) as UserSubscription;
          set({ ...data });
        } catch {
          /* keep cached subscription on network errors */
        }
      },
    }),
    {
      name: "paycheck-planner-subscription",
      storage: createJSONStorage(() => createDebouncedStorage(400)),
    }
  )
);

export function useIsPremium() {
  const tier = useSubscriptionStore((s) => s.tier);
  const status = useSubscriptionStore((s) => s.status);
  return tier === "premium" && (status === "active" || status === "trialing");
}
