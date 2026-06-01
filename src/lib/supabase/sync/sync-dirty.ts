import type { RemoteAppState } from "@/lib/supabase/sync/types";
import {
  loadPersistedSyncMeta,
  savePersistedSyncMeta,
  clearPersistedSyncMeta,
  type SyncConflictContext,
} from "@/lib/supabase/sync/sync-meta-storage";
import { getPersistUserId } from "@/lib/storage/user-persist";
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
    savePersistedSyncMeta({
      lastSyncedFingerprint,
      lastAppliedRevision: lastAppliedRemoteRevision,
      lastSyncedEntityCount,
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  lastSyncedEntityCount = countLocalEntities();
  lastSyncedFingerprint = stateFingerprint(buildLocalRemoteState());
  savePersistedSyncMeta({
    lastSyncedFingerprint,
    lastAppliedRevision: lastAppliedRemoteRevision,
    lastSyncedEntityCount,
    updatedAt: new Date().toISOString(),
  });
}

export function markRemoteRevisionApplied(revision: string | null | undefined) {
  if (!revision) return;
  lastAppliedRemoteRevision = revision;
  const meta = loadPersistedSyncMeta();
  if (meta) {
    savePersistedSyncMeta({ ...meta, lastAppliedRevision: revision });
  }
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

export function resetLocalSyncTracking(options?: { clearPersistedMeta?: boolean }) {
  pushPending = false;
  pushInFlight = false;
  if (options?.clearPersistedMeta) {
    lastSyncedEntityCount = -1;
    lastSyncedFingerprint = "";
    lastAppliedRemoteRevision = "";
    return;
  }
  const meta = loadPersistedSyncMeta();
  if (meta) {
    lastSyncedEntityCount = meta.lastSyncedEntityCount;
    lastSyncedFingerprint = meta.lastSyncedFingerprint;
    lastAppliedRemoteRevision = meta.lastAppliedRevision;
    return;
  }
  lastSyncedEntityCount = -1;
  lastSyncedFingerprint = "";
  lastAppliedRemoteRevision = "";
}

/** Full reset after account switch — never treat stale local cache as synced. */
export function resetLocalSyncTrackingForNewSession(userId: string) {
  clearPersistedSyncMeta(userId);
  resetLocalSyncTracking({ clearPersistedMeta: true });
}

export function clearPersistedSyncMetaForUser(userId?: string) {
  clearPersistedSyncMeta(userId ?? getPersistUserId());
  resetLocalSyncTracking({ clearPersistedMeta: true });
}

export function getSyncConflictContext(): SyncConflictContext {
  const meta = loadPersistedSyncMeta();
  return {
    lastSyncedFingerprint: meta?.lastSyncedFingerprint ?? lastSyncedFingerprint,
    lastAppliedRevision: meta?.lastAppliedRevision ?? lastAppliedRemoteRevision,
  };
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
