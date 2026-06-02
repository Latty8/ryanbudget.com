import { describe, expect, it } from "vitest";
import type { AppCategory } from "@/types/app-settings";
import {
  normalizeDemoTransactionAmount,
  resolveTransactionIsIncome,
  signedAmountFromInput,
} from "@/lib/transactions/transaction-amount";
import type { TransactionInput } from "@/types/finance";

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
    color: "#38bdf8",
    budgeted: 300,
  },
];

const baseInput = (overrides: Partial<TransactionInput> = {}): TransactionInput => ({
  amount: 1850,
  date: "2026-05-28",
  description: "Bi-weekly payroll",
  categoryId: "cat-paycheck",
  accountId: "acc-1",
  tags: [],
  recurring: false,
  ...overrides,
});

describe("resolveTransactionIsIncome", () => {
  it("treats Paycheck category as income", () => {
    expect(resolveTransactionIsIncome(baseInput(), categories)).toBe(true);
  });

  it("treats expense categories as expenses", () => {
    expect(resolveTransactionIsIncome(baseInput({ categoryId: "cat-groceries" }), categories)).toBe(
      false
    );
  });

  it("respects explicit kind override", () => {
    expect(
      resolveTransactionIsIncome(
        baseInput({ categoryId: "cat-groceries", kind: "income" }),
        categories
      )
    ).toBe(true);
  });

  it("detects paycheck from description when category is ambiguous", () => {
    expect(
      resolveTransactionIsIncome(
        baseInput({ categoryId: "unknown", description: "Paycheck deposit" }),
        categories
      )
    ).toBe(true);
  });
});

describe("signedAmountFromInput", () => {
  it("stores paycheck as positive", () => {
    expect(signedAmountFromInput(baseInput(), categories)).toBe(1850);
  });

  it("stores groceries as negative", () => {
    expect(signedAmountFromInput(baseInput({ categoryId: "cat-groceries", amount: 42 }), categories)).toBe(
      -42
    );
  });
});

describe("normalizeDemoTransactionAmount", () => {
  it("flips mis-signed paycheck rows on load", () => {
    const fixed = normalizeDemoTransactionAmount(
      {
        id: "t-bad",
        date: "2026-05-28",
        merchant: "Payroll",
        category: "Paycheck",
        account: "Checking",
        amount: -1850,
        recurring: false,
      },
      categories
    );
    expect(fixed.amount).toBe(1850);
  });
});
