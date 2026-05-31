import { setClientDemoMode } from "@/lib/auth/demo-mode";
import type { SessionPayload } from "@/lib/auth/session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { bootstrapUserSession } from "@/lib/supabase/sync/client";
import { resetLocalSyncTracking } from "@/lib/supabase/sync/sync-dirty";
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

/** After OAuth or email login — scope persisted app data to the signed-in user. Cloud sync runs in CloudSyncProvider. */
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
}

/** Clear sign-in dedupe when session ends (call from sign-out). */
export function resetSignInClientState() {
  lastCompletedUserId = null;
  resetLocalSyncTracking();
}

/** Force re-sync on next sign-in (e.g. after user switch). */
export function resetSignInDedupe() {
  lastCompletedUserId = null;
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
  const { markOnboardingCompletedRemote } = await import("@/lib/supabase/sync/client");
  await markOnboardingCompletedRemote();
  const { hasCloudDataSync } = await import("@/lib/db/client");
  if (hasCloudDataSync) {
    const { buildLocalRemoteState } = await import("@/lib/supabase/sync/apply-sync");
    const { pushLocalStateToCloud } = await import("@/lib/supabase/sync/client");
    const { markLocalSyncClean } = await import("@/lib/supabase/sync/sync-dirty");
    const state = buildLocalRemoteState();
    const pushed = await pushLocalStateToCloud(state);
    if (pushed) markLocalSyncClean(state);
  }
}
