import { NextResponse } from "next/server";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import { hasSupabaseEnv, supabase } from "@/lib/supabase/client";
import { DEMO_MODE_COOKIE, ONBOARDED_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/session";



export async function POST(request: Request) {

  const body = (await request.json()) as {

    email?: string;

    password?: string;

    demo?: boolean;

  };

  const email = body.email?.trim().toLowerCase();

  const password = body.password ?? "";

  const requestDemo = body.demo === true;



  if (!email) {

    return NextResponse.json({ ok: false, message: "Email is required." }, { status: 400 });

  }



  if (hasSupabaseEnv && supabase) {

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {

      return NextResponse.json(

        {

          ok: false,

          message:

            "Invalid email or password. New accounts are invite-only — contact support if you need access.",

        },

        { status: 401 }

      );

    }

    const user = data.user;

    if (!user) {

      return NextResponse.json({ ok: false, message: "Unable to sign in." }, { status: 401 });

    }

    const payload: SessionPayload = {

      userId: user.id,

      email: user.email ?? email,

      name: user.user_metadata?.name || email.split("@")[0] || "User",

      isDemo: requestDemo,

    };

    const response = NextResponse.json({ ok: true, user: payload, mode: requestDemo ? "demo" : "live" });

    return attachSessionCookies(response, payload, { demo: requestDemo });

  }



  // Demo / local auth when Supabase is not configured.

  if (password.length < 4) {

    return NextResponse.json({ ok: false, message: "Use at least 4 characters for your password." }, { status: 400 });

  }



  const isDemo = requestDemo || email.includes("demo@");

  const payload: SessionPayload = {

    userId: `demo-${email}`,

    email,

    name: email.split("@")[0] || "User",

    isDemo,

  };

  const response = NextResponse.json({ ok: true, user: payload, mode: "demo" });

  return attachSessionCookies(response, payload, { demo: isDemo });

}



export async function DELETE() {

  const response = NextResponse.json({ ok: true });

  response.cookies.delete(SESSION_COOKIE);

  response.cookies.delete(ONBOARDED_COOKIE);

  response.cookies.delete(DEMO_MODE_COOKIE);

  return response;

}



export async function PATCH(request: Request) {

  const body = (await request.json()) as { onboarded?: boolean };

  const response = NextResponse.json({ ok: true });

  if (body.onboarded === true) {
    response.cookies.set(ONBOARDED_COOKIE, "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else if (body.onboarded === false) {
    response.cookies.delete(ONBOARDED_COOKIE);
  }

  return response;

}


