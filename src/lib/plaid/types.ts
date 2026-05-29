import type { TransactionType } from "@/lib/types";

export interface LinkedBankAccount {
  /** Internal id (itemId + plaid account id) */
  id: string;
  itemId: string;
  plaidAccountId: string;
  name: string;
  officialName: string | null;
  mask: string | null;
  type: string;
  subtype: string | null;
  institutionName: string | null;
  currentBalance: number | null;
}

export interface PlaidImportTransaction {
  externalId: string;
  plaidAccountId: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  plaidCategoryPrimary: string | null;
  /** Filled during sync from your category list */
  suggestedCategoryId?: string | null;
}

export interface PlaidSyncResult {
  accounts: LinkedBankAccount[];
  imported: PlaidImportTransaction[];
  removedExternalIds: string[];
}
