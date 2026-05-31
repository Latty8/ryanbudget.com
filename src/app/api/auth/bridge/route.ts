import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, sessionPayloadFromNextAuth } from "@/lib/auth";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import { readSession } from "@/lib/auth/read-session";

/** Bridge NextAuth JWT session → planner-session cookie for API routes. */
export async function POST() {
  const existing = await readSession();
  if (existing?.userId) {
    return NextResponse.json({ ok: true, user: existing });
  }

  const nextAuthSession = await getServerSession(authOptions);
  const payload = nextAuthSession ? sessionPayloadFromNextAuth(nextAuthSession) : null;
  if (!payload) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user: payload });
  return attachSessionCookies(response, payload);
}

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: session });
}
