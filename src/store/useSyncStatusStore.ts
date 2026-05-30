"use client";

import { create } from "zustand";

type SyncStatus = "idle" | "syncing" | "error";

type SyncStatusState = {
  status: SyncStatus;
  message: string | null;
  setSyncing: (message?: string) => void;
  setIdle: () => void;
  setError: (message: string) => void;
};

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: "idle",
  message: null,
  setSyncing: (message = "Syncing…") => set({ status: "syncing", message }),
  setIdle: () => set({ status: "idle", message: null }),
  setError: (message) => set({ status: "error", message }),
}));
