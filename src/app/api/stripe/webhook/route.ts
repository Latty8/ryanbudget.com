import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, hasStripe } from "@/lib/stripe/client";
import { setSubscription } from "@/lib/billing/subscription-store";

export async function POST(request: Request) {
  if (!hasStripe || !stripe) {
    return NextResponse.json({ received: true });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId) {
      await setSubscription(userId, {
        tier: "premium",
        status: "active",
        stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : undefined,
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (userId) {
      const active = subscription.status === "active" || subscription.status === "trialing";
      await setSubscription(userId, {
        tier: active ? "premium" : "free",
        status: subscription.status as "active" | "canceled" | "past_due",
        stripeCustomerId:
          typeof subscription.customer === "string" ? subscription.customer : undefined,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd:
          "current_period_end" in subscription && typeof subscription.current_period_end === "number"
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined,
      });
    }
  }

  return NextResponse.json({ received: true });
}
