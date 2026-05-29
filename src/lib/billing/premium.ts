import { FREE_LIMITS } from "@/lib/billing/plans";
import type { PremiumFeature, UserSubscription } from "@/types/billing";

type PremiumOptions = { demoMode?: boolean };

export function isPremium(subscription: UserSubscription, options?: PremiumOptions): boolean {
  if (options?.demoMode) return true;
  return (
    subscription.tier === "premium" &&
    (subscription.status === "active" || subscription.status === "trialing")
  );
}

export function canUseFeature(
  subscription: UserSubscription,
  feature: PremiumFeature,
  options?: PremiumOptions
): boolean {
  if (options?.demoMode) return true;
  if (isPremium(subscription, options)) return true;
  if (feature === "advanced_ai") return true;
  return false;
}

export function canAddAccount(
  subscription: UserSubscription,
  currentCount: number,
  options?: PremiumOptions
): boolean {
  if (options?.demoMode) return true;
  if (isPremium(subscription, options)) return true;
  return currentCount < FREE_LIMITS.maxAccounts;
}

export function canAddGoal(
  subscription: UserSubscription,
  currentCount: number,
  options?: PremiumOptions
): boolean {
  if (options?.demoMode) return true;
  if (isPremium(subscription, options)) return true;
  return currentCount < FREE_LIMITS.maxGoals;
}

export function canAddCategory(
  subscription: UserSubscription,
  currentCount: number,
  options?: PremiumOptions
): boolean {
  if (options?.demoMode) return true;
  if (isPremium(subscription, options)) return true;
  return currentCount < FREE_LIMITS.maxCustomCategories;
}
