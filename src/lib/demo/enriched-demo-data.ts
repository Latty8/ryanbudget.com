import type { AppAccount, AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import { DEMO_RECEIPT_PLACEHOLDER_URL } from "@/lib/receipts/demo-receipt-placeholder";

const demoReceipt = (id: string, fileName: string) => ({
  id,
  fileName,
  mimeType: "image/jpeg",
  sizeBytes: 240_000,
  previewUrl: DEMO_RECEIPT_PLACEHOLDER_URL,
  uploadedAt: "2026-05-26T12:00:00.000Z",
});

/** Realistic demo dataset: bi-weekly paychecks, monthly bills, weekly spending. */
export const enrichedAccounts: AppAccount[] = [
  { id: "acc-checking", name: "Main Checking", kind: "checking", balance: 2840.44, color: "#38bdf8", icon: "Wallet" },
  { id: "acc-savings", name: "High-Yield Savings", kind: "savings", balance: 9300, color: "#34d399", icon: "PiggyBank" },
  { id: "acc-credit", name: "Rewards Credit Card", kind: "credit", balance: -742.15, color: "#f472b6", icon: "CreditCard" },
];

export const enrichedCategories: AppCategory[] = [
  { id: "cat-income", name: "Income", group: "Income", icon: "Wallet", color: "#22c55e", budgeted: 0 },
  { id: "cat-housing", name: "Housing", group: "Needs", icon: "Home", color: "#38bdf8", budgeted: 1200 },
  { id: "cat-groceries", name: "Groceries", group: "Needs", icon: "ShoppingCart", color: "#34d399", budgeted: 300 },
  { id: "cat-transport", name: "Transportation", group: "Needs", icon: "Car", color: "#fbbf24", budgeted: 180 },
  { id: "cat-dining", name: "Dining", group: "Wants", icon: "Utensils", color: "#fb7185", budgeted: 120 },
  { id: "cat-entertainment", name: "Entertainment", group: "Wants", icon: "Music", color: "#a78bfa", budgeted: 60 },
  { id: "cat-utilities", name: "Utilities", group: "Needs", icon: "Zap", color: "#60a5fa", budgeted: 140 },
  { id: "cat-savings", name: "Savings", group: "Goals", icon: "PiggyBank", color: "#2dd4bf", budgeted: 250 },
];

export const enrichedTransactions: DemoTransaction[] = [
  {
    id: "t1",
    date: "2026-05-26",
    merchant: "Trader Joe's",
    category: "Groceries",
    account: "Main Checking",
    amount: -84.37,
    recurring: false,
    receipts: [demoReceipt("rc-t1", "trader-joes-0526.jpg")],
  },
  { id: "t2", date: "2026-05-25", merchant: "Payroll Deposit", category: "Income", account: "Main Checking", amount: 1825, recurring: true },
  {
    id: "t3",
    date: "2026-05-24",
    merchant: "Shell",
    category: "Transportation",
    account: "Rewards Credit Card",
    amount: -52.86,
    recurring: false,
    receipts: [demoReceipt("rc-t3", "shell-gas-0524.jpg")],
  },
  { id: "t4", date: "2026-05-22", merchant: "Spotify", category: "Entertainment", account: "Rewards Credit Card", amount: -11.99, recurring: true },
  { id: "t5", date: "2026-05-21", merchant: "Rent", category: "Housing", account: "Main Checking", amount: -1200, recurring: true },
  {
    id: "t6",
    date: "2026-05-19",
    merchant: "Chipotle",
    category: "Dining",
    account: "Rewards Credit Card",
    amount: -14.5,
    recurring: false,
    receipts: [demoReceipt("rc-t6", "chipotle-receipt.pdf"), demoReceipt("rc-t6b", "chipotle-itemized.pdf")],
  },
  { id: "t7", date: "2026-05-18", merchant: "Electric Co", category: "Utilities", account: "Main Checking", amount: -98.2, recurring: true },
  { id: "t8", date: "2026-05-11", merchant: "Payroll Deposit", category: "Income", account: "Main Checking", amount: 1825, recurring: true },
  { id: "t9", date: "2026-05-10", merchant: "Kroger", category: "Groceries", account: "Main Checking", amount: -129.96, recurring: false },
  { id: "t10", date: "2026-05-08", merchant: "Transfer to Savings", category: "Savings", account: "Main Checking", amount: -250, recurring: true },
];

export const enrichedRecurring = [
  { id: "r-payroll", name: "Payroll", amount: 1825, cadence: "bi-weekly" as const, nextDate: "2026-06-08" },
  { id: "r-rent", name: "Rent", amount: 1200, cadence: "monthly" as const, nextDate: "2026-06-01" },
  { id: "r-insurance", name: "Car Insurance", amount: 116, cadence: "monthly" as const, nextDate: "2026-06-03" },
  { id: "r-electric", name: "Electric", amount: 98, cadence: "monthly" as const, nextDate: "2026-06-12" },
  { id: "r-grocery", name: "Weekly Groceries", amount: 95, cadence: "weekly" as const, nextDate: "2026-05-30" },
];
