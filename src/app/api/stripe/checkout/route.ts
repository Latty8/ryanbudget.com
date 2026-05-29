import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";
import { stripePriceIds } from "@/lib/billing/plans";
import { stripe, hasStripe } from "@/lib/stripe/client";
import { getSubscription, setSubscription } from "@/lib/billing/subscription-store";

async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as SessionPayload;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as { interval?: "monthly" | "annual" };
  const interval = body.interval ?? "monthly";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!hasStripe || !stripe) {
    setSubscription(session.userId, {
      tier: "premium",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    return NextResponse.json({
      ok: true,
      demo: true,
      url: `${siteUrl}/settings?upgraded=1`,
    });
  }

  const prices = stripePriceIds();
  const priceId = interval === "annual" ? prices.annual : prices.monthly;
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
  }

  const existing = getSubscription(session.userId);
  let customerId = existing.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: session.name,
      metadata: { userId: session.userId },
    });
    customerId = customer.id;
    setSubscription(session.userId, { ...existing, stripeCustomerId: customerId });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/settings?upgraded=1`,
    cancel_url: `${siteUrl}/pricing?canceled=1`,
    metadata: { userId: session.userId },
  });

  return NextResponse.json({ url: checkout.url });
}
