/** Client-side cloud sync availability (no server secrets). */
const BUILD_TIME_SYNC = process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === "true";

/** Set from /api/user/bootstrap when the server has MongoDB sync enabled. */
let runtimeCloudSyncEnabled = BUILD_TIME_SYNC;

export function setClientCloudSyncEnabled(enabled: boolean) {
  if (enabled) runtimeCloudSyncEnabled = true;
}

export function isClientCloudSyncEnabled(): boolean {
  return runtimeCloudSyncEnabled;
}

/** @deprecated Prefer isClientCloudSyncEnabled() — kept for existing imports. */
export function hasCloudDataSync(): boolean {
  return isClientCloudSyncEnabled();
}
