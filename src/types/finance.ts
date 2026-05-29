import type { CurrencyCode } from "@/types/app-settings";
import type { TransactionReceipt } from "@/types/receipts";

export type AccountKind = "checking" | "savings" | "credit" | "cash" | "investment";
export type RecurringFrequency = "weekly" | "bi-weekly" | "monthly" | "yearly";

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
};

export type BudgetCategory = {
  id: string;
  name: string;
  group: string;
  budgeted: number;
  spent: number;
  rolloverEnabled: boolean;
};

export type PaycheckProjection = {
  id: string;
  date: string;
  amount: number;
  status: "expected" | "posted";
};

export type BillProjection = {
  id: string;
  name: string;
  date: string;
  amount: number;
  frequency: RecurringFrequency;
};

export type CashflowPoint = {
  month: string;
  income: number;
  expenses: number;
  projectedBalance: number;
};

export type DashboardInsight = {
  id: string;
  tone: "positive" | "warning" | "neutral";
  title: string;
  body: string;
};

export type DashboardSummary = {
  totalBalance: number;
  incomeThisMonth: number;
  expensesThisMonth: number;
  projectedEndOfMonthBalance: number;
  moneyLeftToSpend: number;
  daysUntilNextPaycheck: number | null;
  daysUntilBroke: number | null;
  billsBeforeNextPaycheck: number;
  categoryProgress: BudgetCategory[];
  cashflow: CashflowPoint[];
  upcomingPaychecks: PaycheckProjection[];
  upcomingBills: BillProjection[];
  insights: DashboardInsight[];
};

export type TransactionTag = "needs" | "wants" | "business" | "health" | "family";

export type SplitLine = {
  id: string;
  categoryId: string;
  amount: number;
  note?: string;
};

export type TransactionInput = {
  amount: number;
  date: string;
  description: string;
  categoryId: string;
  accountId: string;
  currency?: CurrencyCode;
  tags: TransactionTag[];
  recurring: boolean;
  recurringFrequency?: RecurringFrequency;
  splits?: SplitLine[];
  receipts?: TransactionReceipt[];
};

export type TransactionRecord = {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  account: string;
  currency?: CurrencyCode;
  tags: TransactionTag[];
  recurring: boolean;
  receipts?: TransactionReceipt[];
};
