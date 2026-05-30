import type { RemoteAppState } from "@/lib/supabase/sync/types";

function sortedIds(items: { id: string }[]) {
  return [...items].map((item) => item.id).sort().join(",");
}

/** Stable fingerprint for comparing local vs remote entity sets (not field-level merge). */
export function stateFingerprint(state: RemoteAppState): string {
  return [
    sortedIds(state.accounts),
    sortedIds(state.categories),
    sortedIds(state.transactions),
    sortedIds(state.recurring),
    sortedIds(state.goals),
    state.onboardingCompleted ? "1" : "0",
  ].join("|");
}

export function stateFingerprintsDiffer(a: RemoteAppState, b: RemoteAppState): boolean {
  return stateFingerprint(a) !== stateFingerprint(b);
}
