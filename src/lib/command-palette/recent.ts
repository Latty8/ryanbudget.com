const STORAGE_KEY = "planner-palette-recent";
const MAX = 5;

export type RecentPaletteEntry = {
  id: string;
  title: string;
  href?: string;
  action?: "new-transaction" | "export-data";
  ts: number;
};

export function loadRecentPalette(): RecentPaletteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPaletteEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function recordPaletteSelection(entry: Omit<RecentPaletteEntry, "ts">) {
  if (typeof window === "undefined") return;
  try {
    const prev = loadRecentPalette().filter((e) => e.id !== entry.id);
    const next: RecentPaletteEntry[] = [{ ...entry, ts: Date.now() }, ...prev].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
