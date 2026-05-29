"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  applyMergedAssignmentsFromHalves,
  flatAssignmentsToHalves,
  mergeHalvesRow,
  scrubHalvesForCategory,
  type AssignmentHalfRow,
  type AssignmentHalvesMap,
} from "@/lib/assignment-halves";
import { getPeriodBounds } from "@/lib/period";
import { periodKey } from "@/lib/period-key";
import { supportsPeriodHalves } from "@/lib/period-halves";
import {
  flattenCategoryTree,
  moveTopLevelGroup,
} from "@/lib/categories";
import {
  buildPeriodAssignmentsFromTemplate,
  copyPeriodToTemplate,
  emptyTemplateHalves,
  scrubTemplateForCategory,
  type AssignmentTemplate,
} from "@/lib/budget-template";
import type { AssignmentsMap } from "@/lib/ynab-simulation";
import type { PlaidSyncResult } from "@/lib/plaid/types";
import type {
  BudgetSettings,
  Category,
  CategoryKind,
  Debt,
  LinkedBankAccount,
  SavingsVault,
  Transaction,
} from "@/lib/types";

const defaultCategories: Category[] = [
  {
    id: "cat-salary",
    name: "Salary",
    color: "#22c55e",
    kind: "income",
    parentId: null,
  },
  {
    id: "cat-housing",
    name: "Housing",
    color: "#6366f1",
    kind: "expense",
    parentId: null,
  },
  {
    id: "cat-food",
    name: "Food & groceries",
    color: "#f97316",
    kind: "expense",
    parentId: null,
  },
  {
    id: "cat-transport",
    name: "Transportation",
    color: "#0ea5e9",
    kind: "expense",
    parentId: null,
  },
  {
    id: "cat-utilities",
    name: "Utilities",
    color: "#eab308",
    kind: "expense",
    parentId: null,
  },
  {
    id: "cat-entertainment",
    name: "Entertainment",
    color: "#a855f7",
    kind: "expense",
    parentId: null,
  },
  {
    id: "cat-health",
    name: "Health",
    color: "#ec4899",
    kind: "expense",
    parentId: null,
  },
  {
    id: "cat-debt",
    name: "Debt payments",
    color: "#ef4444",
    kind: "expense",
    parentId: null,
  },
  {
    id: "cat-other",
    name: "Other",
    color: "#64748b",
    kind: "expense",
    parentId: null,
  },
];

