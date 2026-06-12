import type { DemoTransaction } from "@/lib/demo/sample-data";
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

export type SinkingFundType = "general" | "vacation" | "holiday" | "emergency" | "repair" | "other";

export type FundKind = "sinking" | "debt";

export type AppGoal = {
  id: string;
  /** Sinking fund (save toward target) or debt (pay down balance) */
  kind?: FundKind;
  name: string;
  /** Sinking: target amount. Debt: optional original balance for progress. */
  target: number;
  /** Sinking: amount saved. Debt: remaining balance owed. */
  current: number;
  targetDate: string;
  icon: string;
  color: string;
  /** Optional planned monthly contribution (sinking) */
  monthlyContribution?: number;
  fundType?: SinkingFundType;
  notes?: string;
  /** Debt: required minimum or planned payment per month */
  monthlyPayment?: number;
  /** Debt: annual percentage rate (optional) */
  interestRateApy?: number;
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
  /** Skip this date only (yyyy-MM-dd) — occurrence not projected */
  skippedDates?: string[];
  /** Auto-resume after this date (yyyy-MM-dd) when set via timed pause */
  pausedUntil?: string;
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
  /** Unused budget carried into the current period */
  rolloverBalance?: number;
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
  /** Align cash flow & safe-to-spend for bi-weekly pay with monthly bills */
  biweeklyIncomeMonthlyBills?: boolean;
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
  /** Full backup fields (optional for older exports) */
  transactions?: DemoTransaction[];
  recurring?: AppRecurringRule[];
  goals?: AppGoal[];
  onboardingComplete?: boolean;
};
