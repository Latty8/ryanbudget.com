import type { AppAccount, AppCategory, SyncedAppPreferences } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import { signedAmountFromInput } from "@/lib/transactions/transaction-amount";
import { resolveCategoryForInput } from "@/lib/transactions/resolve-category";
import type { TransactionInput, TransactionRecord } from "@/types/finance";

export function transactionRecordToInput(
  row: TransactionRecord,
  accounts: AppAccount[],
  categories: AppCategory[]
): TransactionInput {
  const account = accounts.find((a) => a.name === row.account);
  const resolved = resolveCategoryForInput(row.category, categories);
  return {
    amount: Math.abs(row.amount),
    date: row.date,
    description: row.description,
    categoryId: resolved.categoryId,
    accountId: account?.id ?? accounts[0]?.id ?? "",
    kind: row.amount > 0 ? "income" : row.amount < 0 ? "expense" : undefined,
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
  preferences: SyncedAppPreferences,
  existing?: Pick<DemoTransaction, "amount">
): DemoTransaction {
  const account = accounts.find((a) => a.id === input.accountId || a.name === input.accountId);
  const resolved = resolveCategoryForInput(input.categoryId, categories);
  const normalizedInput: TransactionInput = {
    ...input,
    categoryId: resolved.categoryId,
  };
  const amount = signedAmountFromInput(normalizedInput, categories, existing?.amount);

  return {
    id,
    date: input.date,
    merchant: input.description,
    category: resolved.categoryName,
    account: account?.name ?? "Manual",
    amount,
    recurring: input.recurring,
    currency: input.currency ?? account?.currency ?? preferences.currency,
    receipts: input.receipts,
  };
}
