import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { countLocalEntities } from "@/lib/supabase/sync/apply-sync";

let pushPending = false;
let lastSyncedEntityCount = -1;

export function markLocalSyncDirty() {
  pushPending = true;
}

export function markLocalSyncClean(state?: RemoteAppState) {
  pushPending = false;
  lastSyncedEntityCount = state
    ? state.accounts.length +
      state.categories.length +
      state.transactions.length +
      state.recurring.length +
      state.goals.length
    : countLocalEntities();
}

export function resetLocalSyncTracking() {
  pushPending = false;
  lastSyncedEntityCount = -1;
}

/** Skip remote pulls while local edits may not be uploaded yet. */
export function hasUnsyncedLocalChanges() {
  if (pushPending) return true;
  if (lastSyncedEntityCount < 0) return false;
  return countLocalEntities() !== lastSyncedEntityCount;
}

export function hasCompletedInitialSync() {
  return lastSyncedEntityCount >= 0;
}
