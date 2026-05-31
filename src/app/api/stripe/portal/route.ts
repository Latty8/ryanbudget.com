import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";
import { stripe, hasStripe } from "@/lib/stripe/client";
import { getSubscription } from "@/lib/billing/subscription-store";

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

export async function POST() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sub = await getSubscription(session.userId, session.email);

  if (!hasStripe || !stripe || !sub.stripeCustomerId) {
    return NextResponse.json({ url: `${siteUrl}/pricing` });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${siteUrl}/settings`,
  });

  return NextResponse.json({ url: portal.url });
}
