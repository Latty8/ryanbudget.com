"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoAccounts,
  demoAllocations,
  demoBills,
  demoCategories,
  demoCategoryGroups,
  demoDebts,
  demoGoals,
  demoPaychecks,
  demoTransactions,
  demoUser,
} from "@/lib/planner/mock-data";
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

type PersistedPlannerData = {
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
};

type PlannerState = PersistedPlannerData & {
  setDarkMode: (value: boolean) => void;
  setPayFrequency: (value: PersistedPlannerData["payFrequency"]) => void;
  setCurrency: (value: PersistedPlannerData["currency"]) => void;
  setActivePaycheck: (id: string) => void;
  addPaycheck: (p: Omit<Paycheck, "id" | "createdAt" | "updatedAt">) => void;
  updatePaycheck: (id: string, patch: Partial<Paycheck>) => void;
  deletePaycheck: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, "id" | "createdAt" | "updatedAt">) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  setAllocationBudgeted: (paycheckId: string, categoryId: string, amount: number) => void;
  addBill: (bill: Omit<Bill, "id" | "createdAt" | "updatedAt">) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "updatedAt">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addDebt: (debt: Omit<Debt, "id" | "createdAt" | "updatedAt">) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  resetDemoData: () => void;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; message: string };
};

function createInitialData(): PersistedPlannerData {
  return {
    user: demoUser,
    payFrequency: "biweekly",
    defaultPaycheckAmount: 142500,
    currency: "USD",
    darkMode: false,
    activePaycheckId: demoPaychecks[0].id,
    categoryGroups: demoCategoryGroups,
    accounts: demoAccounts,
    paychecks: demoPaychecks,
    categories: demoCategories,
    allocations: demoAllocations,
    transactions: demoTransactions,
    bills: demoBills,
    goals: demoGoals,
    debts: demoDebts,
  };
}

const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Ignore storage errors to avoid app crashes
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore storage errors to avoid app crashes
    }
  },
};

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function reviveDates(data: PersistedPlannerData): PersistedPlannerData {
  return {
    ...data,
    user: {
      ...data.user,
      createdAt: toDate(data.user.createdAt),
      updatedAt: toDate(data.user.updatedAt),
    },
    paychecks: data.paychecks.map((p) => ({
      ...p,
      payDate: toDate(p.payDate),
      periodStart: toDate(p.periodStart),
      periodEnd: toDate(p.periodEnd),
      createdAt: toDate(p.createdAt),
      updatedAt: toDate(p.updatedAt),
    })),
    categories: data.categories.map((c) => ({
      ...c,
      createdAt: toDate(c.createdAt),
      updatedAt: toDate(c.updatedAt),
    })),
    allocations: data.allocations.map((a) => ({
      ...a,
      createdAt: toDate(a.createdAt),
      updatedAt: toDate(a.updatedAt),
    })),
    transactions: data.transactions.map((t) => ({
      ...t,
      date: toDate(t.date),
      createdAt: toDate(t.createdAt),
      updatedAt: toDate(t.updatedAt),
    })),
    bills: data.bills.map((b) => ({
      ...b,
      dueDate: toDate(b.dueDate),
      createdAt: toDate(b.createdAt),
      updatedAt: toDate(b.updatedAt),
    })),
    goals: data.goals.map((g) => ({
      ...g,
      targetDate: g.targetDate ? toDate(g.targetDate) : undefined,
      createdAt: toDate(g.createdAt),
      updatedAt: toDate(g.updatedAt),
    })),
    debts: data.debts.map((d) => ({
      ...d,
      dueDate: d.dueDate ? toDate(d.dueDate) : undefined,
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    })),
  };
}

