import type { AppCategory } from "@/types/app-settings";

export type CategoryKind = "income" | "expense";

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  income: "Income",
  expense: "Expenses",
};

/** Expense subgroups — stored in `group` for non-income categories. */
export const EXPENSE_SUBGROUPS = [
  "Housing",
  "Utilities",
  "Food",
  "Transportation",
  "Subscriptions",
  "Entertainment",
  "Shopping",
  "Personal",
  "Health",
  "Pets",
  "Savings",
  "Travel",
  "Debt",
  "Miscellaneous",
  "Needs",
  "Wants",
  "Goals",
  "Custom",
] as const;

const INCOME_NAMES = new Set(
  [
    "income",
    "paycheck",
    "paychecks",
    "salary",
    "wages",
    "bonus",
    "refund",
    "refunds",
    "side income",
    "side hustle",
    "freelance",
    "other income",
  ].map((s) => s.toLowerCase())
);

export function isIncomeCategory(category: Pick<AppCategory, "name" | "group">): boolean {
  if (category.group === "Income") return true;
  return INCOME_NAMES.has(category.name.trim().toLowerCase());
}

export function getCategoryKind(category: Pick<AppCategory, "name" | "group">): CategoryKind {
  return isIncomeCategory(category) ? "income" : "expense";
}

export function expenseSubgroupsForSelect(existingGroups: string[] = []): string[] {
  const merged = new Set<string>([...EXPENSE_SUBGROUPS, ...existingGroups.filter((g) => g !== "Income")]);
  return [...merged].sort((a, b) => {
    const ai = EXPENSE_SUBGROUPS.indexOf(a as (typeof EXPENSE_SUBGROUPS)[number]);
    const bi = EXPENSE_SUBGROUPS.indexOf(b as (typeof EXPENSE_SUBGROUPS)[number]);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
}

export function groupForKind(kind: CategoryKind, subgroup: string): string {
  if (kind === "income") return "Income";
  return subgroup === "Income" ? "Miscellaneous" : subgroup || "Miscellaneous";
}

export function subgroupForCategory(category: Pick<AppCategory, "name" | "group">): string {
  if (isIncomeCategory(category)) return "Income";
  return category.group || "Miscellaneous";
}

export function partitionCategoriesByKind<T extends Pick<AppCategory, "name" | "group">>(
  categories: T[]
): { income: T[]; expense: T[] } {
  const income: T[] = [];
  const expense: T[] = [];
  for (const cat of categories) {
    if (isIncomeCategory(cat)) income.push(cat);
    else expense.push(cat);
  }
  return { income, expense };
}
