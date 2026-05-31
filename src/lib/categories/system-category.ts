import { nanoid } from "nanoid";
import type { AppCategory } from "@/types/app-settings";

export const SYSTEM_UNCATEGORIZED_NAME = "Uncategorized";
export const SYSTEM_UNCATEGORIZED_ID = "system-uncategorized";

export function isSystemCategory(category: Pick<AppCategory, "id" | "name">): boolean {
  return (
    category.id === SYSTEM_UNCATEGORIZED_ID ||
    category.name === SYSTEM_UNCATEGORIZED_NAME
  );
}

export function createSystemUncategorizedCategory(): AppCategory {
  return {
    id: SYSTEM_UNCATEGORIZED_ID,
    name: SYSTEM_UNCATEGORIZED_NAME,
    group: "Miscellaneous",
    icon: "CircleDollarSign",
    color: "#64748b",
    budgeted: 0,
  };
}

/** Ensure the protected Uncategorized bucket exists (no duplicates). */
export function ensureSystemCategories(categories: AppCategory[]): AppCategory[] {
  const existing = categories.find((c) => c.name === SYSTEM_UNCATEGORIZED_NAME);
  if (existing) {
    if (existing.id === SYSTEM_UNCATEGORIZED_ID) return categories;
    return categories.map((c) =>
      c.name === SYSTEM_UNCATEGORIZED_NAME ? { ...c, id: SYSTEM_UNCATEGORIZED_ID } : c
    );
  }
  return [...categories, createSystemUncategorizedCategory()];
}

export function uncategorizedCategoryForReassignment(categories: AppCategory[]): AppCategory {
  const existing = categories.find((c) => c.name === SYSTEM_UNCATEGORIZED_NAME);
  if (existing) return existing;
  return createSystemUncategorizedCategory();
}

/** Stable id for new user categories (system rows use a fixed id). */
export function newCategoryId(): string {
  return nanoid();
}
