import { setClientDemoMode } from "@/lib/auth/demo-mode";
import type { SessionPayload } from "@/lib/auth/session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import {
  applyRemoteStateToStore,
  buildLocalRemoteState,
  countLocalEntities,
  shouldPreferRemote,
} from "@/lib/supabase/sync/apply-sync";
import {
  bootstrapUserSession,
  markOnboardingCompletedRemote,
  pullCloudState,
  pushLocalStateToCloud,
} from "@/lib/supabase/sync/client";
import { markLocalSyncClean, resetLocalSyncTracking } from "@/lib/supabase/sync/sync-dirty";
import { setPersistUserId } from "@/lib/storage/user-persist";
import { useAppDataStore } from "@/store/useAppDataStore";

let lastCompletedUserId: string | null = null;

export async function applyOnboardingFromServer(onboardingCompleted: boolean) {
  if (!onboardingCompleted) return;
  useAppDataStore.getState().completeOnboarding();
  await fetch("/api/auth/session", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarded: true }),
  });
}

/** After OAuth or email login — sync auth user to persisted app data and cloud. */
export async function completeSignInClient(user: SessionPayload) {
  if (lastCompletedUserId === user.userId) return;
  lastCompletedUserId = user.userId;

  setClientDemoMode(user.isDemo === true);
  setPersistUserId(user.userId);
  resetLocalSyncTracking();
  await useAppDataStore.persist.rehydrate();
  useAppDataStore.getState().setProfile({ name: user.name, email: user.email });

  if (isDemoUserId(user.userId)) return;

  const bootstrap = await bootstrapUserSession();
  const storeComplete = useAppDataStore.getState().onboardingComplete;

  if (bootstrap.onboardingCompleted || storeComplete) {
    await applyOnboardingFromServer(true);
  }

  if (!hasSupabaseDataSync) return;

  const remote = await pullCloudState();
  const local = buildLocalRemoteState();

  if (remote && shouldPreferRemote(local, remote)) {
    applyRemoteStateToStore(remote);
    if (remote.onboardingCompleted) {
      await applyOnboardingFromServer(true);
    }
    markLocalSyncClean(remote);
  } else if (countLocalEntities() > 0) {
    const merged = buildLocalRemoteState();
    merged.onboardingCompleted =
      merged.onboardingCompleted || bootstrap.onboardingCompleted || storeComplete;
    const pushed = await pushLocalStateToCloud(merged);
    if (pushed) markLocalSyncClean(merged);
  } else if (remote) {
    markLocalSyncClean(remote);
  }
}

/** Clear sign-in dedupe when session ends (call from sign-out). */
export function resetSignInClientState() {
  lastCompletedUserId = null;
  resetLocalSyncTracking();
}

/** Mark onboarding complete locally and in Supabase profile (once per user). */
export async function completeOnboardingForUser() {
  useAppDataStore.getState().completeOnboarding();
  await fetch("/api/auth/session", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarded: true }),
  });
  await markOnboardingCompletedRemote();
  if (hasSupabaseDataSync) {
    const state = buildLocalRemoteState();
    const pushed = await pushLocalStateToCloud(state);
    if (pushed) markLocalSyncClean(state);
  }
}
