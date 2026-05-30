import type { AppAccount, AppCategory, AppGoal } from "@/types/app-settings";
import type { RecurringFrequency } from "@/types/finance";
import { addDays, format } from "date-fns";

export const SUGGESTED_ACCOUNTS: Omit<AppAccount, "id">[] = [
  { name: "Main Checking", kind: "checking", balance: 0, color: "#38bdf8", icon: "Wallet" },
  { name: "High-Yield Savings", kind: "savings", balance: 0, color: "#34d399", icon: "PiggyBank" },
  { name: "Rewards Credit Card", kind: "credit", balance: 0, color: "#f472b6", icon: "CreditCard" },
  { name: "Cash", kind: "cash", balance: 0, color: "#fbbf24", icon: "Banknote", hidden: true },
  { name: "Brokerage", kind: "investment", balance: 0, color: "#a78bfa", icon: "TrendingUp", hidden: true },
];

export const SUGGESTED_CATEGORIES: Omit<AppCategory, "id">[] = [
  { name: "Income", group: "Income", icon: "CircleDollarSign", color: "#22c55e", budgeted: 0, budgetBehavior: "fixed" },
  { name: "Housing", group: "Housing", icon: "Home", color: "#38bdf8", budgeted: 1200, budgetBehavior: "fixed" },
  { name: "Utilities", group: "Utilities", icon: "Zap", color: "#60a5fa", budgeted: 140, budgetBehavior: "fixed" },
  { name: "Groceries", group: "Food", icon: "ShoppingCart", color: "#34d399", budgeted: 300, budgetBehavior: "flexible" },
  { name: "Transportation", group: "Transportation", icon: "Car", color: "#fbbf24", budgeted: 180, budgetBehavior: "flexible" },
  { name: "Dining", group: "Food", icon: "Utensils", color: "#fb7185", budgeted: 120, budgetBehavior: "flexible" },
];

export type RecurringTemplate = {
  id: string;
  name: string;
  amount: number;
  cadence: RecurringFrequency;
  enabled: boolean;
  description: string;
};

export function buildRecurringTemplates(paycheckAmount: number, _paycheckDate: string): RecurringTemplate[] {
  const templates: RecurringTemplate[] = [
    {
      id: "payroll",
      name: "Payroll",
      amount: paycheckAmount,
      cadence: "bi-weekly",
      enabled: true,
      description: "Bi-weekly paycheck",
    },
    {
      id: "rent",
      name: "Rent",
      amount: 1200,
      cadence: "monthly",
      enabled: true,
      description: "Monthly housing",
    },
    {
      id: "utilities",
      name: "Utilities",
      amount: 98,
      cadence: "monthly",
      enabled: true,
      description: "Electric, gas, internet",
    },
    {
      id: "groceries",
      name: "Weekly Groceries",
      amount: 95,
      cadence: "weekly",
      enabled: true,
      description: "Average weekly grocery run",
    },
    {
      id: "insurance",
      name: "Car Insurance",
      amount: 116,
      cadence: "monthly",
      enabled: false,
      description: "Optional monthly bill",
    },
  ];
  return templates.map((t) =>
    t.id === "payroll" ? { ...t, amount: paycheckAmount } : t
  );
}

export const SUGGESTED_GOALS: Omit<AppGoal, "id" | "current">[] = [
  {
    name: "Emergency Fund",
    target: 8000,
    targetDate: format(addDays(new Date(), 180), "yyyy-MM-dd"),
    icon: "Shield",
    color: "#22c55e",
  },
  {
    name: "Vacation",
    target: 1800,
    targetDate: format(addDays(new Date(), 120), "yyyy-MM-dd"),
    icon: "Plane",
    color: "#38bdf8",
  },
];

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Your paycheck",
  "Main bills",
  "You're set",
] as const;
