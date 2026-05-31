import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_MODE_COOKIE, SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";
import { isDemoSession } from "@/lib/auth/demo-mode";
import { getSubscription } from "@/lib/billing/subscription-store";

export async function GET() {
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get(DEMO_MODE_COOKIE)?.value === "true";
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  let session: SessionPayload | null = null;
  if (raw) {
    try {
      session = JSON.parse(decodeURIComponent(raw)) as SessionPayload;
    } catch {
      session = null;
    }
  }

  if (demoCookie || isDemoSession(session)) {
    return NextResponse.json({ tier: "premium", status: "active" });
  }

  const userId = session?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ tier: "free", status: "none" });
  }

  return NextResponse.json(await getSubscription(userId, session?.email));
}
