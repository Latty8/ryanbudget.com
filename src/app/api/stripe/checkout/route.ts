import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { stripePriceIds } from "@/lib/billing/plans";
import {
  getSubscription,
  grantPremium,
  isStripeCheckoutReady,
  setSubscription,
} from "@/lib/billing/subscription-store";
import { stripe, hasStripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { interval?: "monthly" | "annual" };
    const interval = body.interval === "annual" ? "annual" : "monthly";
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

    if (!isStripeCheckoutReady(interval)) {
      await grantPremium(session.userId);
      return NextResponse.json({
        ok: true,
        granted: true,
        url: `${siteUrl}/settings?upgraded=1`,
      });
    }

    if (!hasStripe || !stripe) {
      await grantPremium(session.userId);
      return NextResponse.json({
        ok: true,
        granted: true,
        url: `${siteUrl}/settings?upgraded=1`,
      });
    }

    const prices = stripePriceIds();
    const priceId = interval === "annual" ? prices.annual : prices.monthly;
    if (!priceId) {
      await grantPremium(session.userId);
      return NextResponse.json({
        ok: true,
        granted: true,
        url: `${siteUrl}/settings?upgraded=1`,
      });
    }

    const existing = await getSubscription(session.userId, session.email);
    let customerId = existing.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.email,
        name: session.name,
        metadata: { userId: session.userId },
      });
      customerId = customer.id;
      await setSubscription(session.userId, { ...existing, stripeCustomerId: customerId });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/settings?upgraded=1`,
      cancel_url: `${siteUrl}/pricing?canceled=1`,
      metadata: { userId: session.userId },
    });

    if (!checkout.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (error) {
    console.error("[stripe/checkout]", error);
    return NextResponse.json(
      { error: "Checkout failed. If Stripe is not fully configured, remove STRIPE_SECRET_KEY from .env.production and try again." },
      { status: 500 }
    );
  }
}
