"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import {
  defaultDeviceUiPreferences,
  extractDeviceUiPreferences,
} from "@/lib/preferences/sync-preferences";
import { getPersistUserId } from "@/lib/storage/user-persist";
import { useAppDataStore } from "@/store/useAppDataStore";
import type {
  BudgetPeriodPreference,
  BudgetViewDensity,
  DeviceUiPreferences,
} from "@/types/app-settings";

type DeviceUiState = DeviceUiPreferences & {
  _legacyMigrated?: boolean;
  setBudgetPeriod: (budgetPeriod: BudgetPeriodPreference) => void;
  setBudgetViewDensity: (budgetViewDensity: BudgetViewDensity) => void;
};

function deviceUiStorageKey() {
  const userId = getPersistUserId();
  return `paycheck-planner-${userId}-device-ui`;
}

const deviceUiStorage: StateStorage = {
  getItem: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(deviceUiStorageKey());
  },
  setItem: (_name, value) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(deviceUiStorageKey(), value);
  },
  removeItem: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(deviceUiStorageKey());
  },
};

export const useDeviceUiStore = create<DeviceUiState>()(
  persist(
    (set) => ({
      ...defaultDeviceUiPreferences,
      _legacyMigrated: false,
      setBudgetPeriod: (budgetPeriod) => set({ budgetPeriod }),
      setBudgetViewDensity: (budgetViewDensity) => set({ budgetViewDensity }),
    }),
    {
      name: "device-ui",
      storage: createJSONStorage(() => deviceUiStorage),
      partialize: (state) => ({
        budgetPeriod: state.budgetPeriod,
        budgetViewDensity: state.budgetViewDensity,
        _legacyMigrated: state._legacyMigrated,
      }),
    }
  )
);

/** Pull budget period / density from old app-data preferences once per device. */
export function migrateDeviceUiFromLegacyPreferences() {
  const ui = useDeviceUiStore.getState();
  if (ui._legacyMigrated) return;

  const legacy = useAppDataStore.getState().preferences as Record<string, unknown>;
  const patch = extractDeviceUiPreferences(
    legacy as Parameters<typeof extractDeviceUiPreferences>[0]
  );

  useDeviceUiStore.setState({
    ...defaultDeviceUiPreferences,
    ...patch,
    _legacyMigrated: true,
  });
}

export async function rehydrateDeviceUiStore() {
  await useDeviceUiStore.persist.rehydrate();
  migrateDeviceUiFromLegacyPreferences();
}
