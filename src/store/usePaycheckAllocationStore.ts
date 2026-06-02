"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { formatLocalDate } from "@/lib/dates/parse-local-date";

export type PaycheckAllocationLine = {
  targetId: string;
  targetType: "category" | "goal";
  label: string;
  amount: number;
};

export type PaycheckAllocationPlan = {
  id: string;
  date: string;
  paycheckAmount: number;
  lines: PaycheckAllocationLine[];
};

type State = {
  plans: PaycheckAllocationPlan[];
  savePlan: (plan: Omit<PaycheckAllocationPlan, "id" | "date"> & { date?: string }) => void;
  latestForPeriod: () => PaycheckAllocationPlan | undefined;
};

export const usePaycheckAllocationStore = create<State>()(
  persist(
    (set, get) => ({
      plans: [],
      savePlan: (plan) => {
        const entry: PaycheckAllocationPlan = {
          id: nanoid(),
          date: plan.date ?? formatLocalDate(new Date()),
          paycheckAmount: plan.paycheckAmount,
          lines: plan.lines,
        };
        set((state) => ({
          plans: [entry, ...state.plans].slice(0, 24),
        }));
      },
      latestForPeriod: () => {
        const today = formatLocalDate(new Date());
        return get().plans.find((p) => p.date === today);
      },
    }),
    {
      name: "planner-paycheck-allocations",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