function isPersistedData(value: unknown): value is PersistedPlannerData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.paychecks) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.allocations) &&
    Array.isArray(v.transactions) &&
    Array.isArray(v.bills) &&
    Array.isArray(v.goals) &&
    Array.isArray(v.debts)
  );
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      ...createInitialData(),
      setDarkMode: (value) => set({ darkMode: value }),
      setPayFrequency: (value) => set({ payFrequency: value }),
      setCurrency: (value) => set({ currency: value }),
      setActivePaycheck: (id) => set({ activePaycheckId: id }),
      addPaycheck: (p) =>
        set((s) => ({
          paychecks: [
            ...s.paychecks,
            { ...p, id: nanoid(), createdAt: new Date(), updatedAt: new Date() },
          ],
        })),
      updatePaycheck: (id, patch) =>
        set((s) => ({
          paychecks: s.paychecks.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date() } : p
          ),
        })),
      deletePaycheck: (id) =>
        set((s) => {
          const nextPaychecks = s.paychecks.filter((p) => p.id !== id);
          const nextActiveId = s.activePaycheckId === id ? (nextPaychecks[0]?.id ?? "") : s.activePaycheckId;
          return {
            activePaycheckId: nextActiveId,
            paychecks: nextPaychecks,
            allocations: s.allocations.filter((a) => a.paycheckId !== id),
            transactions: s.transactions.filter((t) => t.paycheckId !== id),
          };
        }),
      addTransaction: (t) =>
        set((s) => ({
          transactions: [
            ...s.transactions,
            { ...t, id: nanoid(), createdAt: new Date(), updatedAt: new Date() },
          ],
        })),
      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date() } : t
          ),
        })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addCategory: (c) =>
        set((s) => ({
          categories: [
            ...s.categories,
            { ...c, id: nanoid(), createdAt: new Date(), updatedAt: new Date() },
          ],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date() } : c
          ),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          allocations: s.allocations.filter((a) => a.categoryId !== id),
          transactions: s.transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: undefined } : t)),
          bills: s.bills.map((b) => (b.categoryId === id ? { ...b, categoryId: undefined } : b)),
          goals: s.goals.map((g) => (g.linkedCategoryId === id ? { ...g, linkedCategoryId: undefined } : g)),
        })),
      setAllocationBudgeted: (paycheckId, categoryId, amount) =>
        set((s) => {
          const existing = s.allocations.find(
            (a) => a.paycheckId === paycheckId && a.categoryId === categoryId
          );
          if (existing) {
            return {
              allocations: s.allocations.map((a) =>
                a.id === existing.id
                  ? {
                      ...a,
                      budgetedAmount: amount,
                      remainingAmount: amount - a.spentAmount,
                      updatedAt: new Date(),
                    }
                  : a
              ),
            };
          }
          return {
            allocations: [
              ...s.allocations,
              {
                id: nanoid(),
                paycheckId,
                categoryId,
                budgetedAmount: amount,
                spentAmount: 0,
                remainingAmount: amount,
                rolloverAmount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          };
        }),
      addBill: (bill) =>
        set((s) => ({
          bills: [...s.bills, { ...bill, id: nanoid(), createdAt: new Date(), updatedAt: new Date() }],
        })),
      updateBill: (id, patch) =>
        set((s) => ({
          bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: new Date() } : b)),
        })),
      deleteBill: (id) =>
        set((s) => ({
          bills: s.bills.filter((b) => b.id !== id),
        })),
      addGoal: (goal) =>
        set((s) => ({
          goals: [...s.goals, { ...goal, id: nanoid(), createdAt: new Date(), updatedAt: new Date() }],
        })),
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: new Date() } : g)),
        })),
      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
        })),
      addDebt: (debt) =>
        set((s) => ({
          debts: [...s.debts, { ...debt, id: nanoid(), createdAt: new Date(), updatedAt: new Date() }],
        })),
      updateDebt: (id, patch) =>
        set((s) => ({
          debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date() } : d)),
        })),
      deleteDebt: (id) =>
        set((s) => ({
          debts: s.debts.filter((d) => d.id !== id),
        })),
      resetDemoData: () => set(createInitialData()),
      exportData: () => {
        try {
          const s = usePlannerStore.getState();
          const data: PersistedPlannerData = {
            user: s.user,
            payFrequency: s.payFrequency,
            defaultPaycheckAmount: s.defaultPaycheckAmount,
            currency: s.currency,
            darkMode: s.darkMode,
            activePaycheckId: s.activePaycheckId,
            categoryGroups: s.categoryGroups,
            accounts: s.accounts,
            paychecks: s.paychecks,
            categories: s.categories,
            allocations: s.allocations,
            transactions: s.transactions,
            bills: s.bills,
            goals: s.goals,
            debts: s.debts,
          };
          return JSON.stringify(data, null, 2);
        } catch {
          return "";
        }
      },
      importData: (json) => {
        try {
          const parsed: unknown = JSON.parse(json);
          if (!isPersistedData(parsed)) {
            return { ok: false, message: "Invalid backup format." };
          }
          const revived = reviveDates(parsed);
          set(revived);
          return { ok: true, message: "Data imported successfully." };
        } catch {
          return { ok: false, message: "Could not parse JSON backup." };
        }
      },
    }),
    {
      name: "paycheck-planner-v1",
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        user: s.user,
        payFrequency: s.payFrequency,
        defaultPaycheckAmount: s.defaultPaycheckAmount,
        currency: s.currency,
        darkMode: s.darkMode,
        activePaycheckId: s.activePaycheckId,
        categoryGroups: s.categoryGroups,
        accounts: s.accounts,
        paychecks: s.paychecks,
        categories: s.categories,
        allocations: s.allocations,
        transactions: s.transactions,
        bills: s.bills,
        goals: s.goals,
        debts: s.debts,
      }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const data = persisted as Partial<PersistedPlannerData>;
        if (!isPersistedData({ ...createInitialData(), ...data })) {
          return current;
        }
        return {
          ...current,
          ...reviveDates({ ...createInitialData(), ...data }),
        };
      },
    }
  )
);
