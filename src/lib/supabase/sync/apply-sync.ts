import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { stateFingerprint, stateFingerprintsDiffer } from "@/lib/supabase/sync/sync-fingerprint";
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
      preferences: remote.preferences,
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
    preferences: state.preferences,
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

export function shouldPreferRemote(local: RemoteAppState, remote: RemoteAppState) {
  const localCount = countRemoteEntities(local);
  const remoteCount = countRemoteEntities(remote);

  if (remoteCount > localCount) return true;
  if (localCount > remoteCount) return false;

  if (remote.onboardingCompleted && !local.onboardingCompleted) return true;
  if (local.onboardingCompleted && !remote.onboardingCompleted) return false;

  if (remoteCount === 0 && localCount === 0) return false;

  return stateFingerprintsDiffer(local, remote);
}

/** Merge remote into local. When `preferRemoteOnConflict`, server rows win on id collisions (cross-device pull). */
export function mergeRemoteWithLocal(
  local: RemoteAppState,
  remote: RemoteAppState,
  options?: { preferRemoteOnConflict?: boolean }
): RemoteAppState {
  const preferRemote = options?.preferRemoteOnConflict ?? false;
  const mergeLists = <T extends { id: string }>(localItems: T[], remoteItems: T[]): T[] => {
    const remoteMap = new Map(remoteItems.map((item) => [item.id, item]));
    const merged = [...remoteItems];
    for (const item of localItems) {
      if (!remoteMap.has(item.id)) {
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
    preferences: { ...remote.preferences, ...local.preferences },
    onboardingCompleted: remote.onboardingCompleted || local.onboardingCompleted,
    accounts: mergeLists(local.accounts, remote.accounts),
    categories: mergeLists(local.categories, remote.categories),
    transactions: mergeLists(local.transactions, remote.transactions),
    recurring: mergeLists(local.recurring, remote.recurring),
    goals: mergeLists(local.goals, remote.goals),
  };
}

export { stateFingerprint, stateFingerprintsDiffer };
