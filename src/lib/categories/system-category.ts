import { nanoid } from "nanoid";
import type { AppCategory } from "@/types/app-settings";

/** Label stored on transactions when no user category applies — not a visible budget row. */
export const SYSTEM_UNCATEGORIZED_NAME = "Uncategorized";
export const SYSTEM_UNCATEGORIZED_ID = "system-uncategorized";

/** Hidden system / legacy rows — never shown on Categories or synced as budget lines. */
export function isHiddenSystemCategory(category: Pick<AppCategory, "id" | "name">): boolean {
  return (
    category.id === SYSTEM_UNCATEGORIZED_ID ||
    category.name.trim().toLowerCase() === SYSTEM_UNCATEGORIZED_NAME.toLowerCase()
  );
}

/** @deprecated Use {@link isHiddenSystemCategory} */
export const isSystemCategory = isHiddenSystemCategory;

/** Strip hidden Uncategorized rows from persisted and synced category lists. */
export function sanitizeCategoryList(categories: AppCategory[]): AppCategory[] {
  return categories.filter((c) => !isHiddenSystemCategory(c));
}

/** Stable id for new user categories. */
export function newCategoryId(): string {
  return nanoid();
}
