"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { formatLocalDate } from "@/lib/dates/parse-local-date";
import type { NetWorthItem, NetWorthSnapshot } from "@/types/net-worth";

type NetWorthState = {
  manualItems: NetWorthItem[];
  snapshots: NetWorthSnapshot[];
  addItem: (item: Omit<NetWorthItem, "id">) => string;
  updateItem: (id: string, patch: Partial<NetWorthItem>) => void;
  deleteItem: (id: string) => void;
  recordSnapshot: (totals: { assets: number; liabilities: number }) => void;
  clearSnapshots: () => void;
};

export const useNetWorthStore = create<NetWorthState>()(
  persist(
    (set, get) => ({
      manualItems: [],
      snapshots: [],
      addItem: (item) => {
        const id = nanoid();
        set((state) => ({ manualItems: [...state.manualItems, { ...item, id }] }));
        return id;
      },
      updateItem: (id, patch) =>
        set((state) => ({
          manualItems: state.manualItems.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        })),
      deleteItem: (id) =>
        set((state) => ({ manualItems: state.manualItems.filter((row) => row.id !== id) })),
      recordSnapshot: ({ assets, liabilities }) => {
        const date = formatLocalDate(new Date());
        const netWorth = assets - liabilities;
        set((state) => {
          const withoutToday = state.snapshots.filter((s) => s.date !== date);
          const snap: NetWorthSnapshot = {
            id: nanoid(),
            date,
            totalAssets: assets,
            totalLiabilities: liabilities,
            netWorth,
          };
          return { snapshots: [...withoutToday, snap].sort((a, b) => a.date.localeCompare(b.date)) };
        });
      },
      clearSnapshots: () => set({ snapshots: [] }),
    }),
    {
      name: "planner-net-worth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
