import type { TransactionInput, TransactionRecord } from "@/types/finance";

export function buildOptimisticTransaction(
  input: TransactionInput,
  accountName: string
): TransactionRecord {
  return {
    id: `pending-${Date.now()}`,
    amount: -Math.abs(input.amount),
    date: input.date,
    description: input.description,
    category: input.categoryId,
    account: accountName,
    tags: input.tags,
    recurring: input.recurring,
  };
}

export function rollbackTransactions(
  previous: TransactionRecord[] | undefined,
  setData: (rows: TransactionRecord[]) => void
): void {
  if (previous) setData(previous);
}
