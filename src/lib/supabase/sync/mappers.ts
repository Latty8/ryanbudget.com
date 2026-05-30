import type {
  AppAccount,
  AppCategory,
  AppGoal,
  AppPreferences,
  AppRecurringRule,
} from "@/types/app-settings";
import type {
  AccountRow,
  CategoryRow,
  GoalRow,
  ProfileRow,
  RecurringRow,
  RemoteAppState,
  TransactionRow,
} from "@/lib/supabase/sync/types";
import type { DemoTransaction } from "@/lib/demo/sample-data";

const defaultPreferences: AppPreferences = {
  currency: "USD",
  dateFormat: "MDY",
  weekStart: "sunday",
  budgetPeriod: "bi-weekly",
  locale: "en",
};

export function mapAccountRow(row: AccountRow): AppAccount {
  return {
    id: row.id,
    name: row.name,
    kind: (row.kind ?? row.type ?? "checking") as AppAccount["kind"],
    balance: Number(row.balance ?? 0),
    color: row.color ?? "#38bdf8",
    icon: row.icon ?? "Wallet",
    currency: (row.currency ?? "USD") as AppAccount["currency"],
    hidden: row.hidden ?? false,
  };
}

export function mapAccountToRow(profileId: string, account: AppAccount): AccountRow {
  return {
    id: account.id,
    profile_id: profileId,
    name: account.name,
    type: account.kind,
    kind: account.kind,
    balance: account.balance,
    color: account.color,
    icon: account.icon,
    currency: account.currency ?? "USD",
    hidden: account.hidden ?? false,
  };
}

export function mapCategoryRow(row: CategoryRow): AppCategory {
  return {
    id: row.id,
    name: row.name,
    group: row.group_name ?? "Custom",
    icon: row.icon ?? "CircleDollarSign",
    color: row.color ?? "#0d9488",
    budgeted: Number(row.budgeted ?? row.monthly_target ?? 0),
  };
}

export function mapCategoryToRow(profileId: string, category: AppCategory): CategoryRow {
  return {
    id: category.id,
    profile_id: profileId,
    name: category.name,
    group_name: category.group,
    icon: category.icon,
    color: category.color,
    budgeted: category.budgeted,
    monthly_target: category.budgeted,
  };
}

export function mapTransactionRow(row: TransactionRow): DemoTransaction {
  return {
    id: row.id,
    date: row.transaction_date,
    merchant: row.merchant,
    category: row.category_name ?? "Uncategorized",
    account: row.account_name ?? "Manual",
    amount: Number(row.amount),
    recurring: row.recurring ?? false,
    currency: (row.currency ?? "USD") as DemoTransaction["currency"],
  };
}

export function mapTransactionToRow(profileId: string, tx: DemoTransaction): TransactionRow {
  return {
    id: tx.id,
    profile_id: profileId,
    merchant: tx.merchant,
    amount: tx.amount,
    transaction_date: tx.date,
    account_id: null,
    category_id: null,
    account_name: tx.account,
    category_name: tx.category,
    recurring: tx.recurring ?? false,
    currency: tx.currency ?? "USD",
    notes: null,
  };
}

export function mapRecurringRow(row: RecurringRow): AppRecurringRule {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    cadence: row.cadence as AppRecurringRule["cadence"],
    nextDate: row.next_run_date,
    paused: row.paused ?? !(row.is_active ?? true),
  };
}

export function mapRecurringToRow(profileId: string, rule: AppRecurringRule): RecurringRow {
  return {
    id: rule.id,
    profile_id: profileId,
    name: rule.name,
    amount: rule.amount,
    cadence: rule.cadence,
    next_run_date: rule.nextDate,
    account_id: null,
    category_id: null,
    is_income: false,
    is_active: !rule.paused,
    paused: rule.paused ?? false,
  };
}

export function mapGoalRow(row: GoalRow): AppGoal {
  return {
    id: row.id,
    name: row.name,
    target: Number(row.target_amount),
    current: Number(row.current_amount),
    targetDate: row.target_date ?? "",
    icon: row.icon ?? "Target",
    color: row.color ?? "#0d9488",
  };
}

export function mapGoalToRow(profileId: string, goal: AppGoal): GoalRow {
  return {
    id: goal.id,
    profile_id: profileId,
    name: goal.name,
    target_amount: goal.target,
    current_amount: goal.current,
    target_date: goal.targetDate || null,
    icon: goal.icon,
    color: goal.color,
  };
}

export function mapRemoteState(input: {
  profile: ProfileRow | null;
  accounts: AccountRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
  recurring: RecurringRow[];
  goals: GoalRow[];
  fallbackProfile?: { email: string; name: string };
}): RemoteAppState {
  const profile = input.profile;
  return {
    profile: {
      name: profile?.full_name ?? input.fallbackProfile?.name ?? "",
      email: profile?.email ?? input.fallbackProfile?.email ?? "",
    },
    preferences: { ...defaultPreferences, ...(profile?.preferences ?? {}) },
    onboardingCompleted: profile?.onboarding_completed ?? false,
    accounts: input.accounts.map(mapAccountRow),
    categories: input.categories.map(mapCategoryRow),
    transactions: input.transactions.map(mapTransactionRow),
    recurring: input.recurring.map(mapRecurringRow),
    goals: input.goals.map(mapGoalRow),
  };
}

export function hasRemoteData(state: RemoteAppState) {
  return (
    state.accounts.length > 0 ||
    state.categories.length > 0 ||
    state.transactions.length > 0 ||
    state.recurring.length > 0 ||
    state.goals.length > 0
  );
}
