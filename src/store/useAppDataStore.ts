"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PERSIST_STORE_NAME, userPersistStorage } from "@/lib/storage/user-persist";
import { nanoid } from "nanoid";
import {
  enrichedAccounts,
  enrichedCategories,
  enrichedRecurring,
  enrichedTransactions,
} from "@/lib/demo/enriched-demo-data";
import { convertAmount } from "@/lib/currency/exchange-rates";
import { clearRecurringProjectionCache } from "@/lib/recurring/project-runs";
import { demoGoals } from "@/lib/demo/sample-data";
import type {
  AppAccount,
  AppCategory,
  AppExportBundle,
  AppGoal,
  AppPreferences,
  CurrencyCode,
  DateFormatPreference,
  OnboardingProgress,
  UserProfile,
  WeekStartPreference,
} from "@/types/app-settings";

type AppDataState = {
  profile: UserProfile;
  accounts: AppAccount[];
  categories: AppCategory[];
  preferences: AppPreferences;
  onboardingComplete: boolean;
  demoTransactions: typeof enrichedTransactions;
  demoRecurring: typeof enrichedRecurring;
  goals: AppGoal[];
  onboardingProgress: OnboardingProgress;
  setProfile: (patch: Partial<UserProfile>) => void;
  setPreferences: (patch: Partial<AppPreferences>) => void;
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
  setRecurring: (recurring: AppDataState["demoRecurring"]) => void;
  setOnboardingProgress: (patch: Partial<OnboardingProgress>) => void;
  completeOnboarding: () => void;
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
};

const defaultPreferences: AppPreferences = {
  currency: "USD",
  dateFormat: "MDY",
  weekStart: "sunday",
  locale: "en",
};

const initialState = {
  profile: { name: "", email: "" },
  accounts: [] as AppAccount[],
  categories: [] as AppCategory[],
  preferences: defaultPreferences,
  onboardingComplete: false,
  demoTransactions: [] as typeof enrichedTransactions,
  demoRecurring: [] as typeof enrichedRecurring,
  goals: [] as AppGoal[],
  onboardingProgress: { step: 0, skippedSteps: [] as number[] },
};

export const useAppDataStore = create<AppDataState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      setPreferences: (patch) =>
        set((state) => ({ preferences: { ...state.preferences, ...patch } })),
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
        set((state) => ({ categories: [...state.categories, { ...category, id: nanoid() }] })),
      updateCategory: (id, patch) =>
        set((state) => ({
          categories: state.categories.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        })),
      deleteCategory: (id) =>
        set((state) => ({ categories: state.categories.filter((row) => row.id !== id) })),
      setCategories: (categories) => set({ categories }),
      setRecurring: (demoRecurring) => {
        clearRecurringProjectionCache();
        set({ demoRecurring });
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
    }),
    {
      name: PERSIST_STORE_NAME,
      storage: createJSONStorage(() => userPersistStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<typeof current> | undefined;
        if (!p || (typeof p === "object" && Object.keys(p).length === 0)) {
          return current;
        }
        return {
          ...current,
          ...p,
          preferences: { ...defaultPreferences, ...current.preferences, ...p?.preferences },
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

export function preferenceLabels(prefs: AppPreferences) {
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
