import type { RemoteAppState } from "@/lib/supabase/sync/types";
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

  return remoteCount > 0;
}
