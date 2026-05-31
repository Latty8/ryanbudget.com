import type {
  AppPreferences,
  DeviceUiPreferences,
  SyncedAppPreferences,
} from "@/types/app-settings";

export const defaultSyncedPreferences: SyncedAppPreferences = {
  currency: "USD",
  dateFormat: "MDY",
  weekStart: "sunday",
  locale: "en",
};

export const defaultDeviceUiPreferences: DeviceUiPreferences = {
  budgetPeriod: "bi-weekly",
  budgetViewDensity: "comfortable",
};

/** Strip device-only fields before cloud sync / fingerprint. */
export function toSyncedPreferences(
  prefs: Partial<AppPreferences> | SyncedAppPreferences | null | undefined
): SyncedAppPreferences {
  if (!prefs) return { ...defaultSyncedPreferences };
  return {
    currency: prefs.currency ?? defaultSyncedPreferences.currency,
    dateFormat: prefs.dateFormat ?? defaultSyncedPreferences.dateFormat,
    weekStart: prefs.weekStart ?? defaultSyncedPreferences.weekStart,
    locale: prefs.locale ?? defaultSyncedPreferences.locale,
  };
}

export function extractDeviceUiPreferences(
  prefs: Partial<AppPreferences> | null | undefined
): Partial<DeviceUiPreferences> {
  if (!prefs) return {};
  const out: Partial<DeviceUiPreferences> = {};
  if (prefs.budgetPeriod) out.budgetPeriod = prefs.budgetPeriod;
  if (prefs.budgetViewDensity) out.budgetViewDensity = prefs.budgetViewDensity;
  return out;
}
