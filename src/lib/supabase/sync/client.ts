"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { applyOnboardingFromServer } from "@/lib/auth/complete-sign-in-client";
import {
  applyRemoteStateToStore,
  buildLocalRemoteState,
  isApplyingRemoteSync,
  shouldPreferRemote,
} from "@/lib/supabase/sync/apply-sync";
import { hasUnsyncedLocalChanges } from "@/lib/supabase/sync/sync-dirty";
import type { RemoteAppState } from "@/lib/supabase/sync/types";

const REALTIME_TABLES = [
  "accounts",
  "categories",
  "transactions",
  "recurring_rules",
  "goals",
  "profiles",
] as const;

let pullTimer: ReturnType<typeof setTimeout> | null = null;
let pullInFlight = false;

export async function pullAndApplyCloudState(): Promise<boolean> {
  if (pullInFlight || isApplyingRemoteSync()) return false;
  if (hasUnsyncedLocalChanges()) return false;

  pullInFlight = true;
  try {
    const remote = await pullCloudState();
    if (!remote) return false;

    const local = buildLocalRemoteState();
    if (!shouldPreferRemote(local, remote)) return false;

    applyRemoteStateToStore(remote);
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

/** Single Realtime channel for all user tables — faster reconnect and instant pull on subscribe. */
export function subscribeToCloudChanges(userId: string): () => void {
  if (!hasSupabaseDataSync) return () => {};

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};

  const channel: RealtimeChannel = supabase.channel(`sync-all-${userId}`);

  for (const table of REALTIME_TABLES) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: table === "profiles" ? `id=eq.${userId}` : `profile_id=eq.${userId}`,
      },
      () => schedulePull(150)
    );
  }

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void pullAndApplyCloudState();
    }
  });

  return () => {
    if (pullTimer) {
      clearTimeout(pullTimer);
      pullTimer = null;
    }
    void supabase.removeChannel(channel);
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
  const body = (await res.json()) as { ok?: boolean };
  return body.ok === true;
}

export async function pullCloudState(): Promise<RemoteAppState | null> {
  const res = await fetch("/api/sync/pull", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { state?: RemoteAppState | null };
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
