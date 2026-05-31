import type { RemoteAppState } from "@/lib/supabase/sync/types";
import {
  buildLocalRemoteState,
  countLocalEntities,
  mergeRemoteWithLocal,
} from "@/lib/supabase/sync/apply-sync";
import { stateFingerprint } from "@/lib/supabase/sync/sync-fingerprint";

let pushPending = false;
let pushInFlight = false;
let lastSyncedEntityCount = -1;
let lastSyncedFingerprint = "";
let lastAppliedRemoteRevision = "";

export function markLocalSyncDirty() {
  pushPending = true;
}

export function markPushInFlight(active: boolean) {
  pushInFlight = active;
}

export function isPushInFlight() {
  return pushInFlight;
}

export function markLocalSyncClean(state?: RemoteAppState) {
  pushPending = false;
  if (state) {
    lastSyncedEntityCount = countRemoteEntitiesFromState(state);
    lastSyncedFingerprint = stateFingerprint(state);
    return;
  }
  lastSyncedEntityCount = countLocalEntities();
  lastSyncedFingerprint = stateFingerprint(buildLocalRemoteState());
}

export function markRemoteRevisionApplied(revision: string | null | undefined) {
  if (revision) lastAppliedRemoteRevision = revision;
}

export function getLastAppliedRemoteRevision() {
  return lastAppliedRemoteRevision;
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
  pushInFlight = false;
  lastSyncedEntityCount = -1;
  lastSyncedFingerprint = "";
  lastAppliedRemoteRevision = "";
}

/** True while a debounced push is pending or local state differs from last successful upload. */
export function hasUnsyncedLocalChanges() {
  if (pushPending || pushInFlight) return true;
  if (lastSyncedEntityCount < 0) return false;

  const local = countLocalEntities();
  if (local !== lastSyncedEntityCount) return true;

  return stateFingerprint(buildLocalRemoteState()) !== lastSyncedFingerprint;
}

export function hasCompletedInitialSync() {
  return lastSyncedEntityCount >= 0;
}

export { mergeRemoteWithLocal };
