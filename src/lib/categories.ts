import type { Category, CategoryKind } from "@/lib/types";

export function categoryChildren(
  categories: Category[],
  parentId: string
): Category[] {
  return categories.filter((c) => c.parentId === parentId);
}

export function categoryHasChildren(
  categories: Category[],
  id: string
): boolean {
  return categories.some((c) => c.parentId === id);
}

/** Sub-categories, or top-level categories with no children (legacy flat rows). */
export function isAssignableCategory(
  categories: Category[],
  c: Category
): boolean {
  if (c.parentId != null) return true;
  return !categoryHasChildren(categories, c.id);
}

/** Ids used for budget envelopes and RTA assignment math. */
export function budgetCategoryIds(categories: Category[]): string[] {
  return categories
    .filter((c) => isAssignableCategory(categories, c))
    .map((c) => c.id);
}

export function categoryFullName(
  categories: Category[],
  id: string
): string {
  const c = categories.find((x) => x.id === id);
  if (!c) return "";
  if (c.parentId) {
    const parent = categories.find((x) => x.id === c.parentId);
    return parent ? `${parent.name} › ${c.name}` : c.name;
  }
  return c.name;
}

export function topLevelCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.parentId == null);
}

export type CategoryTreeRow =
  | { type: "group"; category: Category }
  | { type: "item"; category: Category; indent: boolean };

/** Ordered rows for budget / dashboard lists (respects flat array order). */
export function buildCategoryTreeRows(categories: Category[]): CategoryTreeRow[] {
  const rows: CategoryTreeRow[] = [];
  for (const c of topLevelCategories(categories)) {
    const kids = categoryChildren(categories, c.id);
    if (kids.length > 0) {
      rows.push({ type: "group", category: c });
      for (const child of kids) {
        rows.push({ type: "item", category: child, indent: true });
      }
    } else {
      rows.push({ type: "item", category: c, indent: false });
    }
  }
  return rows;
}

export interface CategorySelectGroup {
  parent: Category;
  children: Category[];
}

/** Options for transaction / filter selects (assignable only). */
export function categoriesForSelect(
  categories: Category[],
  kind: CategoryKind
): { groups: CategorySelectGroup[]; standalone: Category[] } {
  const filtered = categories.filter((c) => c.kind === kind);
  const groups: CategorySelectGroup[] = [];
  const standalone: Category[] = [];

  for (const parent of topLevelCategories(filtered)) {
    const kids = categoryChildren(filtered, parent.id).filter((c) =>
      isAssignableCategory(filtered, c)
    );
    if (kids.length > 0) {
      groups.push({ parent, children: kids });
    } else if (isAssignableCategory(filtered, parent)) {
      standalone.push(parent);
    }
  }

  return { groups, standalone };
}

/** Sum numeric map across child category ids under a parent group. */
export function sumChildValues(
  categories: Category[],
  parentId: string,
  byCat: Record<string, number>
): number {
  return categoryChildren(categories, parentId).reduce(
    (s, c) => s + (byCat[c.id] ?? 0),
    0
  );
}

/** Top-level categories that can be chosen as a parent when creating a sub. */
export function parentGroupOptions(
  categories: Category[],
  kind: CategoryKind,
  editingId: string | null
): Category[] {
  return topLevelCategories(categories).filter((c) => {
    if (c.id === editingId) return false;
    if (c.kind !== kind) return false;
    return true;
  });
}

/** Flat list: each top-level group followed by its subs (array order within subs). */
export function flattenCategoryTree(
  categories: Category[],
  topOrder?: Category[]
): Category[] {
  const tops = topOrder ?? topLevelCategories(categories);
  const out: Category[] = [];
  for (const top of tops) {
    const topCat = categories.find((c) => c.id === top.id);
    if (!topCat) continue;
    out.push(topCat);
    for (const c of categories) {
      if (c.parentId === top.id) out.push(c);
    }
  }
  return out;
}

/** Filter ledger rows by category id, parent group id, or uncategorized. */
export function transactionMatchesCategoryFilter(
  categoryId: string | null,
  scope: "all" | "uncategorized" | string,
  categories: Category[]
): boolean {
  if (scope === "all") return true;
  if (scope === "uncategorized") return categoryId == null;
  if (categoryHasChildren(categories, scope)) {
    const childIds = new Set(
      categoryChildren(categories, scope).map((c) => c.id)
    );
    return categoryId != null && childIds.has(categoryId);
  }
  return categoryId === scope;
}

export function moveTopLevelGroup(
  categories: Category[],
  topLevelId: string,
  direction: "up" | "down"
): Category[] {
  const tops = topLevelCategories(categories);
  const idx = tops.findIndex((c) => c.id === topLevelId);
  if (idx < 0) return categories;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= tops.length) return categories;
  const nextTops = [...tops];
  [nextTops[idx], nextTops[swapIdx]] = [nextTops[swapIdx], nextTops[idx]];
  return flattenCategoryTree(categories, nextTops);
}
