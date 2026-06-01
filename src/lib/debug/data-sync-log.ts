import { getPersistUserId } from "@/lib/storage/user-persist";
import { countLocalEntities, buildLocalRemoteState } from "@/lib/supabase/sync/apply-sync";
import type { RemoteAppState } from "@/lib/supabase/sync/types";

const ENABLED =
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "development";

export function isDataSyncDebugEnabled() {
  return ENABLED;
}

export function logDataSync(scope: string, detail: Record<string, unknown>) {
  if (!ENABLED) return;
  console.info(`[data-sync:${scope}]`, {
    persistUserId: getPersistUserId(),
    ...detail,
  });
}

export function logLocalStoreSnapshot(scope: string) {
  if (!ENABLED) return;
  const state = buildLocalRemoteState();
  logDataSync(scope, {
    accounts: state.accounts.length,
    categories: state.categories.length,
    transactions: state.transactions.length,
    recurring: state.recurring.length,
    goals: state.goals.length,
    onboardingCompleted: state.onboardingCompleted,
    entityTotal: countLocalEntities(),
  });
}

export function logRemoteSnapshot(scope: string, remote: RemoteAppState | null) {
  if (!ENABLED) return;
  if (!remote) {
    logDataSync(scope, { remote: null });
    return;
  }
  logDataSync(scope, {
    accounts: remote.accounts.length,
    categories: remote.categories.length,
    transactions: remote.transactions.length,
    recurring: remote.recurring.length,
    goals: remote.goals.length,
    onboardingCompleted: remote.onboardingCompleted,
  });
}
