import type { AppAccount, AppCategory, AppPreferences } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { TransactionInput, TransactionRecord } from "@/types/finance";

export function transactionRecordToInput(
  row: TransactionRecord,
  accounts: AppAccount[],
  categories: AppCategory[]
): TransactionInput {
  const account = accounts.find((a) => a.name === row.account);
  const category = categories.find((c) => c.name === row.category);
  return {
    amount: Math.abs(row.amount),
    date: row.date,
    description: row.description,
    categoryId: category?.id ?? row.category,
    accountId: account?.id ?? accounts[0]?.id ?? "",
    currency: row.currency,
    tags: row.tags ?? [],
    recurring: row.recurring,
    receipts: row.receipts,
  };
}

export function transactionInputToStoreRow(
  input: TransactionInput,
  id: string,
  accounts: AppAccount[],
  categories: AppCategory[],
  preferences: AppPreferences,
  existing?: Pick<DemoTransaction, "amount" | "currency">
): DemoTransaction {
  const account = accounts.find((a) => a.id === input.accountId);
  const category = categories.find((c) => c.id === input.categoryId || c.name === input.categoryId);
  const isIncome =
    category?.name === "Income" || (existing?.amount != null && existing.amount > 0);
  const amount = isIncome ? Math.abs(input.amount) : -Math.abs(input.amount);

  return {
    id,
    date: input.date,
    merchant: input.description,
    category: category?.name ?? input.categoryId,
    account: account?.name ?? "Manual",
    amount,
    recurring: input.recurring,
    currency: input.currency ?? account?.currency ?? preferences.currency,
    receipts: input.receipts,
  };
}
