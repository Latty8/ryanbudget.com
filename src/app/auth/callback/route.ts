import { NextResponse } from "next/server";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import type { SessionPayload } from "@/lib/auth/session";
import { createClient } from "@supabase/supabase-js";

function getSiteOrigin(request: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    new URL(request.url).origin
  ).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = getSiteOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const authError = requestUrl.searchParams.get("error_description");

  if (authError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(authError)}`
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!code || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=missing_oauth_code`);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
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

  const redirectPath = next.startsWith("/") ? next : "/dashboard";
  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  return attachSessionCookies(response, payload);
}
