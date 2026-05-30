import { NextResponse, type NextRequest } from "next/server";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import {
  OAUTH_NEXT_COOKIE,
  readOAuthReturnPath,
} from "@/lib/auth/oauth-return-path";
import type { SessionPayload } from "@/lib/auth/session";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

function getSiteOrigin(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    request.nextUrl.origin
  ).replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const origin = getSiteOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const authError =
    request.nextUrl.searchParams.get("error_description") ??
    request.nextUrl.searchParams.get("error");
  const next = readOAuthReturnPath(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);
  const onboarded = request.cookies.get("planner-onboarded")?.value === "true";
  const redirectPath = onboarded ? next : "/onboarding";

  if (authError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(authError)}`
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_oauth_code`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
  }

  let response = NextResponse.redirect(`${origin}${redirectPath}`);
  const supabase = createSupabaseRouteClient(request, response);
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
  }

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

  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return attachSessionCookies(response, payload);
}
