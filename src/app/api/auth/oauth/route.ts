import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import type { SessionPayload } from "@/lib/auth/session";
import { ensureUserProfile, isSyncAvailable } from "@/lib/db/sync-server";

/** After client-side Supabase OAuth exchange, verify JWT and set app session. */
export async function POST(request: Request) {
  const body = (await request.json()) as { access_token?: string };
  const accessToken = body.access_token?.trim();
  if (!accessToken) {
    return NextResponse.json({ ok: false, message: "Missing access token." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, message: "Supabase not configured." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user?.email) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? "Invalid session." },
      { status: 401 }
    );
  }

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0] ??
      "User",
    isDemo: false,
  };

  if (isSyncAvailable()) {
    await ensureUserProfile(payload.userId, payload.email, payload.name);
  }

  const response = NextResponse.json({ ok: true, user: payload });
  return attachSessionCookies(response, payload);
}
