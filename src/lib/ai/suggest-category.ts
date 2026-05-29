import { demoBudgets } from "@/lib/demo/sample-data";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Groceries: ["trader", "grocery", "costco", "walmart", "aldi", "kroger"],
  Dining: ["starbucks", "coffee", "restaurant", "dining", "mcdonald", "chipotle"],
  Transportation: ["shell", "chevron", "gas", "uber", "lyft", "parking"],
  Housing: ["rent", "mortgage", "landlord"],
  Income: ["payroll", "paycheck", "deposit"],
  Entertainment: ["netflix", "spotify", "hulu", "movie"],
};

/** Smart categorization from merchant/description keywords only (no external API). */
export function suggestCategoriesFromDescription(description: string, limit = 3): string[] {
  const value = description.toLowerCase();
  const scores = new Map<string, number>();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (value.includes(keyword)) {
        scores.set(category, (scores.get(category) ?? 0) + 1);
      }
    }
  }

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  if (ranked.length > 0) return ranked.slice(0, limit);
  return demoBudgets.slice(0, limit).map((b) => b.category);
}
