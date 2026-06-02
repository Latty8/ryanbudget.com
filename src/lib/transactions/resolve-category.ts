import type { AppAccount, AppCategory } from "@/types/app-settings";
import type { TransactionInput } from "@/types/finance";

export type ResolvedCategoryRef = {
  /** Canonical app category id (nanoid) when known */
  categoryId: string;
  /** Name stored on transactions and synced to the database */
  categoryName: string;
};

const UNCATEGORIZED = "Uncategorized";

function findCategory(categories: AppCategory[], raw: string): AppCategory | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const byId = categories.find((c) => c.id === trimmed);
  if (byId) return byId;
  const lower = trimmed.toLowerCase();
  return categories.find((c) => c.name.trim().toLowerCase() === lower);
}

/**
 * Resolve categoryId from form state (may be id or legacy name) to a stable id + display name.
 */
export function resolveCategoryForInput(
  categoryId: string | undefined,
  categories: AppCategory[]
): ResolvedCategoryRef {
  const raw = (categoryId ?? "").trim();
  if (!raw) {
    return { categoryId: "", categoryName: UNCATEGORIZED };
  }

  const match = findCategory(categories, raw);
  if (match) {
    return { categoryId: match.id, categoryName: match.name };
  }

  // Unknown label (custom NLP category) — keep name for display/sync
  return { categoryId: raw, categoryName: raw };
}

/** Pick the best category id for a new transaction default. */
export function defaultCategoryId(categories: AppCategory[]): string {
  const first = categories.find((c) => c.name !== UNCATEGORIZED);
  return first?.id ?? categories[0]?.id ?? "";
}

export function categoryNameForStore(
  categoryId: string | undefined,
  categories: AppCategory[]
): string {
  return resolveCategoryForInput(categoryId, categories).categoryName;
}

export function resolveAccountForInput(
  accountId: string | undefined,
  accounts: AppAccount[]
): { accountId: string; accountName: string } {
  const raw = (accountId ?? "").trim();
  const match = accounts.find((a) => a.id === raw || a.name === raw);
  if (match) return { accountId: match.id, accountName: match.name };
  return { accountId: raw, accountName: raw || "Manual" };
}

/** Normalize form payload before save/sync. */
export function normalizeTransactionInput(
  input: TransactionInput,
  categories: AppCategory[],
  accounts: AppAccount[]
): TransactionInput {
  const category = resolveCategoryForInput(input.categoryId, categories);
  const account = resolveAccountForInput(input.accountId, accounts);
  return {
    ...input,
    categoryId: category.categoryId,
    accountId: account.accountId,
  };
}
