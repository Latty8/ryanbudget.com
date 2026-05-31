"use client";

import { hasCloudDataSync } from "@/lib/db/client";
import { applyOnboardingFromServer } from "@/lib/auth/complete-sign-in-client";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import {
  applyRemoteStateToStore,
  buildLocalRemoteState,
  isApplyingRemoteSync,
  mergeRemoteWithLocal,
  shouldPreferRemote,
  stateFingerprintsDiffer,
} from "@/lib/supabase/sync/apply-sync";
import {
  getLastAppliedRemoteRevision,
  hasUnsyncedLocalChanges,
  markLocalSyncClean,
  markPushInFlight,
  markRemoteRevisionApplied,
} from "@/lib/supabase/sync/sync-dirty";
import type { RemoteAppState } from "@/lib/supabase/sync/types";

const POLL_INTERVAL_MS = 3_000;
const PUSH_DEBOUNCE_MS = 300;

let pullTimer: ReturnType<typeof setTimeout> | null = null;
let pullInFlight = false;
let watchSource: EventSource | null = null;

export type PullOptions = {
  force?: boolean;
};

export type CloudPullPayload = {
  state: RemoteAppState | null;
  revision?: string | null;
};

export async function pullAndApplyCloudState(options?: PullOptions): Promise<boolean> {
  if (pullInFlight || isApplyingRemoteSync()) return false;

  pullInFlight = true;
  try {
    const payload = await pullCloudState();
    if (!payload?.state) return false;

    const { state: remote, revision } = payload;
    if (revision && revision === getLastAppliedRemoteRevision() && !options?.force) {
      return false;
    }

    const local = buildLocalRemoteState();
    const differs = stateFingerprintsDiffer(local, remote);
    if (!differs && !options?.force) {
      markRemoteRevisionApplied(revision);
      return false;
    }

    const unsynced = hasUnsyncedLocalChanges();
    if (unsynced && !options?.force) {
      if (!shouldPreferRemote(local, remote) && !revision) return false;
      const merged = mergeRemoteWithLocal(local, remote);
      applyRemoteStateToStore(merged);
      markRemoteRevisionApplied(revision);
      if (merged.onboardingCompleted) await applyOnboardingFromServer(true);
      return true;
    }

    if (!shouldPreferRemote(local, remote) && !options?.force) return false;

    applyRemoteStateToStore(remote);
    markLocalSyncClean(remote);
    markRemoteRevisionApplied(revision);
    if (remote.onboardingCompleted) await applyOnboardingFromServer(true);
    return true;
  } finally {
    pullInFlight = false;
  }
}

function schedulePull(delayMs = 150) {
  if (pullTimer) clearTimeout(pullTimer);
  pullTimer = setTimeout(() => {
    pullTimer = null;
    void pullAndApplyCloudState();
  }, delayMs);
}

export async function forceSyncNow(): Promise<{ ok: boolean; message: string }> {
  if (!hasCloudDataSync) {
    return { ok: false, message: "Cloud sync is not enabled." };
  }

  const local = buildLocalRemoteState();
  markPushInFlight(true);
  const pushed = await pushLocalStateToCloud(local);
  markPushInFlight(false);
  if (!pushed) {
    return { ok: false, message: "Could not upload your changes." };
  }
  markLocalSyncClean(local);

  await pullAndApplyCloudState({ force: true });
  return { ok: true, message: "Up to date." };
}

/** Silent background sync — SSE revision watch + polling fallback. */
export function subscribeToCloudChanges(userId: string): () => void {
  if (!hasCloudDataSync) return () => {};

  void pullAndApplyCloudState();

  if (typeof EventSource !== "undefined") {
    watchSource?.close();
    watchSource = new EventSource("/api/sync/watch", { withCredentials: true });
    watchSource.onmessage = () => schedulePull(50);
    watchSource.onerror = () => {
      watchSource?.close();
      watchSource = null;
    };
  }

  const pollTimer = setInterval(() => {
    if (document.visibilityState !== "visible") return;
    void pullAndApplyCloudState();
  }, POLL_INTERVAL_MS);

  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    schedulePull(50);
  };

  document.addEventListener("visibilitychange", onVisible);

  return () => {
    if (pullTimer) {
      clearTimeout(pullTimer);
      pullTimer = null;
    }
    clearInterval(pollTimer);
    document.removeEventListener("visibilitychange", onVisible);
    watchSource?.close();
    watchSource = null;
  };
}

export async function pushLocalStateToCloud(state: RemoteAppState): Promise<boolean> {
  markPushInFlight(true);
  try {
    const res = await fetch("/api/sync/push", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) return false;
    const body = await parseJsonResponse<{ ok?: boolean; synced?: boolean; revision?: string }>(res);
    if (body?.revision) markRemoteRevisionApplied(body.revision);
    return body?.ok === true && body.synced !== false;
  } finally {
    markPushInFlight(false);
  }
}

export async function pullCloudState(): Promise<CloudPullPayload | null> {
  const res = await fetch("/api/sync/pull", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const body = await parseJsonResponse<{
    state?: RemoteAppState | null;
    revision?: string | null;
    syncEnabled?: boolean;
  }>(res);
  if (!body) return null;
  return { state: body.state ?? null, revision: body.revision ?? null };
}

export async function bootstrapUserSession(): Promise<{
  onboardingCompleted: boolean;
  syncEnabled: boolean;
}> {
  const res = await fetch("/api/user/bootstrap", { credentials: "include", cache: "no-store" });
  if (!res.ok) return { onboardingCompleted: false, syncEnabled: false };
  const body = await parseJsonResponse<{
    onboardingCompleted?: boolean;
    syncEnabled?: boolean;
  }>(res);
  if (!body) return { onboardingCompleted: false, syncEnabled: false };
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

export { PUSH_DEBOUNCE_MS };
