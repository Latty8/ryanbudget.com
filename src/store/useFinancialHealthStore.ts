"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type FinancialHealthSnapshot = {
  monthKey: string;
  score: number;
};

type State = {
  snapshots: FinancialHealthSnapshot[];
  recordSnapshot: (monthKey: string, score: number) => void;
  getPriorScore: (monthKey: string) => number | null;
};

export const useFinancialHealthStore = create<State>()(
  persist(
    (set, get) => ({
      snapshots: [],
      recordSnapshot: (monthKey, score) =>
        set((state) => {
          const existing = state.snapshots.find((s) => s.monthKey === monthKey);
          if (existing?.score === score) return state;
          const rest = state.snapshots.filter((s) => s.monthKey !== monthKey);
          return { snapshots: [...rest, { monthKey, score }].slice(-24) };
        }),
      getPriorScore: (monthKey) => {
        const hit = get().snapshots.find((s) => s.monthKey === monthKey);
        return hit?.score ?? null;
      },
    }),
    { name: "paycheck-planner-health-snapshots" }
  )
);
