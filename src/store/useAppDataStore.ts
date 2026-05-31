"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PERSIST_STORE_NAME, userPersistStorage } from "@/lib/storage/user-persist";
import { nanoid } from "nanoid";
import {
  SYSTEM_UNCATEGORIZED_NAME,
  createSystemUncategorizedCategory,
  ensureSystemCategories,
  isSystemCategory,
  newCategoryId,
} from "@/lib/categories/system-category";
import {
  enrichedAccounts,
  enrichedCategories,
  enrichedRecurring,
  enrichedTransactions,
} from "@/lib/demo/enriched-demo-data";
import { convertAmount } from "@/lib/currency/exchange-rates";
import {
  defaultSyncedPreferences,
  toSyncedPreferences,
} from "@/lib/preferences/sync-preferences";
import { clearRecurringProjectionCache } from "@/lib/recurring/project-runs";
import { demoGoals } from "@/lib/demo/sample-data";
import { transactionInputToStoreRow } from "@/lib/transactions/store-mapper";
import type {
  AppAccount,
  AppCategory,
  AppExportBundle,
  AppGoal,
  AppRecurringRule,
  SyncedAppPreferences,
  CurrencyCode,
  DateFormatPreference,
  OnboardingProgress,
  UserProfile,
  WeekStartPreference,
} from "@/types/app-settings";
import type { TransactionInput } from "@/types/finance";

