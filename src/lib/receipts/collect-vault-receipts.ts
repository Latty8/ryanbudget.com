import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { TransactionReceipt } from "@/types/receipts";

export type VaultReceipt = TransactionReceipt & {
  transactionId: string;
  merchant: string;
  category: string;
  transactionDate: string;
  amount: number;
  account: string;
};

export function collectVaultReceipts(transactions: DemoTransaction[]): VaultReceipt[] {
  const out: VaultReceipt[] = [];
  for (const tx of transactions) {
    if (!tx.receipts?.length) continue;
    for (const receipt of tx.receipts) {
      out.push({
        ...receipt,
        transactionId: tx.id,
        merchant: tx.merchant,
        category: tx.category,
        transactionDate: tx.date,
        amount: tx.amount,
        account: tx.account,
      });
    }
  }
  return out.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
}
