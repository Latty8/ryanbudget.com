import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { buildLocalRemoteState, countLocalEntities, stateFingerprint } from "@/lib/supabase/sync/apply-sync";

let pushPending = false;
let lastSyncedEntityCount = -1;
let lastSyncedFingerprint = "";

export function markLocalSyncDirty() {
  pushPending = true;
}

export function markLocalSyncClean(state?: RemoteAppState) {
  pushPending = false;
  if (state) {
    lastSyncedEntityCount = countRemoteEntitiesFromState(state);
    lastSyncedFingerprint = stateFingerprint(state);
    return;
  }
  lastSyncedEntityCount = countLocalEntities();
  lastSyncedFingerprint = "";
}

function countRemoteEntitiesFromState(state: RemoteAppState) {
  return (
    state.accounts.length +
    state.categories.length +
    state.transactions.length +
    state.recurring.length +
    state.goals.length
  );
}

export function resetLocalSyncTracking() {
  pushPending = false;
  lastSyncedEntityCount = -1;
  lastSyncedFingerprint = "";
}

/** Skip remote pulls while local edits may not be uploaded yet. */
export function hasUnsyncedLocalChanges() {
  if (pushPending) return true;
  if (lastSyncedEntityCount < 0) return false;

  const local = countLocalEntities();
  if (local !== lastSyncedEntityCount) return true;

  if (lastSyncedFingerprint) {
    return stateFingerprint(buildLocalRemoteState()) !== lastSyncedFingerprint;
  }

  return false;
}

export function hasCompletedInitialSync() {
  return lastSyncedEntityCount >= 0;
}
