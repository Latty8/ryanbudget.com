"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { ActivityAction, ActivityEntity, ActivityLogEntry } from "@/types/activity-log";

const MAX_ENTRIES = 200;

type ActivityLogState = {
  entries: ActivityLogEntry[];
  log: (input: Omit<ActivityLogEntry, "id" | "at"> & { at?: string }) => void;
  clear: () => void;
};

export const useActivityLogStore = create<ActivityLogState>()(
  persist(
    (set) => ({
      entries: [],
      log: (input) =>
        set((state) => {
          const entry: ActivityLogEntry = {
            id: nanoid(),
            at: input.at ?? new Date().toISOString(),
            action: input.action,
            entity: input.entity,
            title: input.title,
            detail: input.detail,
          };
          return { entries: [entry, ...state.entries].slice(0, MAX_ENTRIES) };
        }),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "planner-activity-log",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function logActivity(
  action: ActivityAction,
  entity: ActivityEntity,
  title: string,
  detail?: string
) {
  useActivityLogStore.getState().log({ action, entity, title, detail });
}
