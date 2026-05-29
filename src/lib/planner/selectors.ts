import { startOfMonth } from "date-fns";
import {
  aggregateSaved,
  billsDueBeforeNextPaycheck,
  calculateLeftToAssign,
  calculateSafeToSpend,
  categoryBudgetForPaycheck,
  computeAllocation,
  transactionInPaycheckPeriod,
} from "@/lib/planner/calculations";
import type { PlannerState } from "@/types/planner-state";
import type { BudgetAllocation, Category, Paycheck, Transaction } from "@/lib/planner/types";

export function activePaycheck(state: PlannerState): Paycheck | undefined {
  return state.paychecks.find((p) => p.id === state.activePaycheckId) ?? state.paychecks[0];
}

export function allocationMapForPaycheck(
  allocations: BudgetAllocation[],
  paycheckId: string
): Record<string, BudgetAllocation> {
  const map: Record<string, BudgetAllocation> = {};
  for (const a of allocations) {
    if (a.paycheckId === paycheckId) map[a.categoryId] = a;
  }
  return map;
}

export function applyTransactionSpending(
  categories: Category[],
  allocations: Record<string, BudgetAllocation>,
  transactions: Transaction[],
  paycheck: Paycheck
): Record<string, BudgetAllocation> {
  const next = { ...allocations };
  for (const c of categories) {
    const base = next[c.id] ?? computeAllocation(c, undefined, paycheck.actualIncome);
    const spent = transactions
      .filter((t) => t.type === "expense" && t.categoryId === c.id)
      .reduce((sum, t) => sum + t.amount, 0);
    next[c.id] = {
      ...base,
      spentAmount: spent,
      remainingAmount: base.budgetedAmount - spent,
    };
  }
  return next;
}

export function plannerSummary(state: PlannerState) {
  const paycheck = activePaycheck(state);
  if (!paycheck) return null;
  const inPeriod = state.transactions.filter((t) =>
    transactionInPaycheckPeriod(t, paycheck)
  );
  const map = applyTransactionSpending(
    state.categories.filter((c) => c.active),
    allocationMapForPaycheck(state.allocations, paycheck.id),
    inPeriod,
    paycheck
  );
  const allocations = Object.values(map);
  const budgeted = allocations.reduce((sum, a) => sum + a.budgetedAmount, 0);
  const spent = allocations.reduce((sum, a) => sum + a.spentAmount, 0);
  const remaining = allocations.reduce((sum, a) => sum + a.remainingAmount, 0);
  const leftToAssign = calculateLeftToAssign(paycheck.actualIncome, budgeted);
  const upcoming = billsDueBeforeNextPaycheck(state.bills.filter((b) => b.active), paycheck);
  const upcomingBillsAmount = upcoming.reduce((sum, b) => sum + b.amount, 0);
  const savingsContrib = state.categories
    .filter((c) => c.group === "Savings")
    .reduce((sum, c) => sum + (map[c.id]?.budgetedAmount ?? categoryBudgetForPaycheck(c, paycheck.actualIncome)), 0);
  const debtMinimums = state.debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const spentFlexible = allocations
    .filter((a) => {
      const cat = state.categories.find((c) => c.id === a.categoryId);
      return cat?.group !== "Savings" && cat?.group !== "Debt";
    })
    .reduce((sum, a) => sum + a.spentAmount, 0);
  const safeToSpend = calculateSafeToSpend({
    actualIncome: paycheck.actualIncome,
    upcomingBillsBeforeNextPaycheck: upcomingBillsAmount,
    savingsContributions: savingsContrib,
    debtMinimums,
    spentFlexible,
  });
  const totalSaved = aggregateSaved(state.goals);

  const monthStart = startOfMonth(new Date());
  const monthlyTransactions = state.transactions.filter((t) => t.date >= monthStart);
  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    paycheck,
    allocations,
    inPeriod,
    budgeted,
    spent,
    remaining,
    leftToAssign,
    safeToSpend,
    upcoming,
    totalSaved,
    monthlyIncome,
    monthlyExpense,
  };
}
