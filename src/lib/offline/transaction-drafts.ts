import type { TransactionInput } from "@/types/finance";

const STORAGE_KEY = "pp-offline-transaction-drafts";

export type OfflineTransactionDraft = TransactionInput & {
  id: string;
  savedAt: string;
};

export function loadOfflineDrafts(): OfflineTransactionDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineTransactionDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineDraft(input: TransactionInput): OfflineTransactionDraft {
  const draft: OfflineTransactionDraft = {
    ...input,
    id: `draft-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  const existing = loadOfflineDrafts();
  existing.unshift(draft);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
  return draft;
}

export function removeOfflineDraft(id: string): void {
  const next = loadOfflineDrafts().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearOfflineDrafts(): void {
  localStorage.removeItem(STORAGE_KEY);
}
