"use client";

import { isClientCloudSyncEnabled, setClientCloudSyncEnabled } from "@/lib/db/client";
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
  getSyncConflictContext,
  hasUnsyncedLocalChanges,
  markLocalSyncClean,
  markPushInFlight,
  markRemoteRevisionApplied,
} from "@/lib/supabase/sync/sync-dirty";
import type { RemoteAppState } from "@/lib/supabase/sync/types";

const POLL_INTERVAL_MS = 5_000;
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

    const conflictCtx = {
      ...getSyncConflictContext(),
      remoteRevision: revision,
    };

    const unsynced = hasUnsyncedLocalChanges();
    const hasNewRevision = Boolean(revision && revision !== getLastAppliedRemoteRevision());
    if (unsynced && !options?.force) {
      if (shouldPreferRemote(local, remote, conflictCtx)) {
        applyRemoteStateToStore(remote);
        markLocalSyncClean(remote);
        markRemoteRevisionApplied(revision);
        if (remote.onboardingCompleted) await applyOnboardingFromServer(true);
        return true;
      }
      if (!revision) return false;
      const merged = mergeRemoteWithLocal(local, remote, {
        preferRemoteOnConflict: hasNewRevision,
        omitLocalOnlyNotOnRemote: false,
      });
      applyRemoteStateToStore(merged);
      markLocalSyncClean(merged);
      markRemoteRevisionApplied(revision);
      if (merged.onboardingCompleted) await applyOnboardingFromServer(true);
      return true;
    }

    if (!shouldPreferRemote(local, remote, conflictCtx) && !options?.force) return false;

    applyRemoteStateToStore(remote);
    markLocalSyncClean(remote);
    markRemoteRevisionApplied(revision);
    if (remote.onboardingCompleted) await applyOnboardingFromServer(true);
    return true;
  } finally {
    pullInFlight = false;
  }
}

function schedulePull(delayMs = 150, force = false) {
  if (pullTimer) clearTimeout(pullTimer);
  pullTimer = setTimeout(() => {
    pullTimer = null;
    void pullAndApplyCloudState(force ? { force: true } : undefined);
  }, delayMs);
}

export async function forceSyncNow(): Promise<{ ok: boolean; message: string }> {
  if (!isClientCloudSyncEnabled()) {
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
  if (!isClientCloudSyncEnabled()) return () => {};

  void pullAndApplyCloudState();

  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connectWatch = () => {
    if (typeof EventSource === "undefined") return;
    watchSource?.close();
    watchSource = new EventSource("/api/sync/watch", { withCredentials: true });
    watchSource.onopen = () => {
      reconnectAttempt = 0;
    };
    watchSource.onmessage = () => schedulePull(50, true);
    watchSource.onerror = () => {
      watchSource?.close();
      watchSource = null;
      const delay = Math.min(30_000, 1000 * 2 ** reconnectAttempt);
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(connectWatch, delay);
    };
  };

  connectWatch();

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
    if (reconnectTimer) clearTimeout(reconnectTimer);
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
  if (body.syncEnabled === true) setClientCloudSyncEnabled(true);
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

/** Push immediately (skip debounce) — use after deletes so other devices get updates quickly. */
export async function pushLocalStateNow(): Promise<boolean> {
  if (!isClientCloudSyncEnabled()) return false;
  const payload = buildLocalRemoteState();
  markPushInFlight(true);
  const ok = await pushLocalStateToCloud(payload);
  markPushInFlight(false);
  if (ok) {
    markLocalSyncClean(payload);
    void pullAndApplyCloudState();
  }
  return ok;
}

/** Push immediately (e.g. before tab close). Best-effort with keepalive. */
export function flushPendingCloudPush(): void {
  if (!isClientCloudSyncEnabled()) return;
  const payload = buildLocalRemoteState();
  if (!hasUnsyncedLocalChanges()) return;
  markPushInFlight(true);
  void fetch("/api/sync/push", {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: payload }),
  })
    .then((res) => {
      if (res.ok) markLocalSyncClean(payload);
    })
    .finally(() => markPushInFlight(false));
}
