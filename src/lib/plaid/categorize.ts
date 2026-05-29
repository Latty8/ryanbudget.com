import type { Category } from "@/lib/types";
import { isAssignableCategory } from "@/lib/categories";

const PLAID_PRIMARY_TO_KEYWORDS: Record<string, string[]> = {
  INCOME: ["salary", "income"],
  FOOD_AND_DRINK: ["food", "groceries"],
  RENT_AND_UTILITIES: ["housing", "utilities", "rent"],
  TRANSPORTATION: ["transport"],
  ENTERTAINMENT: ["entertainment"],
  MEDICAL: ["health"],
  LOAN_PAYMENTS: ["debt"],
  GENERAL_MERCHANDISE: ["other"],
  PERSONAL_CARE: ["health"],
  TRAVEL: ["transport", "entertainment"],
  HOME_IMPROVEMENT: ["housing"],
  GAS_STATIONS: ["transport"],
  GROCERIES: ["food"],
};

function scoreCategory(
  categories: Category[],
  category: Category,
  description: string,
  keywords: string[]
): number {
  if (!isAssignableCategory(categories, category)) return -1;
  const desc = description.toLowerCase();
  const name = category.name.toLowerCase();
  let score = 0;
  if (desc.includes(name)) score += 10;
  for (const kw of keywords) {
    if (name.includes(kw) || category.id.includes(kw.replace(/\s/g, "-"))) {
      score += 3;
    }
  }
  return score;
}

export function suggestCategoryId(
  categories: Category[],
  type: "income" | "expense",
  description: string,
  plaidPrimary: string | null
): string | null {
  const pool = categories.filter(
    (c) => c.kind === type && isAssignableCategory(categories, c)
  );
  if (pool.length === 0) return null;

  const keywords = plaidPrimary
    ? (PLAID_PRIMARY_TO_KEYWORDS[plaidPrimary] ?? [])
    : [];

  let best: { id: string; score: number } | null = null;
  for (const c of pool) {
    const s = scoreCategory(categories, c, description, keywords);
    if (s <= 0) continue;
    if (!best || s > best.score) best = { id: c.id, score: s };
  }

  if (best && best.score >= 3) return best.id;

  if (type === "income") {
    const salary = pool.find((c) => c.id === "cat-salary");
    if (salary) return salary.id;
  }

  const other = pool.find((c) => c.id === "cat-other");
  return other?.id ?? null;
}
