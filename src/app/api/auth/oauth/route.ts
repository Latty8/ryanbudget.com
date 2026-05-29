import { NextResponse } from "next/server";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import type { SessionPayload } from "@/lib/auth/session";

/** After client-side Supabase OAuth, set the app session cookie. */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    email?: string;
    name?: string;
  };

  const email = body.email?.trim().toLowerCase();
  if (!body.userId || !email) {
    return NextResponse.json({ ok: false, message: "Invalid user payload." }, { status: 400 });
  }

  const payload: SessionPayload = {
    userId: body.userId,
    email,
    name: body.name?.trim() || email.split("@")[0] || "User",
    isDemo: false,
  };

  const response = NextResponse.json({ ok: true, user: payload });
  return attachSessionCookies(response, payload);
}
