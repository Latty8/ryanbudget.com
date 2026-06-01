"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { completeSignInClient } from "@/lib/auth/complete-sign-in-client";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { isClientCloudSyncEnabled } from "@/lib/db/client";
import {
  applyRemoteStateToStore,
  buildLocalRemoteState,
  isApplyingRemoteSync,
  resolveInitialSync,
} from "@/lib/supabase/sync/apply-sync";
import {
  bootstrapUserSession,
  flushPendingCloudPush,
  pullAndApplyCloudState,
  pullCloudState,
  pushLocalStateNow,
  pushLocalStateToCloud,
  PUSH_DEBOUNCE_MS,
  subscribeToCloudChanges,
} from "@/lib/supabase/sync/client";
import { applyOnboardingFromServer } from "@/lib/auth/complete-sign-in-client";
import { logDataSync, logLocalStoreSnapshot, logRemoteSnapshot } from "@/lib/debug/data-sync-log";
import {
  getSyncConflictContext,
  markLocalSyncClean,
  markLocalSyncDirty,
} from "@/lib/supabase/sync/sync-dirty";
import { useAppDataStore } from "@/store/useAppDataStore";

function hadEntityDeleted(
  prev: ReturnType<typeof useAppDataStore.getState>,
  next: ReturnType<typeof useAppDataStore.getState>
) {
  return (
    prev.accounts.length > next.accounts.length ||
    prev.categories.length > next.categories.length ||
    prev.demoTransactions.length > next.demoTransactions.length ||
    prev.demoRecurring.length > next.demoRecurring.length ||
    prev.goals.length > next.goals.length
  );
}

/** Keeps Zustand data in sync with MongoDB across devices — silent, no UI indicators. */
export function CloudSyncProvider() {
  const { user } = useAuth();
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserId = useRef<string | null>(null);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    if (!user?.userId || isDemoUserId(user.userId)) return;

    let unsubscribeRealtime: (() => void) | null = null;

    const runInitialSync = async () => {
      const userChanged = lastUserId.current !== user.userId;
      if (!userChanged && initialSyncDone.current) return;
      lastUserId.current = user.userId;
      initialSyncDone.current = false;

      try {
        await completeSignInClient(user);

        const bootstrap = await bootstrapUserSession();
        if (bootstrap.onboardingCompleted) {
          await applyOnboardingFromServer(true);
        }

        if (!isClientCloudSyncEnabled()) {
          logDataSync("initial-sync-skipped", {
            userId: user.userId,
            reason: "client-cloud-sync-disabled",
          });
          initialSyncDone.current = true;
          return;
        }

        const payload = await pullCloudState();
        const remote = payload?.state ?? null;
        logRemoteSnapshot("pull", remote);
        logLocalStoreSnapshot("before-initial-sync");

        const local = buildLocalRemoteState();
        const remoteCount =
          (remote?.accounts.length ?? 0) +
          (remote?.categories.length ?? 0) +
          (remote?.transactions.length ?? 0) +
          (remote?.recurring.length ?? 0) +
          (remote?.goals.length ?? 0);

        let action = resolveInitialSync(local, remote, payload?.revision, {
          ...getSyncConflictContext(),
          remoteRevision: payload?.revision,
        });

        if (userChanged && remote && remoteCount > 0) {
          action = "apply-remote";
        }

        logDataSync("initial-sync", {
          userId: user.userId,
          userChanged,
          action,
          revision: payload?.revision ?? null,
        });

        if (action === "apply-remote" && remote) {
          applyRemoteStateToStore(remote);
          markLocalSyncClean(remote);
          if (remote.onboardingCompleted) await applyOnboardingFromServer(true);
        } else if (action === "push-local") {
          const pushed = await pushLocalStateToCloud(local);
          if (pushed) markLocalSyncClean(local);
        } else if (remote) {
          applyRemoteStateToStore(remote);
          markLocalSyncClean(remote);
          if (useAppDataStore.getState().onboardingComplete) {
            await applyOnboardingFromServer(true);
          }
        }

        initialSyncDone.current = true;
        unsubscribeRealtime = subscribeToCloudChanges(user.userId);
        logLocalStoreSnapshot("after-initial-sync");
      } catch (error) {
        console.error("[cloud-sync] initial sync failed", error);
        initialSyncDone.current = true;
        unsubscribeRealtime = subscribeToCloudChanges(user.userId);
        window.setTimeout(() => {
          void pullAndApplyCloudState({ force: true });
        }, 12_000);
      }
    };

    void runInitialSync();

    const onVisible = () => {
      if (document.visibilityState !== "visible" || !isClientCloudSyncEnabled() || !initialSyncDone.current) {
        return;
      }
      void pullAndApplyCloudState({ force: true });
    };

    document.addEventListener("visibilitychange", onVisible);

    const onOnline = () => {
      if (!isClientCloudSyncEnabled() || !initialSyncDone.current) return;
      void pullAndApplyCloudState({ force: true });
    };

    window.addEventListener("online", onOnline);

    const onPageHide = () => {
      if (!isClientCloudSyncEnabled() || !initialSyncDone.current) return;
      if (pushTimer.current) {
        clearTimeout(pushTimer.current);
        pushTimer.current = null;
      }
      flushPendingCloudPush();
    };

    window.addEventListener("pagehide", onPageHide);

    return () => {
      unsubscribeRealtime?.();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId || isDemoUserId(user.userId) || !isClientCloudSyncEnabled()) return;

    const schedulePush = (immediate = false) => {
      if (isApplyingRemoteSync()) return;
      markLocalSyncDirty();
      if (pushTimer.current) clearTimeout(pushTimer.current);

      if (immediate) {
        pushTimer.current = null;
        void pushLocalStateNow();
        return;
      }

      pushTimer.current = setTimeout(() => {
        pushTimer.current = null;
        void pushLocalStateNow();
      }, PUSH_DEBOUNCE_MS);
    };

    const unsub = useAppDataStore.subscribe((state, prev) => {
      const dataChanged =
        state.accounts !== prev.accounts ||
        state.categories !== prev.categories ||
        state.demoTransactions !== prev.demoTransactions ||
        state.demoRecurring !== prev.demoRecurring ||
        state.goals !== prev.goals ||
        state.preferences !== prev.preferences ||
        state.onboardingComplete !== prev.onboardingComplete ||
        state.profile !== prev.profile;

      if (!dataChanged) return;

      schedulePush(hadEntityDeleted(prev, state));
    });

    return () => {
      unsub();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [user?.userId]);

  return null;
}
