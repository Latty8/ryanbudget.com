import type { CurrencyCode } from "@/types/app-settings";
import type { TransactionReceipt } from "@/types/receipts";

export type DemoTransaction = {
  id: string;
  date: string;
  merchant: string;
  category: string;
  account: string;
  amount: number;
  recurring: boolean;
  currency?: CurrencyCode;
  receipts?: TransactionReceipt[];
};

export const demoAccounts = [
  { id: "acc-checking", name: "Main Checking", balance: 2840.44 },
  { id: "acc-savings", name: "High-Yield Savings", balance: 9300.0 },
  { id: "acc-credit", name: "Rewards Credit Card", balance: -742.15 },
];

export const demoTransactions: DemoTransaction[] = [
  { id: "t1", date: "2026-05-26", merchant: "Trader Joe's", category: "Groceries", account: "Main Checking", amount: -84.37, recurring: false },
  { id: "t2", date: "2026-05-25", merchant: "Payroll Deposit", category: "Income", account: "Main Checking", amount: 1825.0, recurring: true },
  { id: "t3", date: "2026-05-24", merchant: "Shell", category: "Transportation", account: "Rewards Credit Card", amount: -52.86, recurring: false },
  { id: "t4", date: "2026-05-22", merchant: "Spotify", category: "Entertainment", account: "Rewards Credit Card", amount: -11.99, recurring: true },
  { id: "t5", date: "2026-05-21", merchant: "Rent", category: "Housing", account: "Main Checking", amount: -1200.0, recurring: true },
];

export const demoBudgets = [
  { category: "Housing", budgeted: 1200, spent: 1200 },
  { category: "Groceries", budgeted: 300, spent: 214.33 },
  { category: "Transportation", budgeted: 180, spent: 94.21 },
  { category: "Dining", budgeted: 120, spent: 59.04 },
  { category: "Entertainment", budgeted: 60, spent: 11.99 },
];

export const demoRecurring = [
  { id: "r1", name: "Rent", amount: 1200, cadence: "monthly", nextDate: "2026-06-01" },
  { id: "r2", name: "Car Insurance", amount: 116, cadence: "monthly", nextDate: "2026-06-03" },
  { id: "r3", name: "Payroll", amount: 1825, cadence: "bi-weekly", nextDate: "2026-06-08" },
];

export const demoGoals = [
  { id: "g1", name: "Emergency Fund", current: 4200, target: 8000, kind: "sinking" as const },
  { id: "g2", name: "Summer Trip", current: 950, target: 1800, kind: "sinking" as const },
  {
    id: "g3",
    name: "Car Loan",
    kind: "debt" as const,
    current: 12400,
    target: 18000,
    monthlyPayment: 425,
    interestRateApy: 5.9,
  },
];
