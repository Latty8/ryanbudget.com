import { describe, expect, it } from "vitest";
import type { AppCategory } from "@/types/app-settings";
import { resolveCategoryForInput } from "@/lib/transactions/resolve-category";

const categories: AppCategory[] = [
  {
    id: "cat-paycheck",
    name: "Paycheck",
    group: "Income",
    icon: "Wallet",
    color: "#22c55e",
    budgeted: 0,
  },
  {
    id: "cat-groceries",
    name: "Groceries",
    group: "Food",
    icon: "ShoppingCart",
    color: "#34d399",
    budgeted: 300,
  },
];

describe("resolveCategoryForInput", () => {
  it("resolves by category id", () => {
    expect(resolveCategoryForInput("cat-groceries", categories)).toEqual({
      categoryId: "cat-groceries",
      categoryName: "Groceries",
    });
  });

  it("resolves legacy name stored in categoryId field", () => {
    expect(resolveCategoryForInput("Paycheck", categories)).toEqual({
      categoryId: "cat-paycheck",
      categoryName: "Paycheck",
    });
  });

  it("falls back to Uncategorized when empty", () => {
    expect(resolveCategoryForInput("", categories).categoryName).toBe("Uncategorized");
  });
});
