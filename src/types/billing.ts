export type PlanTier = "free" | "premium";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "none";

export type UserSubscription = {
  tier: PlanTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
};

export type PremiumFeature =
  | "unlimited_accounts"
  | "unlimited_goals"
  | "advanced_ai"
  | "ai_nlp_transactions"
  | "what_if_simulator"
  | "household_sharing"
  | "pdf_export"
  | "custom_categories"
  | "receipt_scanning"
  | "push_notifications"
  | "priority_support"
  | "ad_free";
