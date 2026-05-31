import type { AccountKind, RecurringFrequency } from "@/types/finance";

export type DateFormatPreference = "MDY" | "DMY" | "YMD";
export type WeekStartPreference = "sunday" | "monday";
export type BudgetPeriodPreference = "monthly" | "weekly" | "bi-weekly";
export type BudgetViewDensity = "compact" | "comfortable";
export type CurrencyCode = "USD" | "CAD" | "EUR" | "GBP";
export type AppLocale = "en" | "es";

export type UserProfile = {
  name: string;
  email: string;
};

export type AppAccount = {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  color: string;
  icon: string;
  /** Account currency; defaults to primary preference when omitted */
  currency?: CurrencyCode;
  /** Hide from pickers without deleting data */
  hidden?: boolean;
};

export type AppGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
  icon: string;
  color: string;
};

export type OnboardingProgress = {
  step: number;
  skippedSteps: number[];
};

export type AppRecurringRule = {
  id: string;
  name: string;
  amount: number;
  cadence: RecurringFrequency;
  nextDate: string;
  /** When true, excluded from projections and dashboard "coming up" */
  paused?: boolean;
};

export type CategoryBudgetBehavior = "fixed" | "flexible" | "percentage" | "rollover";

export type AppCategory = {
  id: string;
  name: string;
  /** Budget grouping (Housing, Utilities, Food, etc.) — not wallet/account type */
  group: string;
  icon: string;
  color: string;
  budgeted: number;
  /** How this category behaves in the budget; defaults to fixed */
  budgetBehavior?: CategoryBudgetBehavior;
};

export type SyncedAppPreferences = {
  currency: CurrencyCode;
  dateFormat: DateFormatPreference;
  weekStart: WeekStartPreference;
  locale: AppLocale;
};

/** Per-device viewing preferences — never synced to the cloud. */
export type DeviceUiPreferences = {
  budgetPeriod: BudgetPeriodPreference;
  budgetViewDensity: BudgetViewDensity;
};

/** @deprecated Use SyncedAppPreferences + DeviceUiPreferences */
export type AppPreferences = SyncedAppPreferences & DeviceUiPreferences;

export type AppExportBundle = {
  version: 1;
  exportedAt: string;
  profile: UserProfile;
  accounts: AppAccount[];
  categories: AppCategory[];
  preferences: SyncedAppPreferences;
};
