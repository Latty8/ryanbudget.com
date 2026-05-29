import type { StateStorage } from "zustand/middleware";

/** Reduces main-thread jank from rapid Zustand persist writes. */
export function createDebouncedStorage(delayMs = 400): StateStorage {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      timers.set(
        name,
        setTimeout(() => {
          timers.delete(name);
          localStorage.setItem(name, value);
        }, delayMs)
      );
    },
    removeItem: (name) => {
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      timers.delete(name);
      localStorage.removeItem(name);
    },
  };
}
