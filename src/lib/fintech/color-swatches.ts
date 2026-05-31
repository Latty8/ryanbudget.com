/** Shared accent palette for wallets, categories, and goals. */
export const ENTITY_COLOR_SWATCHES = [
  "#38bdf8",
  "#34d399",
  "#22c55e",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#2dd4bf",
  "#60a5fa",
  "#f97316",
  "#e879f9",
] as const;

export type EntityColor = (typeof ENTITY_COLOR_SWATCHES)[number];
