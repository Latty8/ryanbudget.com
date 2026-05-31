"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasCloudDataSync } from "@/lib/db/client";
import {
  applyRemoteStateToStore,
  buildLocalRemoteState,
  countLocalEntities,
  isApplyingRemoteSync,
  shouldPreferRemote,
} from "@/lib/supabase/sync/apply-sync";
import {
  bootstrapUserSession,
  pullAndApplyCloudState,
  pullCloudState,
  pushLocalStateToCloud,
  PUSH_DEBOUNCE_MS,
  subscribeToCloudChanges,
} from "@/lib/supabase/sync/client";
import { applyOnboardingFromServer } from "@/lib/auth/complete-sign-in-client";
import { markLocalSyncClean, markLocalSyncDirty, resetLocalSyncTracking } from "@/lib/supabase/sync/sync-dirty";
import { useAppDataStore } from "@/store/useAppDataStore";

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

      resetLocalSyncTracking();

      try {
        const bootstrap = await bootstrapUserSession();
        await applyOnboardingFromServer(bootstrap.onboardingCompleted);

        if (!hasCloudDataSync) {
          initialSyncDone.current = true;
          return;
        }

        const payload = await pullCloudState();
        const remote = payload?.state ?? null;
        const local = buildLocalRemoteState();

        if (remote) {
          if (shouldPreferRemote(local, remote)) {
            applyRemoteStateToStore(remote);
            markLocalSyncClean(remote);
            if (remote.onboardingCompleted) await applyOnboardingFromServer(true);
          } else if (countLocalEntities() > 0) {
            const pushed = await pushLocalStateToCloud(local);
            if (pushed) markLocalSyncClean(local);
          } else {
            applyRemoteStateToStore(remote);
            markLocalSyncClean(remote);
            if (remote.onboardingCompleted) await applyOnboardingFromServer(true);
          }
        } else if (countLocalEntities() > 0) {
          const pushed = await pushLocalStateToCloud(local);
          if (pushed) markLocalSyncClean(local);
        }

        initialSyncDone.current = true;
        unsubscribeRealtime = subscribeToCloudChanges(user.userId);
      } catch (error) {
        console.error("[cloud-sync] initial sync failed", error);
        initialSyncDone.current = true;
      }
    };

    void runInitialSync();

    const onVisible = () => {
      if (document.visibilityState !== "visible" || !hasCloudDataSync || !initialSyncDone.current) return;
      void pullAndApplyCloudState();
    };

    document.addEventListener("visibilitychange", onVisible);

    const onOnline = () => {
      if (!hasCloudDataSync || !initialSyncDone.current) return;
      void pullAndApplyCloudState({ force: true });
    };

    window.addEventListener("online", onOnline);

    return () => {
      unsubscribeRealtime?.();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId || isDemoUserId(user.userId) || !hasCloudDataSync) return;

    const schedulePush = () => {
      if (isApplyingRemoteSync()) return;
      markLocalSyncDirty();
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        pushTimer.current = null;
        const payload = buildLocalRemoteState();
        void pushLocalStateToCloud(payload).then((ok) => {
          if (ok) {
            markLocalSyncClean(payload);
            void pullAndApplyCloudState();
          }
        });
      }, PUSH_DEBOUNCE_MS);
    };

    const unsub = useAppDataStore.subscribe((state, prev) => {
      if (
        state.accounts !== prev.accounts ||
        state.categories !== prev.categories ||
        state.demoTransactions !== prev.demoTransactions ||
        state.demoRecurring !== prev.demoRecurring ||
        state.goals !== prev.goals ||
        state.preferences !== prev.preferences ||
        state.onboardingComplete !== prev.onboardingComplete ||
        state.profile !== prev.profile
      ) {
        schedulePush();
      }
    });

    return () => {
      unsub();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [user?.userId]);

  return null;
}
