"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export type AllocationTargetType = "category" | "goal" | "reserve";

export type PaycheckAllocationLine = {
  id: string;
  targetType: AllocationTargetType;
  targetId: string;
  label: string;
  amount: number;
};

export type PaycheckPlannerState = {
  /** Per paycheck (`ruleId:yyyy-MM-dd`) allocation lines */
  allocationPlans: Record<string, PaycheckAllocationLine[]>;
  setAllocationPlan: (paycheckKey: string, lines: PaycheckAllocationLine[]) => void;
  upsertAllocationLine: (paycheckKey: string, line: Omit<PaycheckAllocationLine, "id"> & { id?: string }) => void;
  removeAllocationLine: (paycheckKey: string, lineId: string) => void;
};

export function paycheckPlanKey(ruleId: string, date: string) {
  return `${ruleId}:${date}`;
}

export const usePaycheckPlannerStore = create<PaycheckPlannerState>()(
  persist(
    (set) => ({
      allocationPlans: {},
      setAllocationPlan: (paycheckKey, lines) =>
        set((state) => ({
          allocationPlans: { ...state.allocationPlans, [paycheckKey]: lines },
        })),
      upsertAllocationLine: (paycheckKey, line) =>
        set((state) => {
          const existing = state.allocationPlans[paycheckKey] ?? [];
          const id = line.id ?? nanoid();
          const idx = existing.findIndex((l) => l.id === id);
          const next =
            idx >= 0
              ? existing.map((l) => (l.id === id ? { ...line, id } : l))
              : [...existing, { ...line, id }];
          return {
            allocationPlans: { ...state.allocationPlans, [paycheckKey]: next },
          };
        }),
      removeAllocationLine: (paycheckKey, lineId) =>
        set((state) => ({
          allocationPlans: {
            ...state.allocationPlans,
            [paycheckKey]: (state.allocationPlans[paycheckKey] ?? []).filter((l) => l.id !== lineId),
          },
        })),
    }),
    {
      name: "planner-paycheck-allocations",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
