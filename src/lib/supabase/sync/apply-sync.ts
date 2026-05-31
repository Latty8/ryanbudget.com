import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { toSyncedPreferences } from "@/lib/preferences/sync-preferences";
import { stateFingerprint, stateFingerprintsDiffer } from "@/lib/supabase/sync/sync-fingerprint";
import type { SyncConflictContext } from "@/lib/supabase/sync/sync-meta-storage";
import { useAppDataStore } from "@/store/useAppDataStore";

let applyingRemote = false;

export function isApplyingRemoteSync() {
  return applyingRemote;
}

export function applyRemoteStateToStore(remote: RemoteAppState) {
  applyingRemote = true;
  try {
    useAppDataStore.setState({
      profile: remote.profile,
      preferences: toSyncedPreferences(remote.preferences),
      onboardingComplete: remote.onboardingCompleted,
      accounts: remote.accounts,
      categories: remote.categories,
      demoTransactions: remote.transactions,
      demoRecurring: remote.recurring,
      goals: remote.goals,
    });
  } finally {
    applyingRemote = false;
  }
}

export function buildLocalRemoteState(): RemoteAppState {
  const state = useAppDataStore.getState();
  return {
    profile: state.profile,
    preferences: toSyncedPreferences(state.preferences),
    onboardingCompleted: state.onboardingComplete,
    accounts: state.accounts,
    categories: state.categories,
    transactions: state.demoTransactions,
    recurring: state.demoRecurring,
    goals: state.goals,
  };
}

export function countLocalEntities(state = useAppDataStore.getState()) {
  return (
    state.accounts.length +
    state.categories.length +
    state.demoTransactions.length +
    state.demoRecurring.length +
    state.goals.length
  );
}

export function countRemoteEntities(state: RemoteAppState) {
  return (
    state.accounts.length +
    state.categories.length +
    state.transactions.length +
    state.recurring.length +
    state.goals.length
  );
}

function isIdSuperset<T extends { id: string }>(localItems: T[], remoteItems: T[]): boolean {
  const localIds = new Set(localItems.map((item) => item.id));
  return remoteItems.every((item) => localIds.has(item.id));
}

/** True when local still contains every remote row but has extra rows (likely stale after remote deletes). */
export function isLocalStaleSuperset(local: RemoteAppState, remote: RemoteAppState): boolean {
  const localCount = countRemoteEntities(local);
  const remoteCount = countRemoteEntities(remote);
  if (localCount <= remoteCount || remoteCount === 0) return false;

  return (
    isIdSuperset(local.accounts, remote.accounts) &&
    isIdSuperset(local.categories, remote.categories) &&
    isIdSuperset(local.transactions, remote.transactions) &&
    isIdSuperset(local.recurring, remote.recurring) &&
    isIdSuperset(local.goals, remote.goals)
  );
}

export function shouldPreferRemote(
  local: RemoteAppState,
  remote: RemoteAppState,
  ctx?: SyncConflictContext
) {
  const localFp = stateFingerprint(local);
  const remoteFp = stateFingerprint(remote);
  if (localFp === remoteFp) return false;

  const localCount = countRemoteEntities(local);
  const remoteCount = countRemoteEntities(remote);
  const lastSynced = ctx?.lastSyncedFingerprint ?? "";
  const remoteRevision = ctx?.remoteRevision;
  const lastApplied = ctx?.lastAppliedRevision ?? "";

  // Local unchanged since last successful upload — trust server (cross-device deletes/updates).
  if (lastSynced && localFp === lastSynced) return true;

  // Server revision advanced and local wasn't edited offline.
  if (
    remoteRevision &&
    lastApplied &&
    remoteRevision !== lastApplied &&
    lastSynced &&
    localFp === lastSynced
  ) {
    return true;
  }

  // Stale cache: local is a strict superset of remote ids (deleted elsewhere).
  if (isLocalStaleSuperset(local, remote)) return true;

  if (remoteCount > localCount) return true;
  if (localCount > remoteCount) return false;

  if (remote.onboardingCompleted && !local.onboardingCompleted) return true;
  if (local.onboardingCompleted && !remote.onboardingCompleted) return false;

  if (remoteRevision && lastApplied && remoteRevision !== lastApplied) return true;

  return stateFingerprintsDiffer(local, remote);
}

export type InitialSyncAction = "apply-remote" | "push-local" | "noop";

export function resolveInitialSync(
  local: RemoteAppState,
  remote: RemoteAppState | null,
  remoteRevision: string | null | undefined,
  ctx?: SyncConflictContext
): InitialSyncAction {
  if (!remote) {
    return countRemoteEntities(local) > 0 ? "push-local" : "noop";
  }

  const remoteCount = countRemoteEntities(remote);
  const localCount = countRemoteEntities(local);

  if (remoteCount === 0 && localCount === 0) return "noop";
  if (remoteCount === 0 && localCount > 0) return "push-local";

  if (shouldPreferRemote(local, remote, { ...ctx, remoteRevision })) {
    return "apply-remote";
  }

  if (localCount > 0) return "push-local";
  return "apply-remote";
}

/** Merge remote into local. When `preferRemoteOnConflict`, server rows win on id collisions (cross-device pull). */
export function mergeRemoteWithLocal(
  local: RemoteAppState,
  remote: RemoteAppState,
  options?: { preferRemoteOnConflict?: boolean; omitLocalOnlyNotOnRemote?: boolean }
): RemoteAppState {
  const preferRemote = options?.preferRemoteOnConflict ?? false;
  const omitLocalOnly = options?.omitLocalOnlyNotOnRemote ?? false;
  const mergeLists = <T extends { id: string }>(localItems: T[], remoteItems: T[]): T[] => {
    const remoteMap = new Map(remoteItems.map((item) => [item.id, item]));
    const merged = [...remoteItems];
    for (const item of localItems) {
      if (!remoteMap.has(item.id)) {
        if (omitLocalOnly) continue;
        merged.push(item);
        continue;
      }
      const index = merged.findIndex((row) => row.id === item.id);
      if (index >= 0) {
        merged[index] = preferRemote ? remoteMap.get(item.id)! : item;
      }
    }
    return merged;
  };

  return {
    profile: remote.profile.email ? remote.profile : local.profile,
    preferences: toSyncedPreferences({ ...remote.preferences, ...local.preferences }),
    onboardingCompleted: remote.onboardingCompleted || local.onboardingCompleted,
    accounts: mergeLists(local.accounts, remote.accounts),
    categories: mergeLists(local.categories, remote.categories),
    transactions: mergeLists(local.transactions, remote.transactions),
    recurring: mergeLists(local.recurring, remote.recurring),
    goals: mergeLists(local.goals, remote.goals),
  };
}

export { stateFingerprint, stateFingerprintsDiffer };
