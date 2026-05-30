import type {
  AppAccount,
  AppCategory,
  AppGoal,
  AppPreferences,
  AppRecurringRule,
  UserProfile,
} from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";

export type RemoteAppState = {
  profile: UserProfile;
  preferences: AppPreferences;
  onboardingCompleted: boolean;
  accounts: AppAccount[];
  categories: AppCategory[];
  transactions: DemoTransaction[];
  recurring: AppRecurringRule[];
  goals: AppGoal[];
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  onboarding_completed: boolean;
  preferences: AppPreferences | null;
};

export type AccountRow = {
  id: string;
  profile_id: string;
  name: string;
  type: string | null;
  kind: string | null;
  balance: number | null;
  color: string | null;
  icon: string | null;
  currency: string | null;
  hidden: boolean | null;
};

export type CategoryRow = {
  id: string;
  profile_id: string;
  name: string;
  group_name: string | null;
  icon: string | null;
  color: string | null;
  budgeted: number | null;
  monthly_target: number | null;
};

export type TransactionRow = {
  id: string;
  profile_id: string;
  merchant: string;
  amount: number;
  transaction_date: string;
  account_id: string | null;
  category_id: string | null;
  account_name: string | null;
  category_name: string | null;
  recurring: boolean | null;
  currency: string | null;
  notes: string | null;
};

export type RecurringRow = {
  id: string;
  profile_id: string;
  name: string;
  amount: number;
  cadence: string;
  next_run_date: string;
  account_id: string | null;
  category_id: string | null;
  is_income: boolean | null;
  is_active: boolean | null;
  paused: boolean | null;
};

export type GoalRow = {
  id: string;
  profile_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string | null;
  color: string | null;
};
