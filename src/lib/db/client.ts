/** Client-side cloud sync availability (no server secrets). */
const BUILD_TIME_SYNC = process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === "true";
const SYNC_SESSION_KEY = "planner-cloud-sync-enabled";

/** Set from /api/user/bootstrap when the server has MongoDB sync enabled. */
let runtimeCloudSyncEnabled = BUILD_TIME_SYNC;

export function setClientCloudSyncEnabled(enabled: boolean) {
  if (enabled) {
    runtimeCloudSyncEnabled = true;
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem(SYNC_SESSION_KEY, "1");
      } catch {
        /* private mode */
      }
    }
  }
}

export function isClientCloudSyncEnabled(): boolean {
  if (runtimeCloudSyncEnabled) return true;
  if (typeof sessionStorage !== "undefined") {
    try {
      if (sessionStorage.getItem(SYNC_SESSION_KEY) === "1") {
        runtimeCloudSyncEnabled = true;
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** @deprecated Prefer isClientCloudSyncEnabled() — kept for existing imports. */
export function hasCloudDataSync(): boolean {
  return isClientCloudSyncEnabled();
}
