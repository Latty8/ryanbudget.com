import type {
  AppAccount,
  AppCategory,
  AppGoal,
  AppPreferences,
  AppRecurringRule,
} from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { RemoteAppState } from "@/lib/supabase/sync/types";
import type { MongoAccountDoc } from "@/lib/mongodb/models/Account";
import type { MongoCategoryDoc } from "@/lib/mongodb/models/Category";
import type { MongoGoalDoc } from "@/lib/mongodb/models/Goal";
import type { MongoRecurringDoc } from "@/lib/mongodb/models/RecurringTransaction";
import type { MongoTransactionDoc } from "@/lib/mongodb/models/Transaction";

const defaultPreferences: AppPreferences = {
  currency: "USD",
  dateFormat: "MDY",
  weekStart: "sunday",
  budgetPeriod: "bi-weekly",
  locale: "en",
};

export function mapAccountDoc(doc: MongoAccountDoc): AppAccount {
  return {
    id: doc.clientId,
    name: doc.name,
    kind: doc.kind as AppAccount["kind"],
    balance: doc.balance ?? 0,
    color: doc.color ?? "#38bdf8",
    icon: doc.icon ?? "Wallet",
    currency: (doc.currency ?? "USD") as AppAccount["currency"],
    hidden: doc.hidden ?? false,
  };
}

export function mapCategoryDoc(doc: MongoCategoryDoc): AppCategory {
  return {
    id: doc.clientId,
    name: doc.name,
    group: doc.group ?? "Custom",
    icon: doc.icon ?? "CircleDollarSign",
    color: doc.color ?? "#0d9488",
    budgeted: doc.budgeted ?? 0,
    budgetBehavior: (doc.budgetBehavior as AppCategory["budgetBehavior"]) ?? "fixed",
  };
}

export function mapTransactionDoc(doc: MongoTransactionDoc): DemoTransaction {
  return {
    id: doc.clientId,
    date: doc.transactionDate,
    merchant: doc.merchant,
    category: doc.categoryName ?? "Uncategorized",
    account: doc.accountName ?? "Manual",
    amount: doc.amount,
    recurring: doc.recurring ?? false,
    currency: (doc.currency ?? "USD") as DemoTransaction["currency"],
  };
}

export function mapRecurringDoc(doc: MongoRecurringDoc): AppRecurringRule {
  return {
    id: doc.clientId,
    name: doc.name,
    amount: doc.amount,
    cadence: doc.cadence as AppRecurringRule["cadence"],
    nextDate: doc.nextRunDate,
    paused: doc.paused ?? false,
  };
}

export function mapGoalDoc(doc: MongoGoalDoc): AppGoal {
  return {
    id: doc.clientId,
    name: doc.name,
    target: doc.targetAmount ?? 0,
    current: doc.currentAmount ?? 0,
    targetDate: doc.targetDate ?? "",
    icon: doc.icon ?? "Target",
    color: doc.color ?? "#0d9488",
  };
}

export function buildRemoteState(input: {
  email: string;
  name: string;
  onboardingCompleted: boolean;
  preferences: AppPreferences;
  accounts: MongoAccountDoc[];
  categories: MongoCategoryDoc[];
  transactions: MongoTransactionDoc[];
  recurring: MongoRecurringDoc[];
  goals: MongoGoalDoc[];
}): RemoteAppState {
  return {
    profile: { email: input.email, name: input.name },
    preferences: { ...defaultPreferences, ...input.preferences },
    onboardingCompleted: input.onboardingCompleted,
    accounts: input.accounts.map(mapAccountDoc),
    categories: input.categories.map(mapCategoryDoc),
    transactions: input.transactions.map(mapTransactionDoc),
    recurring: input.recurring.map(mapRecurringDoc),
    goals: input.goals.map(mapGoalDoc),
  };
}