type AppDataState = {
  profile: UserProfile;
  accounts: AppAccount[];
  categories: AppCategory[];
  preferences: SyncedAppPreferences;
  onboardingComplete: boolean;
  demoTransactions: typeof enrichedTransactions;
  demoRecurring: AppRecurringRule[];
  goals: AppGoal[];
  onboardingProgress: OnboardingProgress;
  setProfile: (patch: Partial<UserProfile>) => void;
  setPreferences: (patch: Partial<SyncedAppPreferences>) => void;
  addAccount: (account: Omit<AppAccount, "id">) => void;
  updateAccount: (id: string, patch: Partial<AppAccount>) => void;
  deleteAccount: (id: string) => void;
  addCategory: (category: Omit<AppCategory, "id">) => void;
  updateCategory: (id: string, patch: Partial<AppCategory>) => void;
  deleteCategory: (id: string) => void;
  addGoal: (goal: Omit<AppGoal, "id">) => void;
  updateGoal: (id: string, patch: Partial<AppGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  setAccounts: (accounts: AppAccount[]) => void;
  setCategories: (categories: AppCategory[]) => void;
  setRecurring: (recurring: AppRecurringRule[]) => void;
  addRecurring: (rule: Omit<AppRecurringRule, "id">) => void;
  updateRecurring: (id: string, patch: Partial<Omit<AppRecurringRule, "id">>) => void;
  deleteRecurring: (id: string) => void;
  toggleRecurringPaused: (id: string) => void;
  setOnboardingProgress: (patch: Partial<OnboardingProgress>) => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  loadDemoData: () => void;
  loadFromPublicTemplate: (payload: {
    accounts: AppAccount[];
    categories: AppCategory[];
    recurring: AppDataState["demoRecurring"];
    goals?: AppGoal[];
  }) => void;
  exportBundle: () => AppExportBundle;
  importBundle: (bundle: AppExportBundle) => void;
  deleteAllData: () => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  resetAppData: () => void;
};

const defaultPreferences = defaultSyncedPreferences;

const initialState = {
  profile: { name: "", email: "" },
  accounts: [] as AppAccount[],
  categories: [] as AppCategory[],
  preferences: defaultPreferences,
  onboardingComplete: false,
  demoTransactions: [] as typeof enrichedTransactions,
  demoRecurring: [] as AppRecurringRule[],
  goals: [] as AppGoal[],
  onboardingProgress: { step: 0, skippedSteps: [] as number[] },
};

export const useAppDataStore = create<AppDataState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      setPreferences: (patch) =>
        set((state) => ({
          preferences: toSyncedPreferences({ ...state.preferences, ...patch }),
        })),
      addAccount: (account) =>
        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              ...account,
              color: account.color ?? "#38bdf8",
              icon: account.icon ?? "Wallet",
              id: nanoid(),
            },
          ],
        })),
      setAccounts: (accounts) => set({ accounts }),
      updateAccount: (id, patch) =>
        set((state) => ({
          accounts: state.accounts.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        })),
      deleteAccount: (id) =>
        set((state) => {
          const removed = state.accounts.find((row) => row.id === id);
          const accounts = state.accounts.filter((row) => row.id !== id);
          const fallbackName = accounts[0]?.name ?? "General";
          return {
            accounts,
            demoTransactions:
              removed?.name
                ? state.demoTransactions.map((tx) =>
                    tx.account === removed.name ? { ...tx, account: fallbackName } : tx
                  )
                : state.demoTransactions,
          };
        }),
      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, { ...category, id: newCategoryId() }],
        })),
      updateCategory: (id, patch) =>
        set((state) => ({
          categories: state.categories.map((row) => {
            if (row.id !== id) return row;
            if (isSystemCategory(row)) {
              const { name: _name, ...rest } = patch;
              return { ...row, ...rest };
            }
            return { ...row, ...patch };
          }),
        })),
      deleteCategory: (id) =>
        set((state) => {
          const removed = state.categories.find((row) => row.id === id);
          if (!removed || isSystemCategory(removed)) return state;

          const categories = state.categories.filter((row) => row.id !== id);
          const reassigning = state.demoTransactions.some((tx) => tx.category === removed.name);
          const hasUncategorized = categories.some((c) => c.name === SYSTEM_UNCATEGORIZED_NAME);
          const nextCategories =
            reassigning && !hasUncategorized
              ? [...categories, createSystemUncategorizedCategory()]
              : categories;

          return {
            categories: nextCategories,
            demoTransactions: state.demoTransactions.map((tx) =>
              tx.category === removed.name
                ? { ...tx, category: SYSTEM_UNCATEGORIZED_NAME }
                : tx
            ),
          };
        }),
      setCategories: (categories) => set({ categories: ensureSystemCategories(categories) }),
      setRecurring: (demoRecurring) => {
        clearRecurringProjectionCache();
        set({ demoRecurring });
      },
      addRecurring: (rule) => {
        clearRecurringProjectionCache();
        set((state) => ({
          demoRecurring: [...state.demoRecurring, { ...rule, id: nanoid() }],
        }));
      },
      updateRecurring: (id, patch) => {
        clearRecurringProjectionCache();
        set((state) => ({
          demoRecurring: state.demoRecurring.map((row) =>
            row.id === id ? { ...row, ...patch } : row
          ),
        }));
      },
      deleteRecurring: (id) => {
        clearRecurringProjectionCache();
        set((state) => ({
          demoRecurring: state.demoRecurring.filter((row) => row.id !== id),
        }));
      },
      toggleRecurringPaused: (id) => {
        clearRecurringProjectionCache();
        set((state) => ({
          demoRecurring: state.demoRecurring.map((row) =>
            row.id === id ? { ...row, paused: !row.paused } : row
          ),
        }));
      },
      addGoal: (goal) =>
        set((state) => ({ goals: [...state.goals, { ...goal, id: nanoid() }] })),
      updateGoal: (id, patch) =>
        set((state) => ({
          goals: state.goals.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        })),
      deleteGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((row) => row.id !== id) })),
      contributeToGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((row) =>
            row.id === id
              ? { ...row, current: Math.min(row.target, row.current + Math.max(0, amount)) }
              : row
          ),
        })),
      setOnboardingProgress: (patch) =>
        set((state) => ({
          onboardingProgress: { ...state.onboardingProgress, ...patch },
        })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      restartOnboarding: () =>
        set({
          onboardingComplete: false,
          onboardingProgress: { step: 0, skippedSteps: [] },
        }),
      loadDemoData: () =>
        set({
          accounts: enrichedAccounts,
          categories: enrichedCategories,
          demoTransactions: enrichedTransactions,
          demoRecurring: enrichedRecurring,
          goals: demoGoals.map((g) => ({
            ...g,
            targetDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
            icon: g.name.includes("Emergency") ? "Shield" : "Plane",
            color: g.name.includes("Emergency") ? "#22c55e" : "#38bdf8",
          })),
        }),
      loadFromPublicTemplate: (payload) =>
        set({
          accounts: payload.accounts,
          categories: payload.categories,
          demoRecurring: payload.recurring,
          ...(payload.goals ? { goals: payload.goals } : {}),
        }),
      exportBundle: () => {
        const state = get();
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          profile: state.profile,
          accounts: state.accounts,
          categories: state.categories,
          preferences: state.preferences,
        };
      },
      importBundle: (bundle) => {
        if (bundle.version !== 1) return;
        set({
          profile: bundle.profile,
          accounts: bundle.accounts,
          categories: bundle.categories,
          preferences: bundle.preferences,
        });
      },
      deleteAllData: () =>
        set({
          ...initialState,
          onboardingComplete: false,
          demoTransactions: [],
          demoRecurring: [],
          accounts: [],
          categories: [],
          goals: [],
          onboardingProgress: { step: 0, skippedSteps: [] },
        }),
      updateTransaction: (id, input) => {
        const state = get();
        const existing = state.demoTransactions.find((t) => t.id === id);
        if (!existing) return;
        const row = transactionInputToStoreRow(
          input,
          id,
          state.accounts,
          state.categories,
          state.preferences,
          existing
        );
        set({
          demoTransactions: state.demoTransactions.map((t) => (t.id === id ? row : t)),
        });
      },
      deleteTransaction: (id) =>
        set((state) => ({
          demoTransactions: state.demoTransactions.filter((t) => t.id !== id),
        })),
      resetAppData: () => set({ ...initialState }),
    }),
    {
      name: PERSIST_STORE_NAME,
      storage: createJSONStorage(() => userPersistStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<typeof current> | undefined;
        if (!p || (typeof p === "object" && Object.keys(p).length === 0)) {
          return current;
        }
        const merged = {
          ...current,
          ...p,
          preferences: toSyncedPreferences({ ...defaultPreferences, ...current.preferences, ...p?.preferences }),
        };
        return {
          ...merged,
          categories: ensureSystemCategories(merged.categories ?? []),
        };
      },
    }
  )
);

export function formatMoney(amount: number, currency: CurrencyCode = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

/** Format in primary currency with optional native-currency hint. */
export function formatMoneyWithSource(
  amount: number,
  primary: CurrencyCode,
  source?: CurrencyCode
) {
  const from = source ?? primary;
  const converted = convertAmount(amount, from, primary);
  const main = formatMoney(converted, primary);
  if (from === primary) return main;
  const native = formatMoney(amount, from);
  return `${main} (${native})`;
}

export function preferenceLabels(prefs: SyncedAppPreferences) {
  const dateFormats: Record<DateFormatPreference, string> = {
    MDY: "MM/DD/YYYY",
    DMY: "DD/MM/YYYY",
    YMD: "YYYY-MM-DD",
  };
  const weekStarts: Record<WeekStartPreference, string> = {
    sunday: "Sunday",
    monday: "Monday",
  };
  return {
    dateFormat: dateFormats[prefs.dateFormat],
    weekStart: weekStarts[prefs.weekStart],
  };
}
