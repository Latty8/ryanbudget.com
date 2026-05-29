export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Paycheck {
  id: string;
  userId: string;
  name: string;
  payDate: Date;
  periodStart: Date;
  periodEnd: Date;
  expectedIncome: number;
  actualIncome: number;
  status: "planned" | "active" | "completed";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  group: string;
  color: string;
  icon?: string;
  budgetType: "fixed" | "percentage" | "manual";
  defaultAmount?: number;
  defaultPercentage?: number;
  rollover: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAllocation {
  id: string;
  paycheckId: string;
  categoryId: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  rolloverAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  paycheckId: string;
  categoryId?: string;
  date: Date;
  description: string;
  amount: number;
  type: "expense" | "income" | "transfer";
  account?: string;
  notes?: string;
  recurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  frequency: "weekly" | "biweekly" | "monthly" | "yearly";
  categoryId?: string;
  autopay: boolean;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  contributionPerPaycheck?: number;
  linkedCategoryId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
  extraPayment?: number;
  dueDate?: Date;
  linkedBillId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffordabilityResult {
  status: "affordable" | "caution" | "not-recommended";
  message: string;
}
