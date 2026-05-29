import { describe, expect, it } from "vitest";
import {
  canAddAccount,
  canAddCategory,
  canAddGoal,
  canUseFeature,
  isPremium,
} from "@/lib/billing/premium";
import { FREE_LIMITS } from "@/lib/billing/plans";
import { createFreeSubscription, createPremiumSubscription } from "@/test/factories/budget";

describe("subscription gating", () => {
  it("identifies active premium subscriptions", () => {
    expect(isPremium(createPremiumSubscription())).toBe(true);
    expect(isPremium(createFreeSubscription())).toBe(false);
  });

  it("blocks premium features on free tier except advanced_ai", () => {
    const free = createFreeSubscription();
    expect(canUseFeature(free, "what_if_simulator")).toBe(false);
    expect(canUseFeature(free, "household_sharing")).toBe(false);
    expect(canUseFeature(free, "pdf_export")).toBe(false);
    expect(canUseFeature(free, "advanced_ai")).toBe(true);
  });

  it("allows all features for premium", () => {
    const premium = createPremiumSubscription();
    expect(canUseFeature(premium, "what_if_simulator")).toBe(true);
    expect(canUseFeature(premium, "household_sharing")).toBe(true);
    expect(canUseFeature(premium, "ai_nlp_transactions")).toBe(true);
    expect(canUseFeature(premium, "pdf_export")).toBe(true);
    expect(canUseFeature(premium, "push_notifications")).toBe(true);
  });

  it("blocks NLP and PDF on free tier", () => {
    const free = createFreeSubscription();
    expect(canUseFeature(free, "ai_nlp_transactions")).toBe(false);
    expect(canUseFeature(free, "pdf_export")).toBe(false);
  });

  it("unlocks all features in demo mode", () => {
    const free = createFreeSubscription();
    expect(isPremium(free, { demoMode: true })).toBe(true);
    expect(canUseFeature(free, "household_sharing", { demoMode: true })).toBe(true);
    expect(canAddAccount(free, 99, { demoMode: true })).toBe(true);
  });

  it("enforces free tier account and category limits", () => {
    const free = createFreeSubscription();
    expect(canAddAccount(free, FREE_LIMITS.maxAccounts - 1)).toBe(true);
    expect(canAddAccount(free, FREE_LIMITS.maxAccounts)).toBe(false);
    expect(canAddGoal(free, FREE_LIMITS.maxGoals)).toBe(false);
    expect(canAddCategory(free, FREE_LIMITS.maxCustomCategories)).toBe(false);
  });
});
