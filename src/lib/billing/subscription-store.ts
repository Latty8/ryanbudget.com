/**
 * In-memory subscription map for demo / single-server deployments.
 * Replace with Supabase `subscriptions` table in production.
 */
import type { UserSubscription } from "@/types/billing";

const subscriptions = new Map<string, UserSubscription>();

export function getSubscription(userId: string): UserSubscription {
  return (
    subscriptions.get(userId) ?? {
      tier: "free",
      status: "none",
    }
  );
}

export function setSubscription(userId: string, sub: UserSubscription) {
  subscriptions.set(userId, sub);
}
