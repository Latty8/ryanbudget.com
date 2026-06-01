"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { TransactionRule } from "@/types/transaction-rules";

type RulesState = {
  rules: TransactionRule[];
  addRule: (rule: Omit<TransactionRule, "id" | "priority"> & { priority?: number }) => string;
  updateRule: (id: string, patch: Partial<TransactionRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
};

export const useTransactionRulesStore = create<RulesState>()(
  persist(
    (set, get) => ({
      rules: [],
      addRule: (rule) => {
        const id = nanoid();
        const maxPriority = get().rules.reduce((m, r) => Math.max(m, r.priority), 0);
        set((state) => ({
          rules: [
            ...state.rules,
            {
              ...rule,
              id,
              priority: rule.priority ?? maxPriority + 1,
              merchantContains: rule.merchantContains.map((s) => s.trim()).filter(Boolean),
            },
          ],
        }));
        return id;
      },
      updateRule: (id, patch) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...patch,
                  merchantContains:
                    patch.merchantContains?.map((s) => s.trim()).filter(Boolean) ?? r.merchantContains,
                }
              : r
          ),
        })),
      deleteRule: (id) => set((state) => ({ rules: state.rules.filter((r) => r.id !== id) })),
      toggleRule: (id) =>
        set((state) => ({
          rules: state.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        })),
    }),
    {
      name: "planner-transaction-rules",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
