import { setClientDemoMode } from "@/lib/auth/demo-mode";
import type { SessionPayload } from "@/lib/auth/session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { logDataSync, logLocalStoreSnapshot } from "@/lib/debug/data-sync-log";
import { bootstrapUserSession } from "@/lib/supabase/sync/client";
import {
  clearPersistedSyncMetaForUser,
  resetLocalSyncTrackingForNewSession,
} from "@/lib/supabase/sync/sync-dirty";
import { setPersistUserId, getPersistUserId } from "@/lib/storage/user-persist";
import { rehydrateDeviceUiStore } from "@/store/useDeviceUiStore";
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

/** After email login or session refresh — scope persisted app data to the signed-in user. */
export async function completeSignInClient(user: SessionPayload) {
  const previousUserId = lastCompletedUserId;
  const userChanged = previousUserId !== user.userId;
  lastCompletedUserId = user.userId;

  logDataSync("sign-in", {
    userId: user.userId,
    email: user.email,
    userChanged,
    previousUserId,
  });

  setClientDemoMode(user.isDemo === true);
  setPersistUserId(user.userId);

  if (userChanged) {
    if (previousUserId) clearPersistedSyncMetaForUser(previousUserId);
    resetLocalSyncTrackingForNewSession(user.userId);
    useAppDataStore.getState().resetAppData();
  }

  await useAppDataStore.persist.rehydrate();
  await rehydrateDeviceUiStore();
  useAppDataStore.getState().setProfile({ name: user.name, email: user.email });

  logLocalStoreSnapshot("after-rehydrate");

  if (isDemoUserId(user.userId)) {
    await applyOnboardingFromServer(true);
    return;
  }

  const bootstrap = await bootstrapUserSession();
  logDataSync("bootstrap", {
    userId: user.userId,
    persistKey: getPersistUserId(),
    onboardingCompleted: bootstrap.onboardingCompleted,
    syncEnabled: bootstrap.syncEnabled,
  });

  const storeComplete = useAppDataStore.getState().onboardingComplete;
  if (bootstrap.onboardingCompleted || storeComplete) {
    await applyOnboardingFromServer(true);
  }
}

/** Clear sign-in dedupe and local app state (call from sign-out). */
export function resetSignInClientState() {
  const prev = lastCompletedUserId;
  lastCompletedUserId = null;
  if (prev) clearPersistedSyncMetaForUser(prev);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem("planner-cloud-sync-enabled");
    } catch {
      /* ignore */
    }
  }
  useAppDataStore.getState().resetAppData();
}

/** Clear in-memory app data without clearing sign-in dedupe. */
export function resetAppDataState() {
  useAppDataStore.getState().resetAppData();
}

/** Force re-sync on next sign-in (e.g. after user switch). */
export function resetSignInDedupe() {
  lastCompletedUserId = null;
}

/** Mark onboarding complete locally, in the database, and in the onboarded cookie. */
export async function completeOnboardingForUser() {
  useAppDataStore.getState().completeOnboarding();

  const profileRes = await fetch("/api/user/profile", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboardingCompleted: true }),
  });
  if (!profileRes.ok) {
    throw new Error("Could not save onboarding status. Check your connection and try again.");
  }

  await fetch("/api/auth/session", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarded: true }),
  });

  const { isClientCloudSyncEnabled } = await import("@/lib/db/client");
  if (isClientCloudSyncEnabled()) {
    const { buildLocalRemoteState } = await import("@/lib/supabase/sync/apply-sync");
    const { pushLocalStateToCloud } = await import("@/lib/supabase/sync/client");
    const { markLocalSyncClean } = await import("@/lib/supabase/sync/sync-dirty");
    const state = buildLocalRemoteState();
    const pushed = await pushLocalStateToCloud(state);
    if (pushed) markLocalSyncClean(state);
  }
}
