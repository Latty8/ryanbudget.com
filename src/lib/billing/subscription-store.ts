/**
 * Subscription persistence — MongoDB when configured, in-memory fallback.
 */
import { connectMongo } from "@/lib/mongodb/connect";
import { UserModel } from "@/lib/mongodb/models/User";
import { isMongoDBConfigured } from "@/lib/db/config";
import { stripePriceIds } from "@/lib/billing/plans";
import { hasStripe } from "@/lib/stripe/client";
import type { SubscriptionStatus, UserSubscription } from "@/types/billing";
import mongoose from "mongoose";

const memory = new Map<string, UserSubscription>();

const FREE: UserSubscription = { tier: "free", status: "none" };

function isGrantListedEmail(email: string): boolean {
  const raw = process.env.GRANT_PREMIUM_EMAILS ?? "";
  const normalized = email.trim().toLowerCase();
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

function fromMongoUser(user: {
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPeriodEnd?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): UserSubscription {
  if (user.subscriptionTier === "premium") {
    return {
      tier: "premium",
      status: (user.subscriptionStatus as SubscriptionStatus) || "active",
      stripeCustomerId: user.stripeCustomerId ?? undefined,
      stripeSubscriptionId: user.stripeSubscriptionId ?? undefined,
      currentPeriodEnd: user.subscriptionPeriodEnd?.toISOString(),
    };
  }
  return FREE;
}

async function persistToMongo(userId: string, sub: UserSubscription): Promise<void> {
  if (!isMongoDBConfigured() || !mongoose.isValidObjectId(userId)) return;
  await connectMongo();
  await UserModel.updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        subscriptionTier: sub.tier,
        subscriptionStatus: sub.status,
        subscriptionPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
        stripeCustomerId: sub.stripeCustomerId ?? null,
        stripeSubscriptionId: sub.stripeSubscriptionId ?? null,
      },
    }
  );
}

export async function getSubscription(
  userId: string,
  email?: string | null
): Promise<UserSubscription> {
  if (email && isGrantListedEmail(email)) {
    return { tier: "premium", status: "active" };
  }

  if (isMongoDBConfigured() && mongoose.isValidObjectId(userId)) {
    await connectMongo();
    const user = await UserModel.findById(userId)
      .select(
        "subscriptionTier subscriptionStatus subscriptionPeriodEnd stripeCustomerId stripeSubscriptionId email"
      )
      .lean();
    if (user) {
      if (user.email && isGrantListedEmail(user.email)) {
        return { tier: "premium", status: "active" };
      }
      const sub = fromMongoUser(user);
      memory.set(userId, sub);
      return sub;
    }
  }

  return memory.get(userId) ?? FREE;
}

export async function setSubscription(userId: string, sub: UserSubscription): Promise<void> {
  memory.set(userId, sub);
  await persistToMongo(userId, sub);
}

/** Grant Premium without Stripe (dev / owner / misconfigured billing). */
export async function grantPremium(
  userId: string,
  patch: Partial<UserSubscription> = {}
): Promise<UserSubscription> {
  const sub: UserSubscription = {
    tier: "premium",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    ...patch,
  };
  await setSubscription(userId, sub);
  return sub;
}

export function isStripeCheckoutReady(interval: "monthly" | "annual"): boolean {
  if (!hasStripe) return false;
  const prices = stripePriceIds();
  const priceId = interval === "annual" ? prices.annual : prices.monthly;
  return Boolean(priceId && !priceId.includes("REPLACE"));
}
