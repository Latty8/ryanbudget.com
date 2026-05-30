import type { StateStorage } from "zustand/middleware";
import { createDebouncedStorage } from "@/lib/storage/debounced-storage";

const PERSIST_BASE = "app-data";

let activeUserId: string = "guest";

export function setPersistUserId(userId: string | null | undefined) {
  activeUserId = userId?.trim() || "guest";
}

export function getPersistUserId() {
  return activeUserId;
}

function fullKey(name: string) {
  return `paycheck-planner-${activeUserId}-${name}`;
}

function createUserKeyedStorage(delayMs: number): StateStorage {
  const inner = createDebouncedStorage(delayMs);
  return {
    getItem: (name) => inner.getItem(fullKey(name)),
    setItem: (name, value) => inner.setItem(fullKey(name), value),
    removeItem: (name) => inner.removeItem(fullKey(name)),
  };
}

export const userPersistStorage = createUserKeyedStorage(400);
export const PERSIST_STORE_NAME = PERSIST_BASE;
