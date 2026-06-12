import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, sessionPayloadFromNextAuth } from "@/lib/auth";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import { isDemoSession } from "@/lib/auth/demo-mode";
import { readSession } from "@/lib/auth/read-session";

function hasNextAuthSecret(): boolean {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

/** Bridge NextAuth JWT session → planner-session cookie for API routes. */
export async function POST() {
  const nextAuthSession = hasNextAuthSecret()
    ? await getServerSession(authOptions).catch(() => null)
    : null;
  const nextPayload = nextAuthSession ? sessionPayloadFromNextAuth(nextAuthSession) : null;
  const existing = await readSession();

  if (nextPayload) {
    const shouldReplace =
      !existing ||
      isDemoSession(existing) ||
      existing.userId !== nextPayload.userId;
    if (shouldReplace) {
      const response = NextResponse.json({ ok: true, user: nextPayload });
      return attachSessionCookies(response, nextPayload);
    }
  }

  if (existing?.userId) {
    return NextResponse.json({ ok: true, user: existing });
  }

  return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
}

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: session });
}
