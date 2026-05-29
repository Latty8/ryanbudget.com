import type { TransactionType } from "@/lib/types";
import type { PlaidImportTransaction } from "@/lib/plaid/types";

/** Plaid amount: positive = outflow, negative = inflow (depository). */
export function plaidAmountToTypeAndValue(amount: number): {
  type: TransactionType;
  amount: number;
} {
  if (amount < 0) {
    return { type: "income", amount: Math.abs(amount) };
  }
  return { type: "expense", amount: Math.abs(amount) };
}

export function plaidTransactionToImport(tx: {
  transaction_id: string;
  account_id: string;
  amount: number;
  name: string;
  merchant_name?: string | null;
  date: string;
  pending?: boolean | null;
  personal_finance_category?: { primary?: string | null } | null;
}): PlaidImportTransaction {
  const { type, amount } = plaidAmountToTypeAndValue(tx.amount);
  const description =
    tx.merchant_name?.trim() ||
    tx.name?.trim() ||
    "Bank transaction";

  return {
    externalId: tx.transaction_id,
    plaidAccountId: tx.account_id,
    amount,
    type,
    description: tx.pending ? `${description} (pending)` : description,
    date: tx.date,
    plaidCategoryPrimary: tx.personal_finance_category?.primary ?? null,
  };
}
