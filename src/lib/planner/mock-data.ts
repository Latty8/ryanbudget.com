import { addDays } from "date-fns";
import type {
  Bill,
  BudgetAllocation,
  Category,
  Debt,
  Goal,
  Paycheck,
  Transaction,
  User,
} from "@/lib/planner/types";
import { CATEGORY_GROUPS } from "@/lib/planner/constants";
import { toCents } from "@/lib/planner/format";

const now = new Date();

export const demoUser: User = {
  id: "user-1",
  name: "Demo User",
  email: "demo@example.com",
  createdAt: now,
  updatedAt: now,
};

export const demoPaychecks: Paycheck[] = [
  {
    id: "pay-1",
    userId: "user-1",
    name: "May 28 Paycheck",
    payDate: new Date("2026-05-28"),
    periodStart: new Date("2026-05-28"),
    periodEnd: new Date("2026-06-13"),
    expectedIncome: toCents(1425),
    actualIncome: toCents(1487),
    status: "active",
    notes: "Main paycheck",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pay-2",
    userId: "user-1",
    name: "June 12 Paycheck",
    payDate: new Date("2026-06-12"),
    periodStart: new Date("2026-06-12"),
    periodEnd: new Date("2026-06-27"),
    expectedIncome: toCents(1425),
    actualIncome: toCents(0),
    status: "planned",
    createdAt: now,
    updatedAt: now,
  },
];

const c = (id: string, name: string, group: string, color: string, budgetType: Category["budgetType"], amount?: number, pct?: number): Category => ({
  id,
  userId: "user-1",
  name,
  group,
  color,
  budgetType,
  defaultAmount: amount ? toCents(amount) : undefined,
  defaultPercentage: pct,
  rollover: true,
  active: true,
  createdAt: now,
  updatedAt: now,
});

export const demoCategories: Category[] = [
  c("cat-rent", "Rent", "Housing", "#0EA5E9", "fixed", 825),
  c("cat-electric", "Electric", "Housing", "#38BDF8", "manual", 75),
  c("cat-internet", "Internet", "Housing", "#7DD3FC", "fixed", 50),
  c("cat-groceries", "Groceries", "Food", "#22C55E", "manual", 200),
  c("cat-gas", "Gas", "Transportation", "#3B82F6", "manual", 60),
  c("cat-car", "Car Payment", "Transportation", "#6366F1", "fixed", 250),
  c("cat-subs", "Subscriptions", "Subscriptions", "#F59E0B", "fixed", 35),
  c("cat-fun", "Fun", "Entertainment", "#F97316", "manual", 75),
  c("cat-personal", "Personal", "Personal", "#A855F7", "manual", 100),
  c("cat-emergency", "Emergency Fund", "Savings", "#14B8A6", "percentage", undefined, 10),
  c("cat-travel", "Travel", "Savings", "#06B6D4", "percentage", undefined, 5),
  c("cat-pet", "Pet", "Pets", "#EF4444", "manual", 50),
];

export const demoAllocations: BudgetAllocation[] = demoCategories.map((cat, i) => ({
  id: `alloc-${i + 1}`,
  paycheckId: "pay-1",
  categoryId: cat.id,
  budgetedAmount: cat.defaultAmount ?? 0,
  spentAmount: i % 3 === 0 ? toCents(22) : i % 2 === 0 ? toCents(48) : 0,
  remainingAmount: 0,
  createdAt: now,
  updatedAt: now,
}));

export const demoBills: Bill[] = [
  { id: "bill-rent", userId: "user-1", name: "Rent", amount: toCents(1650), dueDate: new Date("2026-06-01"), frequency: "monthly", autopay: true, active: true, createdAt: now, updatedAt: now },
  { id: "bill-internet", userId: "user-1", name: "Internet", amount: toCents(50), dueDate: new Date("2026-06-03"), frequency: "monthly", autopay: true, active: true, createdAt: now, updatedAt: now },
  { id: "bill-electric", userId: "user-1", name: "Electric", amount: toCents(90), dueDate: new Date("2026-06-06"), frequency: "monthly", autopay: false, active: true, createdAt: now, updatedAt: now },
  { id: "bill-car", userId: "user-1", name: "Car Payment", amount: toCents(491.6), dueDate: new Date("2026-06-08"), frequency: "monthly", autopay: true, active: true, createdAt: now, updatedAt: now },
  { id: "bill-pet", userId: "user-1", name: "Pet Rent", amount: toCents(30), dueDate: new Date("2026-06-10"), frequency: "monthly", autopay: true, active: true, createdAt: now, updatedAt: now },
];

export const demoGoals: Goal[] = [
  { id: "goal-1", userId: "user-1", name: "Emergency Fund", targetAmount: toCents(1500), currentAmount: toCents(850), createdAt: now, updatedAt: now },
  { id: "goal-2", userId: "user-1", name: "Travel", targetAmount: toCents(1000), currentAmount: toCents(325), createdAt: now, updatedAt: now },
  { id: "goal-3", userId: "user-1", name: "Car Maintenance", targetAmount: toCents(500), currentAmount: toCents(120), createdAt: now, updatedAt: now },
];

export const demoDebts: Debt[] = [
  {
    id: "debt-1",
    userId: "user-1",
    name: "Car Loan",
    balance: toCents(13109.85),
    apr: 6.14,
    minimumPayment: toCents(491.6),
    extraPayment: toCents(100),
    dueDate: addDays(now, 8),
    createdAt: now,
    updatedAt: now,
  },
];

const tx = (
  id: string,
  desc: string,
  amount: number,
  categoryId: string,
  daysAgo: number
): Transaction => ({
  id,
  userId: "user-1",
  paycheckId: "pay-1",
  categoryId,
  date: addDays(now, -daysAgo),
  description: desc,
  amount: toCents(amount),
  type: "expense",
  account: "Checking",
  recurring: false,
  createdAt: now,
  updatedAt: now,
});

export const demoTransactions: Transaction[] = [
  tx("tx-1", "Trader Joe's", 56.42, "cat-groceries", 1),
  tx("tx-2", "Shell Gas", 42.11, "cat-gas", 2),
  tx("tx-3", "Rent Transfer", 825, "cat-rent", 3),
  tx("tx-4", "Spotify", 11.99, "cat-subs", 4),
  tx("tx-5", "Coffee Shop", 9.5, "cat-fun", 1),
  tx("tx-6", "Pet Food", 33.42, "cat-pet", 2),
  tx("tx-7", "Electric Utility", 72.24, "cat-electric", 5),
  tx("tx-8", "Internet Bill", 50, "cat-internet", 5),
  tx("tx-9", "Gas Station", 18.45, "cat-gas", 4),
  tx("tx-10", "Target", 44.99, "cat-personal", 3),
  tx("tx-11", "Costco", 81.25, "cat-groceries", 6),
  tx("tx-12", "Movie Night", 27.1, "cat-fun", 7),
  tx("tx-13", "Emergency Fund Transfer", 140, "cat-emergency", 2),
  tx("tx-14", "Travel Savings", 72, "cat-travel", 2),
  tx("tx-15", "Car Payment", 250, "cat-car", 6),
];

export const demoAccounts = ["Checking", "Credit Card", "Cash", "Apple Pay"];
export const demoCategoryGroups = [...CATEGORY_GROUPS];
