"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  canAddAccount,
  canAddCategory,
  canAddGoal,
  canUseFeature,
  isPremium,
} from "@/lib/billing/premium";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

export function usePremium() {
  const subscription = useSubscriptionStore(
    useShallow((s) => ({ tier: s.tier, status: s.status }))
  );
  const { demoMode } = useDemoMode();
  const options = useMemo(() => ({ demoMode }), [demoMode]);

  return useMemo(
    () => ({
      subscription,
      demoMode,
      premium: isPremium(subscription, options),
      canUse: (feature: Parameters<typeof canUseFeature>[1]) =>
        canUseFeature(subscription, feature, options),
      canAddAccount: (count: number) => canAddAccount(subscription, count, options),
      canAddGoal: (count: number) => canAddGoal(subscription, count, options),
      canAddCategory: (count: number) => canAddCategory(subscription, count, options),
    }),
    [subscription, demoMode, options]
  );
}
