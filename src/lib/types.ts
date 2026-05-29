export type PeriodType = "weekly" | "biweekly" | "monthly";

export type TransactionType = "income" | "expense";

/** Use for income transactions vs expense transactions (picker + filters). */
export type CategoryKind = TransactionType;

export interface Category {
  id: string;
  name: string;
  color: string;
  /** Whether this category appears for income or expense lines in the ledger. */
  kind: CategoryKind;
  /** null = top-level group or standalone category; set for sub-categories. */
  parentId: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  description: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  /** Plaid transaction_id — used to dedupe bank imports */
  externalId?: string;
  /** Linked account id from Accounts (see LinkedBankAccount) */
  accountId?: string | null;
}

/** Re-exported shape for client ↔ API (defined in plaid/types). */
export type { LinkedBankAccount } from "@/lib/plaid/types";

export interface Debt {
  id: string;
  name: string;
  currentBalance: number;
  monthlyPayment: number;
  /** If set, payoff progress is shown against this starting balance */
  originalBalance?: number;
  notes?: string;
}

/** Savings goal / vault — money set aside outside envelope activity. */
export interface SavingsVault {
  id: string;
  name: string;
  balance: number;
  /** Optional goal for progress display */
  targetAmount?: number;
  /** Optional goal date (ISO yyyy-mm-dd) */
  targetDate?: string;
  notes?: string;
}

export interface BudgetSettings {
  periodType: PeriodType;
  /** 0 = Sunday, 1 = Monday */
  weekStartsOn: 0 | 1;
  /** First day of a biweekly cycle (ISO yyyy-mm-dd). Used only when periodType is biweekly. */
  biweeklyAnchor: string;
  /**
   * Bi-weekly → two 7-day blocks; monthly → 1st–15 vs 16–end.
   * Lets you assign / view activity per paycheck-style slice while totals roll into one period.
   */
  splitBudgetPeriodHalves: boolean;
}
