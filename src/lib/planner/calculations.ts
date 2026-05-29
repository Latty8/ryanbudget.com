import { addDays, isBefore, isWithinInterval } from "date-fns";
import type {
  AffordabilityResult,
  Bill,
  BudgetAllocation,
  Category,
  Debt,
  Goal,
  Paycheck,
  Transaction,
} from "@/lib/planner/types";

export function calculateRemaining(budgeted: number, spent: number): number {
  return budgeted - spent;
}

export function calculateLeftToAssign(income: number, totalBudgeted: number): number {
  return income - totalBudgeted;
}

export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function calculateDebtPayoff(debt: Debt): {
  months: number;
  payoffAmount: number;
  totalInterest: number;
} {
  const monthlyRate = debt.apr / 100 / 12;
  const payment = debt.minimumPayment + (debt.extraPayment ?? 0);
  if (payment <= 0 || debt.balance <= 0) {
    return { months: 0, payoffAmount: 0, totalInterest: 0 };
  }
  let balance = debt.balance;
  let months = 0;
  let totalPaid = 0;
  while (balance > 0 && months < 1200) {
    const interest = Math.round(balance * monthlyRate);
    balance += interest;
    const paid = Math.min(balance, payment);
    balance -= paid;
    totalPaid += paid;
    months += 1;
  }
  return {
    months,
    payoffAmount: totalPaid,
    totalInterest: Math.max(0, totalPaid - debt.balance),
  };
}

export function categoryBudgetForPaycheck(
  category: Category,
  paycheckIncome: number
): number {
  if (category.budgetType === "fixed" || category.budgetType === "manual") {
    return category.defaultAmount ?? 0;
  }
  return Math.round(paycheckIncome * ((category.defaultPercentage ?? 0) / 100));
}

export function computeAllocation(
  category: Category,
  allocation: BudgetAllocation | undefined,
  paycheckIncome: number
): BudgetAllocation {
  const budgetedAmount =
    allocation?.budgetedAmount ?? categoryBudgetForPaycheck(category, paycheckIncome);
  const spentAmount = allocation?.spentAmount ?? 0;
  return {
    id: allocation?.id ?? `${category.id}-draft`,
    paycheckId: allocation?.paycheckId ?? "",
    categoryId: category.id,
    budgetedAmount,
    spentAmount,
    remainingAmount: calculateRemaining(budgetedAmount, spentAmount),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function calculateSafeToSpend(opts: {
  actualIncome: number;
  upcomingBillsBeforeNextPaycheck: number;
  savingsContributions: number;
  debtMinimums: number;
  spentFlexible: number;
}): number {
  return (
    opts.actualIncome -
    opts.upcomingBillsBeforeNextPaycheck -
    opts.savingsContributions -
    opts.debtMinimums -
    opts.spentFlexible
  );
}

export function billsDueBeforeNextPaycheck(
  bills: Bill[],
  activePaycheck: Paycheck | undefined
): Bill[] {
  if (!activePaycheck) return [];
  const end = addDays(activePaycheck.payDate, 14);
  return bills.filter((b) => isBefore(b.dueDate, end) || +b.dueDate === +end);
}

export function transactionInPaycheckPeriod(
  tx: Transaction,
  paycheck: Paycheck | undefined
): boolean {
  if (!paycheck) return false;
  return isWithinInterval(tx.date, {
    start: paycheck.periodStart,
    end: paycheck.periodEnd,
  });
}

export function affordabilityDecision(opts: {
  purchaseAmount: number;
  categoryRemaining: number;
  safeToSpend: number;
}): AffordabilityResult {
  const afterCategory = opts.categoryRemaining - opts.purchaseAmount;
  const afterSafe = opts.safeToSpend - opts.purchaseAmount;
  if (afterCategory >= 0 && afterSafe >= 0) {
    return {
      status: "affordable",
      message: `You can afford this. You will have $${(afterCategory / 100).toFixed(2)} left in this category.`,
    };
  }
  if (afterCategory > -5000 && afterSafe > -5000) {
    return {
      status: "caution",
      message: "You can afford this, but it will leave your category low.",
    };
  }
  const overBy = Math.abs(Math.min(afterCategory, afterSafe));
  return {
    status: "not-recommended",
    message: `Not recommended. This would put you $${(overBy / 100).toFixed(2)} over budget.`,
  };
}

export function aggregateSaved(goals: Goal[]): number {
  return goals.reduce((sum, g) => sum + g.currentAmount, 0);
}
