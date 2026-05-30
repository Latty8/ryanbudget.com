"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { ensureSupabaseAuthSession, getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { applyOnboardingFromServer } from "@/lib/auth/complete-sign-in-client";
import {
  applyRemoteStateToStore,
  buildLocalRemoteState,
  isApplyingRemoteSync,
  shouldPreferRemote,
  stateFingerprintsDiffer,
} from "@/lib/supabase/sync/apply-sync";
import { hasUnsyncedLocalChanges, markLocalSyncClean } from "@/lib/supabase/sync/sync-dirty";
import type { RemoteAppState } from "@/lib/supabase/sync/types";

const REALTIME_TABLES = [
  "accounts",
  "categories",
  "transactions",
  "recurring_rules",
  "goals",
  "profiles",
] as const;

const POLL_INTERVAL_MS = 45_000;

let pullTimer: ReturnType<typeof setTimeout> | null = null;
let pullInFlight = false;

export type PullOptions = {
  /** Bypass unsynced-local guard (manual sync). */
  force?: boolean;
};

export async function pullAndApplyCloudState(options?: PullOptions): Promise<boolean> {
  if (pullInFlight || isApplyingRemoteSync()) return false;
  if (!options?.force && hasUnsyncedLocalChanges()) return false;

  pullInFlight = true;
  try {
    const remote = await pullCloudState();
    if (!remote) return false;

    const local = buildLocalRemoteState();
    const shouldApply =
      shouldPreferRemote(local, remote) ||
      (options?.force && stateFingerprintsDiffer(local, remote));

    if (!shouldApply) return false;

    applyRemoteStateToStore(remote);
    markLocalSyncClean(remote);
    if (remote.onboardingCompleted) {
      await applyOnboardingFromServer(true);
    }
    return true;
  } finally {
    pullInFlight = false;
  }
}

function schedulePull(delayMs = 200) {
  if (pullTimer) clearTimeout(pullTimer);
  pullTimer = setTimeout(() => {
    pullTimer = null;
    void pullAndApplyCloudState();
  }, delayMs);
}

/** Push local state, then pull and apply remote changes. */
export async function forceSyncNow(): Promise<{ ok: boolean; message: string }> {
  if (!hasSupabaseDataSync) {
    return { ok: false, message: "Cloud sync is not enabled." };
  }

  const local = buildLocalRemoteState();
  const pushed = await pushLocalStateToCloud(local);
  if (!pushed) {
    return { ok: false, message: "Could not upload your changes." };
  }
  markLocalSyncClean(local);

  const pulled = await pullAndApplyCloudState({ force: true });
  if (pulled) {
    return { ok: true, message: "Data synced across devices." };
  }

  return { ok: true, message: "Already up to date." };
}

/** Single Realtime channel for all user tables — faster reconnect and instant pull on subscribe. */
export function subscribeToCloudChanges(
  userId: string,
  onPull?: () => void
): () => void {
  if (!hasSupabaseDataSync) return () => {};

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};

  let channel: RealtimeChannel | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let cancelled = false;

  void (async () => {
    const hasSession = await ensureSupabaseAuthSession();
    if (cancelled) return;

    if (!hasSession) {
      console.warn("[sync] No Supabase browser session — using polling fallback for realtime.");
    }

    channel = supabase.channel(`sync-all-${userId}`);

    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: table === "profiles" ? `id=eq.${userId}` : `profile_id=eq.${userId}`,
        },
        () => {
          onPull?.();
          schedulePull(150);
        }
      );
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        onPull?.();
        void pullAndApplyCloudState();
      }
    });

    pollTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      onPull?.();
      void pullAndApplyCloudState();
    }, POLL_INTERVAL_MS);
  })();

  return () => {
    cancelled = true;
    if (pullTimer) {
      clearTimeout(pullTimer);
      pullTimer = null;
    }
    if (pollTimer) clearInterval(pollTimer);
    if (channel) void supabase.removeChannel(channel);
  };
}

export async function pushLocalStateToCloud(state: RemoteAppState): Promise<boolean> {
  const res = await fetch("/api/sync/push", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  if (!res.ok) return false;
  const body = (await res.json()) as { ok?: boolean; synced?: boolean };
  return body.ok === true && body.synced !== false;
}

export async function pullCloudState(): Promise<RemoteAppState | null> {
  const res = await fetch("/api/sync/pull", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { state?: RemoteAppState | null; syncEnabled?: boolean };
  return body.state ?? null;
}

export async function bootstrapUserSession(): Promise<{
  onboardingCompleted: boolean;
  syncEnabled: boolean;
}> {
  const res = await fetch("/api/user/bootstrap", { credentials: "include", cache: "no-store" });
  if (!res.ok) return { onboardingCompleted: false, syncEnabled: false };
  const body = (await res.json()) as {
    onboardingCompleted?: boolean;
    syncEnabled?: boolean;
  };
  return {
    onboardingCompleted: body.onboardingCompleted === true,
    syncEnabled: body.syncEnabled === true,
  };
}

export async function markOnboardingCompletedRemote(): Promise<void> {
  await fetch("/api/user/profile", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboardingCompleted: true }),
  });
}
