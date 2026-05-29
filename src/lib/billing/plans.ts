import type { PremiumFeature } from "@/types/billing";

export const FREE_LIMITS = {
  maxAccounts: 2,
  maxGoals: 1,
  maxCustomCategories: 8,
} as const;

export const PREMIUM_PRICE = {
  monthly: 9,
  annual: 79,
  currency: "USD",
} as const;

export const PLAN_FEATURES: Record<
  "free" | "premium",
  { label: string; features: string[]; limits: string[] }
> = {
  free: {
    label: "Free",
    features: [
      "Paycheck-first dashboard",
      "Basic smart insights",
      "Bi-weekly recurring support",
      "2 accounts & 1 savings goal",
    ],
    limits: ["Basic AI insights only", "No household sharing", "Standard exports"],
  },
  premium: {
    label: "Premium",
    features: [
      "Unlimited accounts & goals",
      "Natural language transactions + advanced AI insights",
      "What-if simulator",
      "Household sharing with roles",
      "Branded PDF reports",
      "Receipt scanning (coming soon)",
      "Custom categories & ad-free",
      "Priority support",
    ],
    limits: [],
  },
};

export const PREMIUM_FEATURE_SET: PremiumFeature[] = [
  "unlimited_accounts",
  "unlimited_goals",
  "advanced_ai",
  "ai_nlp_transactions",
  "what_if_simulator",
  "household_sharing",
  "pdf_export",
  "custom_categories",
  "receipt_scanning",
  "push_notifications",
  "priority_support",
  "ad_free",
];

export function stripePriceIds() {
  return {
    monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_ANNUAL ?? "",
  };
}
