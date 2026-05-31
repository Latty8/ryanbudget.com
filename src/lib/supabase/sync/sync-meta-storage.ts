import { getPersistUserId } from "@/lib/storage/user-persist";

const META_SUFFIX = "sync-meta";

export type PersistedSyncMeta = {
  lastSyncedFingerprint: string;
  lastAppliedRevision: string;
  lastSyncedEntityCount: number;
  updatedAt: string;
};

export type SyncConflictContext = {
  remoteRevision?: string | null;
  lastSyncedFingerprint?: string;
  lastAppliedRevision?: string;
};

function metaKey(userId?: string) {
  const id = userId ?? getPersistUserId();
  return `paycheck-planner-${id}-${META_SUFFIX}`;
}

export function loadPersistedSyncMeta(userId?: string): PersistedSyncMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(metaKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSyncMeta;
    if (!parsed.lastSyncedFingerprint) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedSyncMeta(meta: PersistedSyncMeta, userId?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(metaKey(userId), JSON.stringify(meta));
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedSyncMeta(userId?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(metaKey(userId));
  } catch {
    /* ignore */
  }
}