function defaultAnchor(): string {
  const d = new Date();
  const monday = new Date(d);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

const defaultSettings: BudgetSettings = {
  periodType: "monthly",
  weekStartsOn: 1,
  biweeklyAnchor: defaultAnchor(),
  splitBudgetPeriodHalves: false,
};

function splitEnabled(settings: BudgetSettings): boolean {
  return settings.splitBudgetPeriodHalves && supportsPeriodHalves(settings);
}

function scrubAssignmentsForCategory(
  assignmentsByPeriod: AssignmentsMap,
  categoryId: string
): AssignmentsMap {
  return Object.fromEntries(
    Object.entries(assignmentsByPeriod)
      .map(([k, row]) => {
        const next = Object.fromEntries(
          Object.entries(row).filter(([cid]) => cid !== categoryId)
        );
        return [k, next] as const;
      })
      .filter(([, row]) => Object.keys(row).length > 0)
  );
}

export interface BudgetState {
  settings: BudgetSettings;
  categories: Category[];
  transactions: Transaction[];
  /** YNAB-style: dollars assigned from Ready to Assign → category per budget period. */
  assignmentsByPeriod: AssignmentsMap;
  /** When split halves are on: per-period breakdown; merged totals mirror assignmentsByPeriod. */
  assignmentHalvesByPeriod: AssignmentHalvesMap;
  /** Reusable “sheet” — default assigned amounts per budget period. */
  assignmentTemplate: AssignmentTemplate;
  assignmentTemplateHalves: AssignmentHalfRow;
  debts: Debt[];
  vaults: SavingsVault[];
  /** Cached from Plaid /api/plaid/accounts */
  linkedAccounts: LinkedBankAccount[];
  setSettings: (partial: Partial<BudgetSettings>) => void;
  addCategory: (
    name: string,
    color: string,
    kind?: CategoryKind,
    parentId?: string | null
  ) => void;
  updateCategory: (
    id: string,
    name: string,
    color: string,
    kind?: CategoryKind,
    parentId?: string | null
  ) => void;
  /** Moves category one row up or down in lists (budget, transactions, charts). */
  moveCategory: (id: string, direction: "up" | "down") => void;
  deleteCategory: (id: string) => void;
  addTransaction: (
    t: Omit<Transaction, "id"> & { id?: string }
  ) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  /** Assigned amount for category this period (moves money from RTA into envelope). */
  setPeriodAssignment: (
    periodKey: string,
    categoryId: string,
    amount: number
  ) => void;
  setPeriodAssignmentHalf: (
    periodKey: string,
    slot: "first" | "second",
    categoryId: string,
    amount: number
  ) => void;
  setTemplateAssignment: (categoryId: string, amount: number) => void;
  setTemplateAssignmentHalf: (
    slot: "first" | "second",
    categoryId: string,
    amount: number
  ) => void;
  applyTemplateToPeriod: (
    periodKey: string,
    mode?: "onlyEmpty" | "overwrite"
  ) => void;
  savePeriodAsTemplate: (periodKey: string) => void;
  addDebt: (d: Omit<Debt, "id"> & { id?: string }) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  applyDebtPayment: (
    debtId: string,
    amount: number,
    options?: { logExpense?: boolean; categoryId?: string | null }
  ) => void;
  addVault: (v: Omit<SavingsVault, "id"> & { id?: string }) => void;
  updateVault: (id: string, patch: Partial<SavingsVault>) => void;
  deleteVault: (id: string) => void;
  vaultDeposit: (
    vaultId: string,
    amount: number,
    options?: { logExpense?: boolean; categoryId?: string | null }
  ) => void;
  vaultWithdraw: (
    vaultId: string,
    amount: number,
    options?: { logIncome?: boolean; categoryId?: string | null }
  ) => void;
  setLinkedAccounts: (accounts: LinkedBankAccount[]) => void;
  /** Merge Plaid sync into the ledger (dedupe by externalId). */
  applyPlaidSync: (result: PlaidSyncResult) => {
    added: number;
    updated: number;
    removed: number;
  };
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      categories: defaultCategories,
      transactions: [],
      assignmentsByPeriod: {},
      assignmentHalvesByPeriod: {},
      assignmentTemplate: {},
      assignmentTemplateHalves: emptyTemplateHalves(),
      debts: [],
      vaults: [],
      linkedAccounts: [],

      setSettings: (partial) =>
        set((s) => {
          const settings = { ...s.settings, ...partial };
          const assignmentsByPeriod = s.assignmentsByPeriod;
          let assignmentHalvesByPeriod = s.assignmentHalvesByPeriod;

          const prevSplit = splitEnabled(s.settings);
          const nextSplit = splitEnabled(settings);

          if (!supportsPeriodHalves(settings)) {
            assignmentHalvesByPeriod = {};
          } else if (!prevSplit && nextSplit) {
            assignmentHalvesByPeriod = flatAssignmentsToHalves(assignmentsByPeriod);
          } else if (prevSplit && !nextSplit) {
            assignmentHalvesByPeriod = {};
          }

          return {
            settings,
            assignmentsByPeriod,
            assignmentHalvesByPeriod,
          };
        }),

      addCategory: (name, color, kind = "expense", parentId = null) =>
        set((s) => {
          const parent =
            parentId != null
              ? s.categories.find((c) => c.id === parentId)
              : null;
          if (parentId != null && (!parent || parent.parentId != null)) {
            return s;
          }
          const resolvedKind = parent?.kind ?? kind;
          const entry: Category = {
            id: nanoid(),
            name,
            color,
            kind: resolvedKind,
            parentId: parentId ?? null,
          };
          if (parentId == null) {
            return { categories: [...s.categories, entry] };
          }
          const parentIdx = s.categories.findIndex((c) => c.id === parentId);
          const lastChildIdx = s.categories.reduce(
            (max, c, i) =>
              c.parentId === parentId && i > max ? i : max,
            parentIdx
          );
          const insertAt = lastChildIdx + 1;
          const next = [...s.categories];
          next.splice(insertAt, 0, entry);
          return { categories: next };
        }),

      updateCategory: (id, name, color, kind, parentId) =>
        set((s) => {
          const existing = s.categories.find((c) => c.id === id);
          if (!existing) return s;

          const hasKids = s.categories.some((c) => c.parentId === id);
          let nextParentId = existing.parentId;
          if (parentId !== undefined) {
            if (hasKids && parentId != null) return s;
            if (parentId != null) {
              const parent = s.categories.find((c) => c.id === parentId);
              if (!parent || parent.parentId != null || parent.id === id) {
                return s;
              }
              nextParentId = parentId;
            } else {
              nextParentId = null;
            }
          }

          const nextKind =
            kind !== undefined
              ? kind
              : nextParentId
                ? (s.categories.find((c) => c.id === nextParentId)?.kind ??
                  existing.kind)
                : existing.kind;

          let categories = s.categories.map((c) => {
            if (c.id === id) {
              return {
                ...c,
                name,
                color,
                kind: nextKind,
                parentId: nextParentId,
              };
            }
            if (c.parentId === id && kind !== undefined) {
              return { ...c, kind: nextKind };
            }
            return c;
          });

          const updated = categories.find((c) => c.id === id)!;
          const transactions = s.transactions.map((t) => {
            if (t.categoryId !== id) return t;
            if (updated.kind !== t.type) return { ...t, categoryId: null };
            return t;
          });

          if (parentId !== undefined && parentId !== existing.parentId) {
            const without = categories.filter((c) => c.id !== id);
            const parentIdx =
              parentId != null
                ? without.findIndex((c) => c.id === parentId)
                : -1;
            if (parentId != null && parentIdx < 0) return s;
            const lastChildIdx =
              parentId != null
                ? without.reduce(
                    (max, c, i) =>
                      c.parentId === parentId && i > max ? i : max,
                    parentIdx
                  )
                : without.length - 1;
            const insertAt =
              parentId != null ? lastChildIdx + 1 : without.length;
            without.splice(insertAt, 0, updated);
            categories = without;
          }

          return { categories, transactions };
        }),

      moveCategory: (id, direction) =>
        set((s) => {
          const cat = s.categories.find((c) => c.id === id);
          if (!cat) return s;

          if (cat.parentId == null) {
            return {
              categories: moveTopLevelGroup(
                s.categories,
                id,
                direction
              ),
            };
          }

          const siblings = s.categories.filter(
            (c) => c.parentId === cat.parentId
          );
          const sibIdx = siblings.findIndex((c) => c.id === id);
          const swapIdx =
            direction === "up" ? sibIdx - 1 : sibIdx + 1;
          if (swapIdx < 0 || swapIdx >= siblings.length) return s;
          const next = [...s.categories];
          const idxA = next.findIndex((c) => c.id === siblings[sibIdx].id);
          const idxB = next.findIndex((c) => c.id === siblings[swapIdx].id);
          [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
          return { categories: flattenCategoryTree(next) };
        }),

      deleteCategory: (id) =>
        set((s) => {
          const childIds = s.categories
            .filter((c) => c.parentId === id)
            .map((c) => c.id);
          const removeIds = new Set([id, ...childIds]);

          let assignmentHalvesByPeriod = s.assignmentHalvesByPeriod;
          let assignmentsByPeriod = s.assignmentsByPeriod;
          let assignmentTemplate = s.assignmentTemplate;
          let assignmentTemplateHalves = s.assignmentTemplateHalves;
          for (const rid of removeIds) {
            assignmentHalvesByPeriod = scrubHalvesForCategory(
              assignmentHalvesByPeriod,
              rid
            );
            assignmentsByPeriod = scrubAssignmentsForCategory(
              assignmentsByPeriod,
              rid
            );
            const scrubbed = scrubTemplateForCategory(
              assignmentTemplate,
              assignmentTemplateHalves,
              rid
            );
            assignmentTemplate = scrubbed.flat;
            assignmentTemplateHalves = scrubbed.halves;
          }
          if (splitEnabled(s.settings)) {
            assignmentsByPeriod = applyMergedAssignmentsFromHalves(
              assignmentsByPeriod,
              assignmentHalvesByPeriod
            );
          }
          return {
            categories: s.categories.filter((c) => !removeIds.has(c.id)),
            transactions: s.transactions.map((t) =>
              t.categoryId && removeIds.has(t.categoryId)
                ? { ...t, categoryId: null }
                : t
            ),
            assignmentsByPeriod,
            assignmentHalvesByPeriod,
            assignmentTemplate,
            assignmentTemplateHalves,
          };
        }),

      addTransaction: (t) =>
        set((s) => ({
          transactions: [
            ...s.transactions,
            {
              id: t.id ?? nanoid(),
              amount: Math.abs(t.amount),
              type: t.type,
              categoryId: t.categoryId,
              description: t.description,
              date: t.date,
              externalId: t.externalId,
              accountId: t.accountId ?? null,
            },
          ],
        })),

      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((x) =>
            x.id === id
              ? {
                  ...x,
                  ...patch,
                  amount:
                    patch.amount !== undefined
                      ? Math.abs(patch.amount)
                      : x.amount,
                }
              : x
          ),
        })),

      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((x) => x.id !== id),
        })),

      setPeriodAssignment: (periodKey, categoryId, amount) =>
        set((s) => {
          const rounded =
            Math.round(Math.max(0, amount) * 100) / 100;

          if (splitEnabled(s.settings)) {
            const halves = { ...s.assignmentHalvesByPeriod };
            const hRow = {
              first: { ...(halves[periodKey]?.first ?? {}) },
              second: { ...(halves[periodKey]?.second ?? {}) },
            };
            delete hRow.first[categoryId];
            delete hRow.second[categoryId];
            if (rounded > 0 && !Number.isNaN(rounded)) {
              hRow.first[categoryId] = rounded;
            }
            if (
              Object.keys(hRow.first).length === 0 &&
              Object.keys(hRow.second).length === 0
            ) {
              delete halves[periodKey];
            } else {
              halves[periodKey] = hRow;
            }
            const merged = mergeHalvesRow(hRow);
            const nextFlat: AssignmentsMap = { ...s.assignmentsByPeriod };
            if (Object.keys(merged).length === 0) delete nextFlat[periodKey];
            else nextFlat[periodKey] = merged;
            return {
              assignmentHalvesByPeriod: halves,
              assignmentsByPeriod: nextFlat,
            };
          }

          const next: AssignmentsMap = { ...s.assignmentsByPeriod };
          const row = { ...(next[periodKey] ?? {}) };
          if (rounded <= 0 || Number.isNaN(rounded)) {
            delete row[categoryId];
            if (Object.keys(row).length === 0) delete next[periodKey];
            else next[periodKey] = row;
          } else {
            row[categoryId] = rounded;
            next[periodKey] = row;
          }
          return { assignmentsByPeriod: next };
        }),

      setPeriodAssignmentHalf: (periodKey, slot, categoryId, amount) =>
        set((s) => {
          if (!splitEnabled(s.settings)) return s;
          const rounded =
            Math.round(Math.max(0, amount) * 100) / 100;
          const halves = { ...s.assignmentHalvesByPeriod };
          const hRow = {
            first: { ...(halves[periodKey]?.first ?? {}) },
            second: { ...(halves[periodKey]?.second ?? {}) },
          };
          const key = slot === "first" ? "first" : "second";
          if (rounded <= 0 || Number.isNaN(rounded)) {
            delete hRow[key][categoryId];
          } else {
            hRow[key][categoryId] = rounded;
          }
          if (
            Object.keys(hRow.first).length === 0 &&
            Object.keys(hRow.second).length === 0
          ) {
            delete halves[periodKey];
          } else {
            halves[periodKey] = hRow;
          }
          const merged = mergeHalvesRow(hRow);
          const nextFlat: AssignmentsMap = { ...s.assignmentsByPeriod };
          if (Object.keys(merged).length === 0) delete nextFlat[periodKey];
          else nextFlat[periodKey] = merged;
          return {
            assignmentHalvesByPeriod: halves,
            assignmentsByPeriod: nextFlat,
          };
        }),

      setTemplateAssignment: (categoryId, amount) =>
        set((s) => {
          const rounded =
            Math.round(Math.max(0, amount) * 100) / 100;
          const next = { ...s.assignmentTemplate };
          if (rounded <= 0 || Number.isNaN(rounded)) {
            delete next[categoryId];
          } else {
            next[categoryId] = rounded;
          }
          return { assignmentTemplate: next };
        }),

      setTemplateAssignmentHalf: (slot, categoryId, amount) =>
        set((s) => {
          const rounded =
            Math.round(Math.max(0, amount) * 100) / 100;
          const key = slot === "first" ? "first" : "second";
          const halves = {
            first: { ...s.assignmentTemplateHalves.first },
            second: { ...s.assignmentTemplateHalves.second },
          };
          if (rounded <= 0 || Number.isNaN(rounded)) {
            delete halves[key][categoryId];
          } else {
            halves[key][categoryId] = rounded;
          }
          const merged = mergeHalvesRow(halves);
          const nextTemplate = { ...s.assignmentTemplate };
          if (Object.keys(merged).length === 0) {
            delete nextTemplate[categoryId];
          } else if (merged[categoryId] != null) {
            nextTemplate[categoryId] = merged[categoryId];
          } else {
            delete nextTemplate[categoryId];
          }
          return {
            assignmentTemplateHalves: halves,
            assignmentTemplate: nextTemplate,
          };
        }),

      applyTemplateToPeriod: (periodKey, mode = "onlyEmpty") =>
        set((s) => {
          const useHalves = splitEnabled(s.settings);
          const built = buildPeriodAssignmentsFromTemplate(
            s.assignmentTemplate,
            s.assignmentTemplateHalves,
            s.assignmentsByPeriod[periodKey],
            mode,
            useHalves
          );

          const hasTemplate =
            Object.keys(s.assignmentTemplate).length > 0 ||
            Object.keys(s.assignmentTemplateHalves.first).length > 0 ||
            Object.keys(s.assignmentTemplateHalves.second).length > 0;
          if (!hasTemplate || Object.keys(built.flat).length === 0) return s;

          if (useHalves) {
            const halves = { ...s.assignmentHalvesByPeriod };
            if (built.halves) {
              halves[periodKey] = built.halves;
            } else {
              const prev = halves[periodKey];
              const hRow: AssignmentHalfRow =
                mode === "overwrite"
                  ? { first: {}, second: {} }
                  : {
                      first: { ...(prev?.first ?? {}) },
                      second: { ...(prev?.second ?? {}) },
                    };
              const cur = s.assignmentsByPeriod[periodKey] ?? {};
              for (const [catId, amt] of Object.entries(built.flat)) {
                if (mode === "onlyEmpty" && (cur[catId] ?? 0) > 0.001) {
                  continue;
                }
                hRow.first[catId] = amt;
                delete hRow.second[catId];
              }
              halves[periodKey] = hRow;
              built.flat = mergeHalvesRow(hRow);
            }
            const nextFlat = { ...s.assignmentsByPeriod };
            nextFlat[periodKey] = built.flat;
            return {
              assignmentHalvesByPeriod: halves,
              assignmentsByPeriod: nextFlat,
            };
          }

          const next = { ...s.assignmentsByPeriod };
          next[periodKey] = built.flat;
          return { assignmentsByPeriod: next };
        }),

      savePeriodAsTemplate: (periodKey) =>
        set((s) => {
          const copied = copyPeriodToTemplate(
            s.assignmentsByPeriod[periodKey],
            s.assignmentHalvesByPeriod[periodKey]
          );
          return {
            assignmentTemplate: copied.template,
            assignmentTemplateHalves: copied.halves,
          };
        }),

      addDebt: (d) =>
        set((s) => ({
          debts: [
            ...s.debts,
            {
              id: d.id ?? nanoid(),
              name: d.name,
              currentBalance: d.currentBalance,
              monthlyPayment: d.monthlyPayment,
              originalBalance: d.originalBalance,
              notes: d.notes,
            },
          ],
        })),

      updateDebt: (id, patch) =>
        set((s) => ({
          debts: s.debts.map((x) =>
            x.id === id ? { ...x, ...patch } : x
          ),
        })),

      deleteDebt: (id) =>
        set((s) => ({
          debts: s.debts.filter((x) => x.id !== id),
        })),

      applyDebtPayment: (debtId, amount, options) =>
        set((s) => {
          const pay = Math.abs(amount);
          const debt = s.debts.find((x) => x.id === debtId);
          if (!debt || pay <= 0 || Number.isNaN(pay)) return s;
          const newBal = Math.max(0, debt.currentBalance - pay);
          const today = new Date().toISOString().slice(0, 10);
          let transactions = s.transactions;
          if (options?.logExpense) {
            transactions = [
              ...transactions,
              {
                id: nanoid(),
                amount: pay,
                type: "expense" as const,
                categoryId: options.categoryId ?? null,
                description: `Debt payment — ${debt.name}`,
                date: today,
              },
            ];
          }
          return {
            debts: s.debts.map((x) =>
              x.id === debtId ? { ...x, currentBalance: newBal } : x
            ),
            transactions,
          };
        }),

      addVault: (v) =>
        set((s) => ({
          vaults: [
            ...s.vaults,
            {
              id: v.id ?? nanoid(),
              name: v.name,
              balance: Math.max(0, v.balance),
              targetAmount: v.targetAmount,
              targetDate: v.targetDate,
              notes: v.notes,
            },
          ],
        })),

      updateVault: (id, patch) =>
        set((s) => ({
          vaults: s.vaults.map((x) =>
            x.id === id
              ? {
                  ...x,
                  ...patch,
                  balance:
                    patch.balance !== undefined
                      ? Math.max(0, patch.balance)
                      : x.balance,
                }
              : x
          ),
        })),

      deleteVault: (id) =>
        set((s) => ({
          vaults: s.vaults.filter((x) => x.id !== id),
        })),

      vaultDeposit: (vaultId, amount, options) =>
        set((s) => {
          const add = Math.abs(amount);
          const vault = s.vaults.find((x) => x.id === vaultId);
          if (!vault || add <= 0 || Number.isNaN(add)) return s;
          const today = new Date().toISOString().slice(0, 10);
          let transactions = s.transactions;
          if (options?.logExpense) {
            transactions = [
              ...transactions,
              {
                id: nanoid(),
                amount: add,
                type: "expense" as const,
                categoryId: options.categoryId ?? null,
                description: `Vault deposit — ${vault.name}`,
                date: today,
              },
            ];
          }
          return {
            vaults: s.vaults.map((x) =>
              x.id === vaultId
                ? { ...x, balance: Math.round((x.balance + add) * 100) / 100 }
                : x
            ),
            transactions,
          };
        }),

      vaultWithdraw: (vaultId, amount, options) =>
        set((s) => {
          const take = Math.abs(amount);
          const vault = s.vaults.find((x) => x.id === vaultId);
          if (!vault || take <= 0 || Number.isNaN(take)) return s;
          const nextBal = Math.max(
            0,
            Math.round((vault.balance - take) * 100) / 100
          );
          const today = new Date().toISOString().slice(0, 10);
          let transactions = s.transactions;
          if (options?.logIncome) {
            transactions = [
              ...transactions,
              {
                id: nanoid(),
                amount: take,
                type: "income" as const,
                categoryId: options.categoryId ?? null,
                description: `Vault withdrawal — ${vault.name}`,
                date: today,
              },
            ];
          }
          return {
            vaults: s.vaults.map((x) =>
              x.id === vaultId ? { ...x, balance: nextBal } : x
            ),
            transactions,
          };
        }),

      setLinkedAccounts: (accounts) => set({ linkedAccounts: accounts }),

      applyPlaidSync: (result) => {
        let added = 0;
        let updated = 0;
        let removed = 0;

        set((s) => {
          const accountByPlaid = new Map(
            result.accounts.map((a) => [a.plaidAccountId, a.id])
          );
          const byExt = new Map(
            s.transactions
              .filter((t) => t.externalId)
              .map((t) => [t.externalId!, t])
          );

          let transactions = s.transactions.filter(
            (t) =>
              !t.externalId ||
              !result.removedExternalIds.includes(t.externalId)
          );
          removed = s.transactions.length - transactions.length;

          for (const row of result.imported) {
            const accountId =
              accountByPlaid.get(row.plaidAccountId) ?? null;
            const existing = byExt.get(row.externalId);
            if (existing) {
              transactions = transactions.map((t) =>
                t.id === existing.id
                  ? {
                      ...t,
                      amount: row.amount,
                      type: row.type,
                      description: row.description,
                      date: row.date,
                      accountId,
                      categoryId:
                        t.categoryId ?? row.suggestedCategoryId ?? null,
                    }
                  : t
              );
              updated++;
              continue;
            }
            const created: Transaction = {
              id: nanoid(),
              amount: row.amount,
              type: row.type,
              categoryId: row.suggestedCategoryId ?? null,
              description: row.description,
              date: row.date,
              externalId: row.externalId,
              accountId,
            };
            transactions.push(created);
            byExt.set(row.externalId, created);
            added++;
          }

          return {
            transactions,
            linkedAccounts: result.accounts,
          };
        });

        return { added, updated, removed };
      },
    }),
    {
      name: "ryanbudget-store",
      storage: createJSONStorage(() => localStorage),
      version: 8,
      migrate: (persisted, fromVersion) => {
        type LegacyBudget = {
          categoryId: string;
          limit: number;
          percentOfIncome?: number;
        };
        type Persisted = {
          state?: {
            categoryBudgets?: LegacyBudget[];
            categories?: Array<
              Category & { kind?: CategoryKind; parentId?: string | null }
            >;
            assignmentsByPeriod?: AssignmentsMap;
            assignmentHalvesByPeriod?: AssignmentHalvesMap;
            assignmentTemplate?: AssignmentTemplate;
            assignmentTemplateHalves?: AssignmentHalfRow;
            settings?: BudgetSettings;
            vaults?: SavingsVault[];
            linkedAccounts?: LinkedBankAccount[];
            transactions?: Array<
              Transaction & { externalId?: string; accountId?: string | null }
            >;
          };
        };
        const p = persisted as Persisted;
        if (fromVersion < 8 && p.state) {
          if (!p.state.assignmentTemplate) {
            p.state.assignmentTemplate = {};
          }
          if (!p.state.assignmentTemplateHalves) {
            p.state.assignmentTemplateHalves = emptyTemplateHalves();
          }
        }
        if (fromVersion < 7 && p.state) {
          if (!Array.isArray(p.state.linkedAccounts)) {
            p.state.linkedAccounts = [];
          }
        }
        if (fromVersion < 6 && p.state?.categories) {
          for (const c of p.state.categories) {
            if (c.parentId === undefined) {
              c.parentId = null;
            }
          }
        }
        if (fromVersion < 5 && p.state) {
          if (!Array.isArray(p.state.vaults)) {
            p.state.vaults = [];
          }
        }
        if (fromVersion < 4 && p.state?.categories) {
          for (const c of p.state.categories) {
            if (c.kind == null) {
              c.kind = c.id === "cat-salary" ? "income" : "expense";
            }
          }
        }
        if (fromVersion < 3 && p.state) {
          const st = p.state;
          if (st.assignmentHalvesByPeriod == null) {
            st.assignmentHalvesByPeriod = {};
          }
          if (st.settings && st.settings.splitBudgetPeriodHalves === undefined) {
            st.settings.splitBudgetPeriodHalves = false;
          }
        }
        if (fromVersion < 2 && p.state) {
          const st = p.state;
          if (!st.assignmentsByPeriod) st.assignmentsByPeriod = {};
          const legacy = st.categoryBudgets;
          if (legacy?.length && st.settings) {
            const bounds = getPeriodBounds(st.settings, new Date());
            const k = periodKey(bounds);
            const row = { ...(st.assignmentsByPeriod[k] ?? {}) };
            for (const b of legacy) {
              if (b.limit > 0) {
                row[b.categoryId] = (row[b.categoryId] ?? 0) + b.limit;
              }
            }
            st.assignmentsByPeriod[k] = row;
          }
          delete st.categoryBudgets;
        }
        return persisted as typeof persisted;
      },
    }
  )
);
