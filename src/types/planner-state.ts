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

export interface PlannerState {
  user: User;
  payFrequency: "weekly" | "biweekly" | "semi-monthly" | "monthly";
  defaultPaycheckAmount: number;
  currency: "USD" | "CAD" | "EUR" | "GBP";
  darkMode: boolean;
  activePaycheckId: string;
  categoryGroups: string[];
  accounts: string[];
  paychecks: Paycheck[];
  categories: Category[];
  allocations: BudgetAllocation[];
  transactions: Transaction[];
  bills: Bill[];
  goals: Goal[];
  debts: Debt[];
}
