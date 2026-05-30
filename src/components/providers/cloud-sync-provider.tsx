"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { applyOnboardingFromServer } from "@/lib/auth/complete-sign-in-client";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
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
  subscribeToCloudChanges,
} from "@/lib/supabase/sync/client";
import { markLocalSyncClean, markLocalSyncDirty, resetLocalSyncTracking, hasCompletedInitialSync } from "@/lib/supabase/sync/sync-dirty";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useSyncStatusStore } from "@/store/useSyncStatusStore";

const PUSH_DELAY_MS = 500;

/** Keeps Zustand data in sync with Supabase across devices when cloud sync is enabled. */
export function CloudSyncProvider() {
  const { user } = useAuth();
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserId = useRef<string | null>(null);
  const initialSyncDone = useRef(false);
  const setSyncing = useSyncStatusStore((s) => s.setSyncing);
  const setIdle = useSyncStatusStore((s) => s.setIdle);
  const setError = useSyncStatusStore((s) => s.setError);

  useEffect(() => {
    if (!user?.userId || isDemoUserId(user.userId)) return;

    let unsubscribeRealtime: (() => void) | null = null;

    const runInitialSync = async () => {
      if (lastUserId.current === user.userId && initialSyncDone.current) return;
      lastUserId.current = user.userId;
      initialSyncDone.current = false;

      if (hasCompletedInitialSync()) {
        initialSyncDone.current = true;
        unsubscribeRealtime = subscribeToCloudChanges(user.userId);
        setIdle();
        return;
      }

      resetLocalSyncTracking();

      setSyncing("Loading your data…");

      try {
        const bootstrap = await bootstrapUserSession();
        await applyOnboardingFromServer(bootstrap.onboardingCompleted);

        if (!hasSupabaseDataSync) {
          initialSyncDone.current = true;
          setIdle();
          return;
        }

        const remote = await pullCloudState();
        const local = buildLocalRemoteState();
        let loadedFromCloud = false;

        if (remote) {
          if (shouldPreferRemote(local, remote)) {
            applyRemoteStateToStore(remote);
            loadedFromCloud = true;
            markLocalSyncClean(remote);
            if (remote.onboardingCompleted) {
              await applyOnboardingFromServer(true);
            }
          } else if (countLocalEntities() > 0) {
            const pushed = await pushLocalStateToCloud(local);
            if (pushed) {
              markLocalSyncClean(local);
            } else {
              setError("Could not upload");
              toast.error("Could not sync to the cloud. Changes are saved on this device.");
            }
          }
        } else if (countLocalEntities() > 0) {
          const pushed = await pushLocalStateToCloud(local);
          if (pushed) {
            markLocalSyncClean(local);
          } else {
            setError("Could not upload");
            toast.error("Could not sync to the cloud. Changes are saved on this device.");
          }
        }

        initialSyncDone.current = true;
        unsubscribeRealtime = subscribeToCloudChanges(user.userId);
        setIdle();

        if (loadedFromCloud) {
          toast.success("Your data is synced across devices");
        }
      } catch {
        setError("Sync failed");
        toast.error("Could not load cloud data. Using data on this device.");
        setIdle();
      }
    };

    void runInitialSync();

    const onVisible = () => {
      if (document.visibilityState !== "visible" || !hasSupabaseDataSync || !initialSyncDone.current) return;
      setSyncing("Syncing…");
      void pullAndApplyCloudState().finally(() => setIdle());
    };

    document.addEventListener("visibilitychange", onVisible);

    const onOnline = () => {
      if (!hasSupabaseDataSync || !initialSyncDone.current) return;
      setSyncing("Syncing…");
      void pullAndApplyCloudState().finally(() => setIdle());
    };

    window.addEventListener("online", onOnline);

    return () => {
      unsubscribeRealtime?.();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [user?.userId, setSyncing, setIdle, setError]);

  useEffect(() => {
    if (!user?.userId || isDemoUserId(user.userId) || !hasSupabaseDataSync) return;

    const schedulePush = () => {
      if (isApplyingRemoteSync()) return;
      markLocalSyncDirty();
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        pushTimer.current = null;
        const payload = buildLocalRemoteState();
        void pushLocalStateToCloud(payload).then((ok) => {
          if (!ok) {
            setError("Sync failed");
            toast.error("Could not sync changes. Saved on this device.");
          } else {
            markLocalSyncClean(payload);
            setIdle();
          }
        });
      }, PUSH_DELAY_MS);
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
        setSyncing("Syncing…");
        schedulePush();
      }
    });

    return () => {
      unsub();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [user?.userId, setSyncing, setIdle, setError]);

  return null;
}
