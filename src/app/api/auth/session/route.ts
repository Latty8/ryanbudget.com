import { NextResponse } from "next/server";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { authenticateUser } from "@/lib/mongodb/auth";
import { isMongoDBConfigured } from "@/lib/db/config";
import { setOnboardingCompleted, isSyncAvailable } from "@/lib/db/sync-server";
import { readSession } from "@/lib/auth/read-session";
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

  if (isMongoDBConfigured() && !requestDemo && !email.includes("demo@")) {
    if (!password) {
      return NextResponse.json({ ok: false, message: "Password is required." }, { status: 400 });
    }

    try {
      const auth = await authenticateUser(email, password);
      if (!auth.ok) {
        return NextResponse.json({ ok: false, message: auth.message }, { status: 401 });
      }

      const payload: SessionPayload = {
        userId: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        isDemo: false,
      };

      const response = NextResponse.json({ ok: true, user: payload, mode: "live" });
      return attachSessionCookies(response, payload);
    } catch (error) {
      console.error("[auth/session]", error);
      return NextResponse.json(
        { ok: false, message: "Could not connect to the database. Check server logs." },
        { status: 503 }
      );
    }
  }

  // Demo / offline fallback when MongoDB is not configured.
  if (password.length < 4) {
    return NextResponse.json(
      { ok: false, message: "Use at least 8 characters for your password." },
      { status: 400 }
    );
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
    const session = await readSession();
    if (session?.userId && !isDemoUserId(session.userId) && isSyncAvailable()) {
      await setOnboardingCompleted(session.userId, true);
    }
  } else if (body.onboarded === false) {
    response.cookies.delete(ONBOARDED_COOKIE);
    const session = await readSession();
    if (session?.userId && !isDemoUserId(session.userId) && isSyncAvailable()) {
      await setOnboardingCompleted(session.userId, false);
    }
  }

  return response;
}

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: session });
}
