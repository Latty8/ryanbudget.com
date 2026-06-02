"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type BudgetRolloverState = {
  globalRolloverEnabled: boolean;
  lastAppliedPeriodKey: string | null;
  setGlobalRolloverEnabled: (enabled: boolean) => void;
  setLastAppliedPeriodKey: (key: string) => void;
};

export const useBudgetRolloverStore = create<BudgetRolloverState>()(
  persist(
    (set) => ({
      globalRolloverEnabled: false,
      lastAppliedPeriodKey: null,
      setGlobalRolloverEnabled: (globalRolloverEnabled) => set({ globalRolloverEnabled }),
      setLastAppliedPeriodKey: (lastAppliedPeriodKey) => set({ lastAppliedPeriodKey }),
    }),
    { name: "paycheck-planner-budget-rollover" }
  )
);
