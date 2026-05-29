import type { AccountKind } from "@/types/finance";

export type DateFormatPreference = "MDY" | "DMY" | "YMD";
export type WeekStartPreference = "sunday" | "monday";
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

export type AppCategory = {
  id: string;
  name: string;
  group: string;
  icon: string;
  color: string;
  budgeted: number;
};

export type AppPreferences = {
  currency: CurrencyCode;
  dateFormat: DateFormatPreference;
  weekStart: WeekStartPreference;
  locale: AppLocale;
};

export type AppExportBundle = {
  version: 1;
  exportedAt: string;
  profile: UserProfile;
  accounts: AppAccount[];
  categories: AppCategory[];
  preferences: AppPreferences;
};
