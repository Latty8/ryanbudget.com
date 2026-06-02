import type { AppCategory } from "@/types/app-settings";
import type { CategoryKind } from "@/lib/categories/category-kind";
import { isIncomeCategory } from "@/lib/categories/category-kind";
import { isPaycheckIncome } from "@/lib/paycheck/is-paycheck-income";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { TransactionInput } from "@/types/finance";

/** Signed store convention: income > 0, expenses < 0. */
export function isIncomeTransactionAmount(amount: number): boolean {
  return amount > 0;
}

export function isExpenseTransactionAmount(amount: number): boolean {
  return amount < 0;
}

function findCategory(
  input: Pick<TransactionInput, "categoryId">,
  categories: AppCategory[]
): AppCategory | undefined {
  return categories.find((c) => c.id === input.categoryId || c.name === input.categoryId);
}

/**
 * Whether a transaction should be stored/displayed as income (positive amount).
 */
export function resolveTransactionIsIncome(
  input: Pick<TransactionInput, "categoryId" | "description" | "kind">,
  categories: AppCategory[],
  existingSignedAmount?: number
): boolean {
  if (input.kind === "income") return true;
  if (input.kind === "expense") return false;

  const category = findCategory(input, categories);
  if (category) return isIncomeCategory(category);

  if (isPaycheckIncome(input, categories)) return true;

  if (existingSignedAmount != null) {
    if (existingSignedAmount > 0) return true;
    if (existingSignedAmount < 0) return false;
  }

  return false;
}

export function signedAmountFromInput(
  input: Pick<TransactionInput, "amount" | "categoryId" | "description" | "kind">,
  categories: AppCategory[],
  existingSignedAmount?: number
): number {
  const magnitude = Math.abs(input.amount);
  const isIncome = resolveTransactionIsIncome(input, categories, existingSignedAmount);
  return isIncome ? magnitude : -magnitude;
}

/** Repair persisted rows saved with the wrong sign (e.g. Paycheck stored as expense). */
export function normalizeDemoTransactionAmount(
  tx: DemoTransaction,
  categories: AppCategory[]
): DemoTransaction {
  const category = categories.find((c) => c.name === tx.category);
  const input: TransactionInput = {
    amount: Math.abs(tx.amount),
    date: tx.date,
    description: tx.merchant,
    categoryId: category?.id ?? tx.category,
    accountId: "",
    tags: [],
    recurring: tx.recurring,
  };

  const shouldBeIncome = resolveTransactionIsIncome(input, categories, tx.amount);
  const magnitude = Math.abs(tx.amount);
  const next = shouldBeIncome ? magnitude : -magnitude;
  if (next === tx.amount) return tx;
  return { ...tx, amount: next };
}

export function transactionAmountTone(amount: number): "income" | "expense" | "zero" {
  if (amount > 0) return "income";
  if (amount < 0) return "expense";
  return "zero";
}

/** Tailwind classes for signed transaction amounts. */
export function transactionAmountClassName(amount: number): string {
  const tone = transactionAmountTone(amount);
  if (tone === "income") return "text-[var(--positive)]";
  if (tone === "expense") return "text-rose-500 dark:text-rose-400";
  return "text-[var(--foreground)]";
}

export function formatSignedAmountPrefix(amount: number): string {
  if (amount > 0) return "+";
  if (amount < 0) return "−";
  return "";
}

export function formatSignedTransactionAmount(
  amount: number,
  formatAbs: (magnitude: number) => string
): string {
  const prefix = formatSignedAmountPrefix(amount);
  const body = formatAbs(Math.abs(amount));
  return prefix ? `${prefix}${body}` : body;
}

export function inferKindFromCategory(
  category: Pick<AppCategory, "name" | "group"> | undefined
): CategoryKind | undefined {
  if (!category) return undefined;
  return isIncomeCategory(category) ? "income" : "expense";
}
