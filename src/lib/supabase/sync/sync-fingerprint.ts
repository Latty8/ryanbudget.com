import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { toSyncedPreferences } from "@/lib/preferences/sync-preferences";

function sortedIds(items: { id: string }[]) {
  return [...items]
    .map((item) => item.id)
    .sort()
    .join(",");
}

function entityPayload(items: { id: string }[]) {
  return [...items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => JSON.stringify(item))
    .join(";");
}

/** Stable fingerprint including entity content (not just ids). */
export function stateFingerprint(state: RemoteAppState): string {
  return [
    entityPayload(state.accounts),
    entityPayload(state.categories),
    entityPayload(state.transactions),
    entityPayload(state.recurring),
    entityPayload(state.goals),
    JSON.stringify(toSyncedPreferences(state.preferences)),
    JSON.stringify(state.profile),
    state.onboardingCompleted ? "1" : "0",
  ].join("|");
}

export function stateFingerprintsDiffer(a: RemoteAppState, b: RemoteAppState): boolean {
  return stateFingerprint(a) !== stateFingerprint(b);
}

/** Legacy id-only fingerprint for entity count guards. */
export function stateIdFingerprint(state: RemoteAppState): string {
  return [
    sortedIds(state.accounts),
    sortedIds(state.categories),
    sortedIds(state.transactions),
    sortedIds(state.recurring),
    sortedIds(state.goals),
  ].join("|");
}
